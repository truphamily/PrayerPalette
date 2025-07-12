import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { insertCategorySchema, insertPrayerCardSchema, insertPrayerRequestSchema, insertUserReminderSettingsSchema } from "@shared/schema";
import { testDatabaseConnection } from "./db";
import { z } from "zod";

// Set up multer for profile image uploads
const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection first
  console.log("Testing database connection...");
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.warn("Database connection test failed, but continuing startup...");
  }

  // Serve uploaded profile images
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // Auth middleware
  await setupAuth(app);

  // Initialize default categories in background with delay
  setTimeout(() => {
    initializeDefaultCategories().catch(err => {
      console.error("Background initialization failed:", err);
    });
  }, 2000); // 2 second delay to allow connections to stabilize

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Profile image upload route
  app.post('/api/auth/profile-image', isAuthenticated, upload.single('profileImage'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Generate unique filename
      const filename = `${userId}-${Date.now()}.webp`;
      const filepath = path.join(uploadDir, filename);
      
      // Process image with sharp (resize and optimize)
      await sharp(req.file.buffer)
        .resize(200, 200, { 
          fit: 'cover',
          position: 'center'
        })
        .webp({ quality: 85 })
        .toFile(filepath);

      // Update user profile with new image URL
      const profileImageUrl = `/uploads/profiles/${filename}`;
      const updatedUser = await storage.updateUserProfileImage(userId, profileImageUrl);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "Profile image updated successfully",
        profileImageUrl: updatedUser.profileImageUrl 
      });
    } catch (error) {
      console.error("Error uploading profile image:", error);
      res.status(500).json({ message: "Failed to upload profile image" });
    }
  });

  // Categories routes
  app.get("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories = await storage.getCategories(userId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertCategorySchema.parse({ ...req.body, userId });
      const category = await storage.createCategory(validatedData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid category data", errors: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  // Prayer cards routes
  app.get("/api/prayer-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const frequency = req.query.frequency as string;
      const dayOfWeek = req.query.dayOfWeek as string;
      const dayOfMonth = req.query.dayOfMonth as string;
      
      let prayerCards;
      if (frequency === "daily") {
        // Optimize daily prayers by getting all needed data in parallel
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const todayDate = new Date().getDate();
        
        const [dailyCards, weeklyCards, monthlyCards] = await Promise.all([
          storage.getPrayerCardsByFrequency(userId, "daily"),
          storage.getPrayerCardsByFrequencyAndDay(userId, "weekly", today),
          storage.getPrayerCardsByFrequencyAndMonth(userId, "monthly", todayDate)
        ]);
        
        // Combine and randomize if needed
        if (dailyCards.length <= 3) {
          prayerCards = [...dailyCards, ...weeklyCards, ...monthlyCards];
        } else {
          // Simple shuffle using date as seed
          const dateString = new Date().toISOString().split('T')[0];
          const dateSeed = dateString.split('-').join('');
          const shuffled = [...dailyCards];
          
          // Fisher-Yates shuffle with seeded random
          let seed = parseInt(dateSeed);
          for (let i = shuffled.length - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            const j = Math.floor((seed / 233280) * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          
          prayerCards = [...shuffled.slice(0, 3), ...weeklyCards, ...monthlyCards];
        }
      } else if (frequency) {
        if (frequency === "weekly" && dayOfWeek) {
          prayerCards = await storage.getPrayerCardsByFrequencyAndDay(userId, frequency, dayOfWeek);
        } else if (frequency === "monthly" && dayOfMonth) {
          prayerCards = await storage.getPrayerCardsByFrequencyAndMonth(userId, frequency, parseInt(dayOfMonth));
        } else {
          prayerCards = await storage.getPrayerCardsByFrequency(userId, frequency);
        }
      } else {
        prayerCards = await storage.getPrayerCards(userId);
      }
      
      res.json(prayerCards);
    } catch (error) {
      console.error("Error fetching prayer cards:", error);
      res.status(500).json({ message: "Failed to fetch prayer cards" });
    }
  });

  app.get("/api/prayer-cards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
      const prayerCard = await storage.getPrayerCard(cardId, userId);
      
      if (!prayerCard) {
        return res.status(404).json({ message: "Prayer card not found" });
      }
      
      res.json(prayerCard);
    } catch (error) {
      console.error("Error fetching prayer card:", error);
      res.status(500).json({ message: "Failed to fetch prayer card" });
    }
  });

  app.post("/api/prayer-cards", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating prayer card for user:", userId);
      console.log("Request body:", req.body);
      
      const validatedData = insertPrayerCardSchema.parse({ ...req.body, userId });
      console.log("Validated data:", validatedData);
      
      const prayerCard = await storage.createPrayerCard(validatedData);
      console.log("Created prayer card:", prayerCard);
      
      // Ensure we set proper JSON content type
      res.setHeader('Content-Type', 'application/json');
      
      // Ensure we return valid JSON and don't double-send response
      if (!res.headersSent) {
        console.log("Sending successful response...");
        res.status(201).json(prayerCard);
        console.log("Response sent successfully");
      } else {
        console.log("Headers already sent, skipping response");
      }
    } catch (error) {
      console.error("Error creating prayer card:", error);
      
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(400).json({ message: "Invalid prayer card data", errors: error.errors });
        }
        return;
      }
      
      // Check if response has already been sent
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ message: "Failed to create prayer card" });
      }
    }
  });

  app.put("/api/prayer-cards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
      const validatedData = insertPrayerCardSchema.partial().parse(req.body);
      const updatedCard = await storage.updatePrayerCard(cardId, validatedData, userId);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Prayer card not found" });
      }
      
      res.json(updatedCard);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prayer card data", errors: error.errors });
      }
      console.error("Error updating prayer card:", error);
      res.status(500).json({ message: "Failed to update prayer card" });
    }
  });

  app.delete("/api/prayer-cards/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
      const deleted = await storage.deletePrayerCard(cardId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Prayer card not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting prayer card:", error);
      res.status(500).json({ message: "Failed to delete prayer card" });
    }
  });

  // Prayer requests routes
  app.get("/api/prayer-cards/:id/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
      const requests = await storage.getPrayerRequests(cardId, userId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching prayer requests:", error);
      res.status(500).json({ message: "Failed to fetch prayer requests" });
    }
  });

  app.post("/api/prayer-cards/:id/requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
      
      // Verify the prayer card belongs to the user
      const prayerCard = await storage.getPrayerCard(cardId, userId);
      if (!prayerCard) {
        return res.status(404).json({ message: "Prayer card not found" });
      }
      
      const validatedData = insertPrayerRequestSchema.parse({ ...req.body, prayerCardId: cardId });
      const request = await storage.createPrayerRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prayer request data", errors: error.errors });
      }
      console.error("Error creating prayer request:", error);
      res.status(500).json({ message: "Failed to create prayer request" });
    }
  });

  app.put("/api/prayer-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      
      const validatedData = insertPrayerRequestSchema.partial().parse(req.body);
      const updated = await storage.updatePrayerRequest(requestId, validatedData, userId);
      
      if (!updated) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid prayer request data", errors: error.errors });
      }
      console.error("Error updating prayer request:", error);
      res.status(500).json({ message: "Failed to update prayer request" });
    }
  });

  app.put("/api/prayer-requests/:id/archive", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      const archived = await storage.archivePrayerRequest(requestId, userId);
      
      if (!archived) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error archiving prayer request:", error);
      res.status(500).json({ message: "Failed to archive prayer request" });
    }
  });

  app.delete("/api/prayer-requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const requestId = parseInt(req.params.id);
      const deleted = await storage.deletePrayerRequest(requestId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Prayer request not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting prayer request:", error);
      res.status(500).json({ message: "Failed to delete prayer request" });
    }
  });

  // Legacy prayer requests endpoint (for backward compatibility)
  app.post("/api/prayer-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating prayer request for user:", userId);
      console.log("Request body:", req.body);
      
      // Don't add userId to prayer request - it's not in the schema
      const validatedData = insertPrayerRequestSchema.parse({
        ...req.body,
        isArchived: false,
      });
      
      console.log("Validated request data:", validatedData);
      const request = await storage.createPrayerRequest(validatedData);
      console.log("Created prayer request:", request);
      
      // Ensure proper JSON response
      res.setHeader('Content-Type', 'application/json');
      if (!res.headersSent) {
        res.status(201).json(request);
        console.log("Prayer request response sent successfully");
      }
    } catch (error) {
      console.error("Error creating prayer request:", error);
      
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        if (!res.headersSent) {
          res.setHeader('Content-Type', 'application/json');
          return res.status(400).json({ message: "Invalid prayer request data", errors: error.errors });
        }
        return;
      }
      
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).json({ message: "Failed to create prayer request" });
      }
    }
  });

  // Scripture search route
  app.get("/api/scripture/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      // Use ESV API for scripture search
      const esvApiKey = process.env.ESV_API_KEY || process.env.VITE_ESV_API_KEY || "TEST_API_KEY";
      const response = await fetch(`https://api.esv.org/v3/passage/search/?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Token ${esvApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ESV API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error searching scripture:", error);
      res.status(500).json({ message: "Failed to search scripture" });
    }
  });

  app.get("/api/scripture/text", isAuthenticated, async (req, res) => {
    try {
      const reference = req.query.ref as string;
      if (!reference) {
        return res.status(400).json({ message: "Scripture reference is required" });
      }

      const esvApiKey = process.env.ESV_API_KEY || process.env.VITE_ESV_API_KEY || "TEST_API_KEY";
      const response = await fetch(`https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false`, {
        headers: {
          'Authorization': `Token ${esvApiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ESV API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching scripture text:", error);
      res.status(500).json({ message: "Failed to fetch scripture text" });
    }
  });

  // Reminder settings routes
  app.get("/api/reminder-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getReminderSettings(userId);
      
      if (!settings) {
        // Return default settings if none exist
        return res.json({
          userId,
          enableReminders: false,
          reminderTimes: [],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York",
          enableBrowserNotifications: false
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching reminder settings:", error);
      res.status(500).json({ message: "Failed to fetch reminder settings" });
    }
  });

  app.put("/api/reminder-settings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertUserReminderSettingsSchema.parse({
        ...req.body,
        userId
      });
      
      const settings = await storage.upsertReminderSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid reminder settings data", errors: error.errors });
      }
      console.error("Error updating reminder settings:", error);
      res.status(500).json({ message: "Failed to update reminder settings" });
    }
  });

  // Prayer stats endpoints
  app.get('/api/prayer-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let stats = await storage.getPrayerStats(userId);
      
      // Initialize stats if they don't exist
      if (!stats) {
        stats = await storage.upsertPrayerStats({
          userId,
          totalPrayers: 0,
          currentLevel: 1,
        });
      }
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching prayer stats:", error);
      res.status(500).json({ message: "Failed to fetch prayer stats" });
    }
  });

  // Prayer log endpoint (optimized)
  app.post('/api/prayer-cards/:id/pray', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayerCardId = parseInt(req.params.id);

      // Use optimized method that combines all operations
      const result = await storage.markPrayerComplete(userId, prayerCardId);
      
      if (result.alreadyPrayed) {
        return res.status(400).json({ message: "Already prayed for this card today" });
      }

      res.json({ success: true, stats: result.stats });
    } catch (error) {
      console.error("Error logging prayer:", error);
      res.status(500).json({ message: "Failed to log prayer" });
    }
  });

  // Check if prayed this frequency period endpoint
  app.get('/api/prayer-cards/:id/prayed-today', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayerCardId = parseInt(req.params.id);
      
      const hasPrayedToday = await storage.hasPrayedToday(userId, prayerCardId);
      res.json({ hasPrayedToday });
    } catch (error) {
      console.error("Error checking prayer status:", error);
      res.status(500).json({ message: "Failed to check prayer status" });
    }
  });

  // Get prayer status for multiple cards at once (optimized batch endpoint)
  app.post('/api/prayer-cards/batch-prayed-status', isAuthenticated, async (req: any, res) => {
    try {
      const { cardIds } = req.body;
      const userId = req.user.claims.sub;
      
      if (!Array.isArray(cardIds)) {
        return res.status(400).json({ message: "cardIds must be an array" });
      }
      
      // Use optimized single-query batch method
      const statusMap = await storage.batchCheckPrayedStatus(userId, cardIds);
      
      res.json(statusMap);
    } catch (error) {
      console.error("Error checking batch prayer status:", error);
      res.status(500).json({ message: "Failed to check batch prayer status" });
    }
  });

  // Undo prayer log endpoint
  app.delete('/api/prayer-cards/:id/pray', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayerCardId = parseInt(req.params.id);
      
      const success = await storage.undoPrayerLog(userId, prayerCardId);
      if (!success) {
        return res.status(404).json({ message: "No prayer log found to undo" });
      }
      
      // Get updated stats
      const stats = await storage.getPrayerStats(userId);
      
      res.json({ success: true, stats });
    } catch (error) {
      console.error("Error undoing prayer:", error);
      res.status(500).json({ message: "Failed to undo prayer" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeDefaultCategories() {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      console.log(`Attempting to initialize default categories (attempt ${attempt + 1}/${maxRetries})`);
      
      const existingCategories = await storage.getDefaultCategories();
      if (existingCategories.length === 0) {
        const defaultCategories = [
          { name: "Family", color: "#10B981", icon: "fas fa-home", isDefault: true, userId: null },
          { name: "Friends", color: "#F59E0B", icon: "fas fa-users", isDefault: true, userId: null },
          { name: "Personal", color: "#EF4444", icon: "fas fa-heart", isDefault: true, userId: null },
          { name: "Work", color: "#8B5CF6", icon: "fas fa-briefcase", isDefault: true, userId: null },
          { name: "Non Believer", color: "#EC4899", icon: "fas fa-cross", isDefault: true, userId: null },
          { name: "Small Group", color: "#06B6D4", icon: "fas fa-church", isDefault: true, userId: null },
          { name: "World Issues", color: "#DC2626", icon: "fas fa-globe", isDefault: true, userId: null },
          { name: "Leadership", color: "#6B73FF", icon: "fas fa-crown", isDefault: true, userId: null },
        ];

        for (const category of defaultCategories) {
          await storage.createCategory(category);
        }
        console.log("Default categories initialized successfully");
      } else {
        console.log(`Found ${existingCategories.length} existing default categories`);
      }
      
      return; // Success, exit the retry loop
    } catch (error) {
      attempt++;
      console.error(`Error initializing default categories (attempt ${attempt}):`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error("Failed to initialize default categories after all retries");
      }
    }
  }
}
