var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";

// server/routes.ts
import express from "express";
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  categories: () => categories,
  categoriesRelations: () => categoriesRelations,
  insertCategorySchema: () => insertCategorySchema,
  insertPrayerCardSchema: () => insertPrayerCardSchema,
  insertPrayerLogSchema: () => insertPrayerLogSchema,
  insertPrayerRequestSchema: () => insertPrayerRequestSchema,
  insertUserPrayerStatsSchema: () => insertUserPrayerStatsSchema,
  insertUserReminderSettingsSchema: () => insertUserReminderSettingsSchema,
  prayerCards: () => prayerCards,
  prayerCardsRelations: () => prayerCardsRelations,
  prayerLogs: () => prayerLogs,
  prayerLogsRelations: () => prayerLogsRelations,
  prayerRequests: () => prayerRequests,
  prayerRequestsRelations: () => prayerRequestsRelations,
  sessions: () => sessions,
  upsertUserSchema: () => upsertUserSchema,
  userPrayerStats: () => userPrayerStats,
  userPrayerStatsRelations: () => userPrayerStatsRelations,
  userReminderSettings: () => userReminderSettings,
  userReminderSettingsRelations: () => userReminderSettingsRelations,
  users: () => users,
  usersRelations: () => usersRelations
});
import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  isDefault: boolean("is_default").default(false),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow()
});
var prayerCards = pgTable("prayer_cards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(),
  // 'daily', 'weekly', 'monthly'
  dayOfWeek: varchar("day_of_week", { length: 20 }),
  // for weekly prayers
  dayOfMonth: integer("day_of_month"),
  // for monthly prayers (1-31) - kept for backward compatibility
  daysOfMonth: integer("days_of_month").array(),
  // for multiple monthly prayer days (1-31)
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  scriptures: text("scriptures").array(),
  scriptureReferences: varchar("scripture_references", { length: 100 }).array(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  prayerCardId: integer("prayer_card_id").notNull().references(() => prayerCards.id, { onDelete: "cascade" }),
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow()
});
var userReminderSettings = pgTable("user_reminder_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  enableReminders: boolean("enable_reminders").default(false),
  reminderTimes: text("reminder_times").array().default([]),
  // Array of time strings like ["09:00", "18:00"]
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  enableBrowserNotifications: boolean("enable_browser_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var userPrayerStats = pgTable("user_prayer_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  totalPrayers: integer("total_prayers").default(0),
  currentLevel: integer("current_level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var prayerLogs = pgTable("prayer_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  prayerCardId: integer("prayer_card_id").references(() => prayerCards.id, { onDelete: "cascade" }).notNull(),
  prayedAt: timestamp("prayed_at").defaultNow()
});
var usersRelations = relations(users, ({ many, one }) => ({
  prayerCards: many(prayerCards),
  categories: many(categories),
  reminderSettings: one(userReminderSettings),
  prayerStats: one(userPrayerStats),
  prayerLogs: many(prayerLogs)
}));
var categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id]
  }),
  prayerCards: many(prayerCards)
}));
var prayerCardsRelations = relations(prayerCards, ({ one, many }) => ({
  user: one(users, {
    fields: [prayerCards.userId],
    references: [users.id]
  }),
  category: one(categories, {
    fields: [prayerCards.categoryId],
    references: [categories.id]
  }),
  prayerRequests: many(prayerRequests),
  prayerLogs: many(prayerLogs)
}));
var prayerRequestsRelations = relations(prayerRequests, ({ one }) => ({
  prayerCard: one(prayerCards, {
    fields: [prayerRequests.prayerCardId],
    references: [prayerCards.id]
  })
}));
var userReminderSettingsRelations = relations(userReminderSettings, ({ one }) => ({
  user: one(users, {
    fields: [userReminderSettings.userId],
    references: [users.id]
  })
}));
var userPrayerStatsRelations = relations(userPrayerStats, ({ one }) => ({
  user: one(users, {
    fields: [userPrayerStats.userId],
    references: [users.id]
  })
}));
var prayerLogsRelations = relations(prayerLogs, ({ one }) => ({
  user: one(users, {
    fields: [prayerLogs.userId],
    references: [users.id]
  }),
  prayerCard: one(prayerCards, {
    fields: [prayerLogs.prayerCardId],
    references: [prayerCards.id]
  })
}));
var insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true
});
var insertPrayerCardSchema = createInsertSchema(prayerCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPrayerRequestSchema = createInsertSchema(prayerRequests).omit({
  id: true,
  createdAt: true,
  archivedAt: true
});
var upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true
});
var insertUserReminderSettingsSchema = createInsertSchema(userReminderSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertUserPrayerStatsSchema = createInsertSchema(userPrayerStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertPrayerLogSchema = createInsertSchema(prayerLogs).omit({
  id: true,
  prayedAt: true
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws;
}
neonConfig.useSecureWebSocket = true;
neonConfig.pipelineConnect = false;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 3,
  // Allow more connections but keep reasonable
  connectionTimeoutMillis: 1e4,
  idleTimeoutMillis: 3e4,
  // Shorter idle timeout to prevent stale connections
  allowExitOnIdle: false
});
pool.on("error", (err) => {
  console.error("Database pool error:", err);
});
pool.on("connect", () => {
  console.log("Database connected successfully");
});
var db = drizzle({ client: pool, schema: schema_exports });
async function testDatabaseConnection() {
  try {
    const client2 = await pool.connect();
    await client2.query("SELECT 1");
    client2.release();
    console.log("Database connection test successful");
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
}

// server/storage.ts
import { eq, and, or, desc, count, sql, inArray } from "drizzle-orm";
var DatabaseStorage = class {
  // User operations (mandatory for Replit Auth)
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  async upsertUser(userData) {
    const [user] = await db.insert(users).values(userData).onConflictDoUpdate({
      target: users.id,
      set: {
        ...userData,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return user;
  }
  async updateUserProfileImage(userId, profileImageUrl) {
    const [user] = await db.update(users).set({
      profileImageUrl,
      updatedAt: /* @__PURE__ */ new Date()
    }).where(eq(users.id, userId)).returning();
    return user;
  }
  // Category operations
  async getCategories(userId) {
    return await db.select().from(categories).where(
      sql`${categories.userId} = ${userId} OR ${categories.isDefault} = true`
    ).orderBy(categories.isDefault, categories.name);
  }
  async createCategory(category) {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }
  async getDefaultCategories() {
    return await db.select().from(categories).where(eq(categories.isDefault, true));
  }
  // Prayer card operations
  async getPrayerCards(userId) {
    const result = await db.select({
      prayerCard: prayerCards,
      category: categories,
      activeRequestsCount: sql`count(case when ${prayerRequests.isArchived} = false then 1 end)`
    }).from(prayerCards).leftJoin(categories, eq(prayerCards.categoryId, categories.id)).leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId)).where(eq(prayerCards.userId, userId)).groupBy(prayerCards.id, categories.id).orderBy(desc(prayerCards.updatedAt));
    if (result.length === 0) return [];
    const cardIds = result.map((row) => row.prayerCard.id);
    const allRequests = await db.select().from(prayerRequests).where(inArray(prayerRequests.prayerCardId, cardIds)).orderBy(desc(prayerRequests.createdAt));
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {});
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount)
    }));
  }
  async getPrayerCardsByFrequency(userId, frequency) {
    const result = await db.select({
      prayerCard: prayerCards,
      category: categories,
      activeRequestsCount: sql`count(case when ${prayerRequests.isArchived} = false then 1 end)`
    }).from(prayerCards).leftJoin(categories, eq(prayerCards.categoryId, categories.id)).leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId)).where(and(eq(prayerCards.userId, userId), eq(prayerCards.frequency, frequency))).groupBy(prayerCards.id, categories.id).orderBy(desc(prayerCards.updatedAt));
    if (result.length === 0) return [];
    const cardIds = result.map((row) => row.prayerCard.id);
    const allRequests = await db.select().from(prayerRequests).where(inArray(prayerRequests.prayerCardId, cardIds)).orderBy(desc(prayerRequests.createdAt));
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {});
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount)
    }));
  }
  async getPrayerCardsByFrequencyAndDay(userId, frequency, dayOfWeek) {
    const result = await db.select({
      prayerCard: prayerCards,
      category: categories,
      activeRequestsCount: sql`count(case when ${prayerRequests.isArchived} = false then 1 end)`
    }).from(prayerCards).leftJoin(categories, eq(prayerCards.categoryId, categories.id)).leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId)).where(and(
      eq(prayerCards.userId, userId),
      eq(prayerCards.frequency, frequency),
      eq(prayerCards.dayOfWeek, dayOfWeek)
    )).groupBy(prayerCards.id, categories.id).orderBy(desc(prayerCards.updatedAt));
    if (result.length === 0) return [];
    const cardIds = result.map((row) => row.prayerCard.id);
    const allRequests = await db.select().from(prayerRequests).where(inArray(prayerRequests.prayerCardId, cardIds)).orderBy(desc(prayerRequests.createdAt));
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {});
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount)
    }));
  }
  async getPrayerCardsByFrequencyAndMonth(userId, frequency, dayOfMonth) {
    const result = await db.select({
      prayerCard: prayerCards,
      category: categories,
      activeRequestsCount: sql`count(case when ${prayerRequests.isArchived} = false then 1 end)`
    }).from(prayerCards).leftJoin(categories, eq(prayerCards.categoryId, categories.id)).leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId)).where(and(
      eq(prayerCards.userId, userId),
      eq(prayerCards.frequency, frequency),
      or(
        eq(prayerCards.dayOfMonth, dayOfMonth),
        // Backward compatibility
        sql`${dayOfMonth} = ANY(${prayerCards.daysOfMonth})`
        // New multiple days support
      )
    )).groupBy(prayerCards.id, categories.id).orderBy(desc(prayerCards.updatedAt));
    if (result.length === 0) return [];
    const cardIds = result.map((row) => row.prayerCard.id);
    const allRequests = await db.select().from(prayerRequests).where(inArray(prayerRequests.prayerCardId, cardIds)).orderBy(desc(prayerRequests.createdAt));
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {});
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount)
    }));
  }
  async getPrayerCard(id, userId) {
    const [result] = await db.select({
      prayerCard: prayerCards,
      category: categories
    }).from(prayerCards).leftJoin(categories, eq(prayerCards.categoryId, categories.id)).where(and(eq(prayerCards.id, id), eq(prayerCards.userId, userId)));
    if (!result) return void 0;
    const requests = await this.getPrayerRequests(id, userId);
    const activeRequestsCount = requests.filter((r) => !r.isArchived).length;
    return {
      ...result.prayerCard,
      category: result.category,
      prayerRequests: requests,
      activeRequestsCount
    };
  }
  async createPrayerCard(prayerCard) {
    let retries = 3;
    while (retries > 0) {
      try {
        const [newCard] = await db.insert(prayerCards).values(prayerCard).returning();
        return newCard;
      } catch (error) {
        console.error(`Database error (retries left: ${retries - 1}):`, error.message);
        retries--;
        if (retries === 0 || !error.message?.includes("terminating connection")) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1e3));
      }
    }
    throw new Error("Failed to create prayer card after retries");
  }
  async updatePrayerCard(id, updates, userId) {
    const [updated] = await db.update(prayerCards).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(prayerCards.id, id), eq(prayerCards.userId, userId))).returning();
    return updated;
  }
  async deletePrayerCard(id, userId) {
    const result = await db.delete(prayerCards).where(and(eq(prayerCards.id, id), eq(prayerCards.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }
  // Prayer request operations
  async getPrayerRequests(prayerCardId, userId) {
    const result = await db.select().from(prayerRequests).leftJoin(prayerCards, eq(prayerRequests.prayerCardId, prayerCards.id)).where(and(
      eq(prayerRequests.prayerCardId, prayerCardId),
      eq(prayerCards.userId, userId)
    )).orderBy(desc(prayerRequests.createdAt));
    return result.map((row) => row.prayer_requests);
  }
  async createPrayerRequest(request) {
    const [newRequest] = await db.insert(prayerRequests).values(request).returning();
    return newRequest;
  }
  async updatePrayerRequest(id, updates, userId) {
    const existingRequest = await db.select({ id: prayerRequests.id }).from(prayerRequests).leftJoin(prayerCards, eq(prayerRequests.prayerCardId, prayerCards.id)).where(and(
      eq(prayerRequests.id, id),
      eq(prayerCards.userId, userId)
    ));
    if (existingRequest.length === 0) {
      return void 0;
    }
    const [updated] = await db.update(prayerRequests).set(updates).where(eq(prayerRequests.id, id)).returning();
    return updated;
  }
  async archivePrayerRequest(id, userId) {
    const result = await db.update(prayerRequests).set({
      isArchived: true,
      archivedAt: /* @__PURE__ */ new Date()
    }).from(prayerCards).where(and(
      eq(prayerRequests.id, id),
      eq(prayerRequests.prayerCardId, prayerCards.id),
      eq(prayerCards.userId, userId)
    ));
    return (result.rowCount ?? 0) > 0;
  }
  async deletePrayerRequest(id, userId) {
    const request = await db.select({ id: prayerRequests.id }).from(prayerRequests).leftJoin(prayerCards, eq(prayerRequests.prayerCardId, prayerCards.id)).where(and(
      eq(prayerRequests.id, id),
      eq(prayerCards.userId, userId)
    ));
    if (request.length === 0) {
      return false;
    }
    const result = await db.delete(prayerRequests).where(eq(prayerRequests.id, id));
    return (result.rowCount ?? 0) > 0;
  }
  // Reminder settings operations
  async getReminderSettings(userId) {
    const [settings] = await db.select().from(userReminderSettings).where(eq(userReminderSettings.userId, userId));
    return settings;
  }
  async upsertReminderSettings(settings) {
    const existingSettings = await this.getReminderSettings(settings.userId);
    if (existingSettings) {
      const [updated] = await db.update(userReminderSettings).set({ ...settings, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userReminderSettings.userId, settings.userId)).returning();
      return updated;
    } else {
      const [created] = await db.insert(userReminderSettings).values(settings).returning();
      return created;
    }
  }
  // Prayer stats operations
  async getPrayerStats(userId) {
    const [stats] = await db.select().from(userPrayerStats).where(eq(userPrayerStats.userId, userId));
    return stats;
  }
  async upsertPrayerStats(stats) {
    const [result] = await db.insert(userPrayerStats).values(stats).onConflictDoUpdate({
      target: userPrayerStats.userId,
      set: {
        ...stats,
        updatedAt: /* @__PURE__ */ new Date()
      }
    }).returning();
    return result;
  }
  // Prayer log operations
  async createPrayerLog(log2) {
    const [prayerLog] = await db.insert(prayerLogs).values(log2).returning();
    return prayerLog;
  }
  // Ultra-optimized prayer marking with minimal database calls
  async markPrayerComplete(userId, prayerCardId) {
    const today = /* @__PURE__ */ new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const [existingLogResult, currentStats] = await Promise.all([
      db.select({ count: count() }).from(prayerLogs).where(
        and(
          eq(prayerLogs.userId, userId),
          eq(prayerLogs.prayerCardId, prayerCardId),
          sql`${prayerLogs.prayedAt} >= ${startOfToday}`,
          sql`${prayerLogs.prayedAt} < ${endOfToday}`
        )
      ),
      this.getPrayerStats(userId)
    ]);
    if (existingLogResult[0].count > 0) {
      return { success: false, alreadyPrayed: true, stats: currentStats };
    }
    const newTotalPrayers = (currentStats?.totalPrayers || 0) + 1;
    const newLevel = Math.floor(newTotalPrayers / 7) + 1;
    const [prayerLog, updatedStats] = await Promise.all([
      this.createPrayerLog({ userId, prayerCardId }),
      this.upsertPrayerStats({
        userId,
        totalPrayers: newTotalPrayers,
        currentLevel: newLevel
      })
    ]);
    return { success: true, stats: updatedStats };
  }
  // Optimized batch prayer status checking with a single database query
  async batchCheckPrayedStatus(userId, cardIds) {
    if (cardIds.length === 0) return {};
    const today = /* @__PURE__ */ new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const prayedCards = await db.select({
      prayerCardId: prayerLogs.prayerCardId,
      count: count()
    }).from(prayerLogs).where(
      and(
        eq(prayerLogs.userId, userId),
        inArray(prayerLogs.prayerCardId, cardIds),
        sql`${prayerLogs.prayedAt} >= ${startOfToday}`,
        sql`${prayerLogs.prayedAt} < ${endOfToday}`
      )
    ).groupBy(prayerLogs.prayerCardId);
    const statusMap = {};
    cardIds.forEach((cardId) => {
      statusMap[cardId] = false;
    });
    prayedCards.forEach(({ prayerCardId }) => {
      statusMap[prayerCardId] = true;
    });
    return statusMap;
  }
  async hasPrayedToday(userId, prayerCardId) {
    const today = /* @__PURE__ */ new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const [result] = await db.select({ count: count() }).from(prayerLogs).where(
      and(
        eq(prayerLogs.userId, userId),
        eq(prayerLogs.prayerCardId, prayerCardId),
        sql`${prayerLogs.prayedAt} >= ${startOfToday}`,
        sql`${prayerLogs.prayedAt} < ${endOfToday}`
      )
    );
    return result.count > 0;
  }
  async undoPrayerLog(userId, prayerCardId) {
    const [prayerCard] = await db.select().from(prayerCards).where(and(eq(prayerCards.id, prayerCardId), eq(prayerCards.userId, userId)));
    if (!prayerCard) return false;
    const now = /* @__PURE__ */ new Date();
    let periodStart;
    let periodEnd = new Date(now);
    switch (prayerCard.frequency) {
      case "daily":
        periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;
      case "weekly":
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay());
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;
      case "monthly":
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      default:
        periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
    }
    const [recentLog] = await db.select().from(prayerLogs).where(
      and(
        eq(prayerLogs.userId, userId),
        eq(prayerLogs.prayerCardId, prayerCardId),
        sql`${prayerLogs.prayedAt} >= ${periodStart}`,
        sql`${prayerLogs.prayedAt} < ${periodEnd}`
      )
    ).orderBy(desc(prayerLogs.prayedAt)).limit(1);
    if (!recentLog) return false;
    await db.delete(prayerLogs).where(eq(prayerLogs.id, recentLog.id));
    const currentStats = await this.getPrayerStats(userId);
    if (currentStats) {
      const newTotalPrayers = Math.max(0, currentStats.totalPrayers - 1);
      const newLevel = Math.max(1, Math.floor(newTotalPrayers / 7) + 1);
      await this.upsertPrayerStats({
        userId,
        totalPrayers: newTotalPrayers,
        currentLevel: newLevel
      });
    }
    return true;
  }
};
var storage = new DatabaseStorage();

// server/replitAuth.ts
import * as client from "openid-client";
import { Strategy } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}
var getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID
    );
  },
  { maxAge: 3600 * 1e3 }
);
function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  return session({
    secret: process.env.SESSION_SECRET,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: true,
      maxAge: sessionTtl
    }
  });
}
function updateUserSession(user, tokens) {
  user.claims = tokens.claims();
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = user.claims?.exp;
}
async function upsertUser(claims) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"],
    lastName: claims["last_name"],
    profileImageUrl: claims["profile_image_url"]
  });
}
async function setupAuth(app2) {
  app2.set("trust proxy", 1);
  app2.use(getSession());
  app2.use(passport.initialize());
  app2.use(passport.session());
  const config = await getOidcConfig();
  const verify = async (tokens, verified) => {
    const user = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };
  for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
    const strategy = new Strategy(
      {
        name: `replitauth:${domain}`,
        config,
        scope: "openid email profile offline_access",
        callbackURL: `https://${domain}/api/callback`
      },
      verify
    );
    passport.use(strategy);
  }
  passport.serializeUser((user, cb) => cb(null, user));
  passport.deserializeUser((user, cb) => cb(null, user));
  app2.get("/api/login", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"]
    })(req, res, next);
  });
  app2.get("/api/callback", (req, res, next) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login"
    })(req, res, next);
  });
  app2.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config, {
          client_id: process.env.REPL_ID,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`
        }).href
      );
    });
  });
}
var isAuthenticated = async (req, res, next) => {
  const user = req.user;
  if (!req.isAuthenticated() || !user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const now = Math.floor(Date.now() / 1e3);
  if (now <= user.expires_at) {
    return next();
  }
  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};

// server/routes.ts
import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { z } from "zod";
var uploadDir = path.join(process.cwd(), "uploads", "profiles");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  }
});
async function registerRoutes(app2) {
  console.log("Testing database connection...");
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.warn("Database connection test failed, but continuing startup...");
  }
  app2.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
  await setupAuth(app2);
  setTimeout(() => {
    initializeDefaultCategories().catch((err) => {
      console.error("Background initialization failed:", err);
    });
  }, 2e3);
  app2.get("/api/auth/user", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/profile-image", isAuthenticated, upload.single("profileImage"), async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      const filename = `${userId}-${Date.now()}.webp`;
      const filepath = path.join(uploadDir, filename);
      await sharp(req.file.buffer).resize(200, 200, {
        fit: "cover",
        position: "center"
      }).webp({ quality: 85 }).toFile(filepath);
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
  app2.get("/api/categories", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const categories2 = await storage.getCategories(userId);
      res.json(categories2);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });
  app2.post("/api/categories", isAuthenticated, async (req, res) => {
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
  app2.get("/api/prayer-cards", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const frequency = req.query.frequency;
      const dayOfWeek = req.query.dayOfWeek;
      const dayOfMonth = req.query.dayOfMonth;
      let prayerCards2;
      if (frequency === "daily") {
        const today = (/* @__PURE__ */ new Date()).toLocaleDateString("en-US", { weekday: "long" });
        const todayDate = (/* @__PURE__ */ new Date()).getDate();
        const [dailyCards, weeklyCards, monthlyCards] = await Promise.all([
          storage.getPrayerCardsByFrequency(userId, "daily"),
          storage.getPrayerCardsByFrequencyAndDay(userId, "weekly", today),
          storage.getPrayerCardsByFrequencyAndMonth(userId, "monthly", todayDate)
        ]);
        if (dailyCards.length <= 3) {
          prayerCards2 = [...dailyCards, ...weeklyCards, ...monthlyCards];
        } else {
          const dateString = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
          const dateSeed = dateString.split("-").join("");
          const shuffled = [...dailyCards];
          let seed = parseInt(dateSeed);
          for (let i = shuffled.length - 1; i > 0; i--) {
            seed = (seed * 9301 + 49297) % 233280;
            const j = Math.floor(seed / 233280 * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          prayerCards2 = [...shuffled.slice(0, 3), ...weeklyCards, ...monthlyCards];
        }
      } else if (frequency) {
        if (frequency === "weekly" && dayOfWeek) {
          prayerCards2 = await storage.getPrayerCardsByFrequencyAndDay(userId, frequency, dayOfWeek);
        } else if (frequency === "monthly" && dayOfMonth) {
          prayerCards2 = await storage.getPrayerCardsByFrequencyAndMonth(userId, frequency, parseInt(dayOfMonth));
        } else {
          prayerCards2 = await storage.getPrayerCardsByFrequency(userId, frequency);
        }
      } else {
        prayerCards2 = await storage.getPrayerCards(userId);
      }
      res.json(prayerCards2);
    } catch (error) {
      console.error("Error fetching prayer cards:", error);
      res.status(500).json({ message: "Failed to fetch prayer cards" });
    }
  });
  app2.get("/api/prayer-cards/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/prayer-cards", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating prayer card for user:", userId);
      console.log("Request body:", req.body);
      const validatedData = insertPrayerCardSchema.parse({ ...req.body, userId });
      console.log("Validated data:", validatedData);
      const prayerCard = await storage.createPrayerCard(validatedData);
      console.log("Created prayer card:", prayerCard);
      res.setHeader("Content-Type", "application/json");
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
          res.setHeader("Content-Type", "application/json");
          return res.status(400).json({ message: "Invalid prayer card data", errors: error.errors });
        }
        return;
      }
      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json");
        return res.status(500).json({ message: "Failed to create prayer card" });
      }
    }
  });
  app2.put("/api/prayer-cards/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/prayer-cards/:id", isAuthenticated, async (req, res) => {
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
  app2.get("/api/prayer-cards/:id/requests", isAuthenticated, async (req, res) => {
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
  app2.post("/api/prayer-cards/:id/requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const cardId = parseInt(req.params.id);
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
  app2.put("/api/prayer-requests/:id", isAuthenticated, async (req, res) => {
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
  app2.put("/api/prayer-requests/:id/archive", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/prayer-requests/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/prayer-requests", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      console.log("Creating prayer request for user:", userId);
      console.log("Request body:", req.body);
      const validatedData = insertPrayerRequestSchema.parse({
        ...req.body,
        isArchived: false
      });
      console.log("Validated request data:", validatedData);
      const request = await storage.createPrayerRequest(validatedData);
      console.log("Created prayer request:", request);
      res.setHeader("Content-Type", "application/json");
      if (!res.headersSent) {
        res.status(201).json(request);
        console.log("Prayer request response sent successfully");
      }
    } catch (error) {
      console.error("Error creating prayer request:", error);
      if (error instanceof z.ZodError) {
        console.log("Validation error:", error.errors);
        if (!res.headersSent) {
          res.setHeader("Content-Type", "application/json");
          return res.status(400).json({ message: "Invalid prayer request data", errors: error.errors });
        }
        return;
      }
      if (!res.headersSent) {
        res.setHeader("Content-Type", "application/json");
        return res.status(500).json({ message: "Failed to create prayer request" });
      }
    }
  });
  app2.get("/api/scripture/search", isAuthenticated, async (req, res) => {
    try {
      const query = req.query.q;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      const esvApiKey = process.env.ESV_API_KEY || process.env.VITE_ESV_API_KEY || "TEST_API_KEY";
      const response = await fetch(`https://api.esv.org/v3/passage/search/?q=${encodeURIComponent(query)}`, {
        headers: {
          "Authorization": `Token ${esvApiKey}`
        }
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
  app2.get("/api/scripture/text", isAuthenticated, async (req, res) => {
    try {
      const reference = req.query.ref;
      if (!reference) {
        return res.status(400).json({ message: "Scripture reference is required" });
      }
      const esvApiKey = process.env.ESV_API_KEY || process.env.VITE_ESV_API_KEY || "TEST_API_KEY";
      const response = await fetch(`https://api.esv.org/v3/passage/text/?q=${encodeURIComponent(reference)}&include-headings=false&include-footnotes=false&include-verse-numbers=false&include-short-copyright=false`, {
        headers: {
          "Authorization": `Token ${esvApiKey}`
        }
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
  app2.get("/api/reminder-settings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const settings = await storage.getReminderSettings(userId);
      if (!settings) {
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
  app2.put("/api/reminder-settings", isAuthenticated, async (req, res) => {
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
  app2.get("/api/prayer-stats", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      let stats = await storage.getPrayerStats(userId);
      if (!stats) {
        stats = await storage.upsertPrayerStats({
          userId,
          totalPrayers: 0,
          currentLevel: 1
        });
      }
      res.json(stats);
    } catch (error) {
      console.error("Error fetching prayer stats:", error);
      res.status(500).json({ message: "Failed to fetch prayer stats" });
    }
  });
  app2.post("/api/prayer-cards/:id/pray", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayerCardId = parseInt(req.params.id);
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
  app2.get("/api/prayer-cards/:id/prayed-today", isAuthenticated, async (req, res) => {
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
  app2.post("/api/prayer-cards/batch-prayed-status", isAuthenticated, async (req, res) => {
    try {
      const { cardIds } = req.body;
      const userId = req.user.claims.sub;
      if (!Array.isArray(cardIds)) {
        return res.status(400).json({ message: "cardIds must be an array" });
      }
      const statusMap = await storage.batchCheckPrayedStatus(userId, cardIds);
      res.json(statusMap);
    } catch (error) {
      console.error("Error checking batch prayer status:", error);
      res.status(500).json({ message: "Failed to check batch prayer status" });
    }
  });
  app2.delete("/api/prayer-cards/:id/pray", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const prayerCardId = parseInt(req.params.id);
      const success = await storage.undoPrayerLog(userId, prayerCardId);
      if (!success) {
        return res.status(404).json({ message: "No prayer log found to undo" });
      }
      const stats = await storage.getPrayerStats(userId);
      res.json({ success: true, stats });
    } catch (error) {
      console.error("Error undoing prayer:", error);
      res.status(500).json({ message: "Failed to undo prayer" });
    }
  });
  const httpServer = createServer(app2);
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
          { name: "Leadership", color: "#6B73FF", icon: "fas fa-crown", isDefault: true, userId: null }
        ];
        for (const category of defaultCategories) {
          await storage.createCategory(category);
        }
        console.log("Default categories initialized successfully");
      } else {
        console.log(`Found ${existingCategories.length} existing default categories`);
      }
      return;
    } catch (error) {
      attempt++;
      console.error(`Error initializing default categories (attempt ${attempt}):`, error);
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1e3;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("Failed to initialize default categories after all retries");
      }
    }
  }
}

// server/vite.ts
import express2 from "express";
import fs2 from "fs";
import path3 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path2 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path2.resolve(import.meta.dirname, "client", "src"),
      "@shared": path2.resolve(import.meta.dirname, "shared"),
      "@assets": path2.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path2.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path2.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path3.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs2.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path3.resolve(import.meta.dirname, "public");
  if (!fs2.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path3.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path4 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path4.startsWith("/api")) {
      let logLine = `${req.method} ${path4} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error(`Error in ${req.method} ${req.path}:`, err);
    if (req.path.startsWith("/api/")) {
      if (!res.headersSent) {
        res.status(status).json({ message });
      }
    } else {
      if (!res.headersSent) {
        res.status(status).send(message);
      }
    }
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
