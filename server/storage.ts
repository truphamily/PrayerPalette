import {
  users,
  categories,
  prayerCards,
  prayerRequests,
  userReminderSettings,
  userPrayerStats,
  prayerLogs,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type PrayerCard,
  type InsertPrayerCard,
  type PrayerRequest,
  type InsertPrayerRequest,
  type PrayerCardWithDetails,
  type UserReminderSettings,
  type InsertUserReminderSettings,
  type UserPrayerStats,
  type InsertUserPrayerStats,
  type PrayerLog,
  type InsertPrayerLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, count, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined>;
  
  // Category operations
  getCategories(userId: string): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  getDefaultCategories(): Promise<Category[]>;
  
  // Prayer card operations
  getPrayerCards(userId: string): Promise<PrayerCardWithDetails[]>;
  getPrayerCardsByFrequency(userId: string, frequency: string): Promise<PrayerCardWithDetails[]>;
  getPrayerCardsByFrequencyAndDay(userId: string, frequency: string, dayOfWeek: string): Promise<PrayerCardWithDetails[]>;
  getPrayerCardsByFrequencyAndMonth(userId: string, frequency: string, dayOfMonth: number): Promise<PrayerCardWithDetails[]>;
  getPrayerCard(id: number, userId: string): Promise<PrayerCardWithDetails | undefined>;
  createPrayerCard(prayerCard: InsertPrayerCard): Promise<PrayerCard>;
  updatePrayerCard(id: number, updates: Partial<InsertPrayerCard>, userId: string): Promise<PrayerCard | undefined>;
  deletePrayerCard(id: number, userId: string): Promise<boolean>;
  
  // Prayer request operations
  getPrayerRequests(prayerCardId: number, userId: string): Promise<PrayerRequest[]>;
  createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest>;
  updatePrayerRequest(id: number, updates: Partial<InsertPrayerRequest>, userId: string): Promise<PrayerRequest | undefined>;
  archivePrayerRequest(id: number, userId: string): Promise<boolean>;
  deletePrayerRequest(id: number, userId: string): Promise<boolean>;
  
  // Reminder settings operations
  getReminderSettings(userId: string): Promise<UserReminderSettings | undefined>;
  upsertReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings>;
  
  // Prayer stats operations
  getPrayerStats(userId: string): Promise<UserPrayerStats | undefined>;
  upsertPrayerStats(stats: InsertUserPrayerStats): Promise<UserPrayerStats>;
  
  // Prayer log operations
  createPrayerLog(log: InsertPrayerLog): Promise<PrayerLog>;
  hasPrayedToday(userId: string, prayerCardId: number): Promise<boolean>;
  undoPrayerLog(userId: string, prayerCardId: number): Promise<boolean>;
  markPrayerComplete(userId: string, prayerCardId: number): Promise<{ success: boolean; stats: UserPrayerStats; alreadyPrayed?: boolean }>;
  batchCheckPrayedStatus(userId: string, cardIds: number[]): Promise<Record<number, boolean>>;
}

export class DatabaseStorage implements IStorage {
  // User operations (mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserProfileImage(userId: string, profileImageUrl: string): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ 
        profileImageUrl, 
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Category operations
  async getCategories(userId: string): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(
        sql`${categories.userId} = ${userId} OR ${categories.isDefault} = true`
      )
      .orderBy(categories.isDefault, categories.name);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async getDefaultCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isDefault, true));
  }

  // Prayer card operations
  async getPrayerCards(userId: string): Promise<PrayerCardWithDetails[]> {
    // Get all prayer cards with their categories and request counts in one query
    const result = await db
      .select({
        prayerCard: prayerCards,
        category: categories,
        activeRequestsCount: sql<number>`count(case when ${prayerRequests.isArchived} = false then 1 end)`,
      })
      .from(prayerCards)
      .leftJoin(categories, eq(prayerCards.categoryId, categories.id))
      .leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId))
      .where(eq(prayerCards.userId, userId))
      .groupBy(prayerCards.id, categories.id)
      .orderBy(desc(prayerCards.updatedAt));

    if (result.length === 0) return [];

    // Get all prayer requests for all cards in one query
    const cardIds = result.map(row => row.prayerCard.id);
    const allRequests = await db
      .select()
      .from(prayerRequests)
      .where(inArray(prayerRequests.prayerCardId, cardIds))
      .orderBy(desc(prayerRequests.createdAt));

    // Group requests by prayer card ID
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {} as Record<number, typeof allRequests>);

    // Combine the data
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount),
    }));
  }

  async getPrayerCardsByFrequency(userId: string, frequency: string): Promise<PrayerCardWithDetails[]> {
    // Get all prayer cards with their categories and request counts in one query
    const result = await db
      .select({
        prayerCard: prayerCards,
        category: categories,
        activeRequestsCount: sql<number>`count(case when ${prayerRequests.isArchived} = false then 1 end)`,
      })
      .from(prayerCards)
      .leftJoin(categories, eq(prayerCards.categoryId, categories.id))
      .leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId))
      .where(and(eq(prayerCards.userId, userId), eq(prayerCards.frequency, frequency)))
      .groupBy(prayerCards.id, categories.id)
      .orderBy(desc(prayerCards.updatedAt));

    if (result.length === 0) return [];

    // Get all prayer requests for all cards in one query
    const cardIds = result.map(row => row.prayerCard.id);
    const allRequests = await db
      .select()
      .from(prayerRequests)
      .where(inArray(prayerRequests.prayerCardId, cardIds))
      .orderBy(desc(prayerRequests.createdAt));

    // Group requests by prayer card ID
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {} as Record<number, typeof allRequests>);

    // Combine the data
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount),
    }));
  }

  async getPrayerCardsByFrequencyAndDay(userId: string, frequency: string, dayOfWeek: string): Promise<PrayerCardWithDetails[]> {
    // Get all prayer cards with their categories and request counts in one query
    const result = await db
      .select({
        prayerCard: prayerCards,
        category: categories,
        activeRequestsCount: sql<number>`count(case when ${prayerRequests.isArchived} = false then 1 end)`,
      })
      .from(prayerCards)
      .leftJoin(categories, eq(prayerCards.categoryId, categories.id))
      .leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId))
      .where(and(
        eq(prayerCards.userId, userId), 
        eq(prayerCards.frequency, frequency),
        eq(prayerCards.dayOfWeek, dayOfWeek)
      ))
      .groupBy(prayerCards.id, categories.id)
      .orderBy(desc(prayerCards.updatedAt));

    if (result.length === 0) return [];

    // Get all prayer requests for all cards in one query
    const cardIds = result.map(row => row.prayerCard.id);
    const allRequests = await db
      .select()
      .from(prayerRequests)
      .where(inArray(prayerRequests.prayerCardId, cardIds))
      .orderBy(desc(prayerRequests.createdAt));

    // Group requests by prayer card ID
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {} as Record<number, typeof allRequests>);

    // Combine the data
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount),
    }));
  }

  async getPrayerCardsByFrequencyAndMonth(userId: string, frequency: string, dayOfMonth: number): Promise<PrayerCardWithDetails[]> {
    // Get all prayer cards with their categories and request counts in one query
    const result = await db
      .select({
        prayerCard: prayerCards,
        category: categories,
        activeRequestsCount: sql<number>`count(case when ${prayerRequests.isArchived} = false then 1 end)`,
      })
      .from(prayerCards)
      .leftJoin(categories, eq(prayerCards.categoryId, categories.id))
      .leftJoin(prayerRequests, eq(prayerCards.id, prayerRequests.prayerCardId))
      .where(and(
        eq(prayerCards.userId, userId), 
        eq(prayerCards.frequency, frequency),
        or(
          eq(prayerCards.dayOfMonth, dayOfMonth), // Backward compatibility
          sql`${dayOfMonth} = ANY(${prayerCards.daysOfMonth})` // New multiple days support
        )
      ))
      .groupBy(prayerCards.id, categories.id)
      .orderBy(desc(prayerCards.updatedAt));

    if (result.length === 0) return [];

    // Get all prayer requests for all cards in one query
    const cardIds = result.map(row => row.prayerCard.id);
    const allRequests = await db
      .select()
      .from(prayerRequests)
      .where(inArray(prayerRequests.prayerCardId, cardIds))
      .orderBy(desc(prayerRequests.createdAt));

    // Group requests by prayer card ID
    const requestsByCardId = allRequests.reduce((acc, request) => {
      if (!acc[request.prayerCardId]) {
        acc[request.prayerCardId] = [];
      }
      acc[request.prayerCardId].push(request);
      return acc;
    }, {} as Record<number, typeof allRequests>);

    // Combine the data
    return result.map((row) => ({
      ...row.prayerCard,
      category: row.category,
      prayerRequests: requestsByCardId[row.prayerCard.id] || [],
      activeRequestsCount: Number(row.activeRequestsCount),
    }));
  }

  async getPrayerCard(id: number, userId: string): Promise<PrayerCardWithDetails | undefined> {
    const [result] = await db
      .select({
        prayerCard: prayerCards,
        category: categories,
      })
      .from(prayerCards)
      .leftJoin(categories, eq(prayerCards.categoryId, categories.id))
      .where(and(eq(prayerCards.id, id), eq(prayerCards.userId, userId)));

    if (!result) return undefined;

    const requests = await this.getPrayerRequests(id, userId);
    const activeRequestsCount = requests.filter(r => !r.isArchived).length;

    return {
      ...result.prayerCard,
      category: result.category,
      prayerRequests: requests,
      activeRequestsCount,
    };
  }

  async createPrayerCard(prayerCard: InsertPrayerCard): Promise<PrayerCard> {
    let retries = 3;
    while (retries > 0) {
      try {
        const [newCard] = await db
          .insert(prayerCards)
          .values(prayerCard)
          .returning();
        return newCard;
      } catch (error: any) {
        console.error(`Database error (retries left: ${retries - 1}):`, error.message);
        retries--;
        if (retries === 0 || !error.message?.includes('terminating connection')) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    throw new Error('Failed to create prayer card after retries');
  }

  async updatePrayerCard(id: number, updates: Partial<InsertPrayerCard>, userId: string): Promise<PrayerCard | undefined> {
    const [updated] = await db
      .update(prayerCards)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(eq(prayerCards.id, id), eq(prayerCards.userId, userId)))
      .returning();
    return updated;
  }

  async deletePrayerCard(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(prayerCards)
      .where(and(eq(prayerCards.id, id), eq(prayerCards.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Prayer request operations
  async getPrayerRequests(prayerCardId: number, userId: string): Promise<PrayerRequest[]> {
    const result = await db
      .select()
      .from(prayerRequests)
      .leftJoin(prayerCards, eq(prayerRequests.prayerCardId, prayerCards.id))
      .where(and(
        eq(prayerRequests.prayerCardId, prayerCardId),
        eq(prayerCards.userId, userId)
      ))
      .orderBy(desc(prayerRequests.createdAt));

    return result.map(row => row.prayer_requests);
  }

  async createPrayerRequest(request: InsertPrayerRequest): Promise<PrayerRequest> {
    const [newRequest] = await db
      .insert(prayerRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updatePrayerRequest(id: number, updates: Partial<InsertPrayerRequest>, userId: string): Promise<PrayerRequest | undefined> {
    // First verify the prayer request belongs to a prayer card owned by the user
    const existingRequest = await db
      .select({ id: prayerRequests.id })
      .from(prayerRequests)
      .leftJoin(prayerCards, eq(prayerRequests.prayerCardId, prayerCards.id))
      .where(and(
        eq(prayerRequests.id, id),
        eq(prayerCards.userId, userId)
      ));

    if (existingRequest.length === 0) {
      return undefined;
    }

    const [updated] = await db
      .update(prayerRequests)
      .set(updates)
      .where(eq(prayerRequests.id, id))
      .returning();
    
    return updated;
  }

  async archivePrayerRequest(id: number, userId: string): Promise<boolean> {
    const result = await db
      .update(prayerRequests)
      .set({ 
        isArchived: true, 
        archivedAt: new Date() 
      })
      .from(prayerCards)
      .where(and(
        eq(prayerRequests.id, id),
        eq(prayerRequests.prayerCardId, prayerCards.id),
        eq(prayerCards.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async deletePrayerRequest(id: number, userId: string): Promise<boolean> {
    // First verify the prayer request belongs to a prayer card owned by the user
    const request = await db
      .select({ id: prayerRequests.id })
      .from(prayerRequests)
      .leftJoin(prayerCards, eq(prayerRequests.prayerCardId, prayerCards.id))
      .where(and(
        eq(prayerRequests.id, id),
        eq(prayerCards.userId, userId)
      ));

    if (request.length === 0) {
      return false;
    }

    // Delete the prayer request
    const result = await db
      .delete(prayerRequests)
      .where(eq(prayerRequests.id, id));
    
    return (result.rowCount ?? 0) > 0;
  }

  // Reminder settings operations
  async getReminderSettings(userId: string): Promise<UserReminderSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userReminderSettings)
      .where(eq(userReminderSettings.userId, userId));
    return settings;
  }

  async upsertReminderSettings(settings: InsertUserReminderSettings): Promise<UserReminderSettings> {
    const existingSettings = await this.getReminderSettings(settings.userId);
    
    if (existingSettings) {
      const [updated] = await db
        .update(userReminderSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(userReminderSettings.userId, settings.userId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userReminderSettings)
        .values(settings)
        .returning();
      return created;
    }
  }

  // Prayer stats operations
  async getPrayerStats(userId: string): Promise<UserPrayerStats | undefined> {
    const [stats] = await db.select().from(userPrayerStats).where(eq(userPrayerStats.userId, userId));
    return stats;
  }

  async upsertPrayerStats(stats: InsertUserPrayerStats): Promise<UserPrayerStats> {
    // Use PostgreSQL's ON CONFLICT for true upsert in single query
    const [result] = await db
      .insert(userPrayerStats)
      .values(stats)
      .onConflictDoUpdate({
        target: userPrayerStats.userId,
        set: {
          ...stats,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result;
  }

  // Prayer log operations
  async createPrayerLog(log: InsertPrayerLog): Promise<PrayerLog> {
    const [prayerLog] = await db
      .insert(prayerLogs)
      .values(log)
      .returning();
    return prayerLog;
  }

  // Ultra-optimized prayer marking with minimal database calls
  async markPrayerComplete(userId: string, prayerCardId: number): Promise<{ success: boolean; stats: UserPrayerStats; alreadyPrayed?: boolean }> {
    // Check if already prayed today and get current stats in a single combined query
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    const [existingLogResult, currentStats] = await Promise.all([
      db
        .select({ count: count() })
        .from(prayerLogs)
        .where(
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
      return { success: false, alreadyPrayed: true, stats: currentStats! };
    }

    // Calculate new stats
    const newTotalPrayers = (currentStats?.totalPrayers || 0) + 1;
    const newLevel = Math.floor(newTotalPrayers / 7) + 1;

    // Create prayer log and update stats in parallel (only 2 database calls)
    const [prayerLog, updatedStats] = await Promise.all([
      this.createPrayerLog({ userId, prayerCardId }),
      this.upsertPrayerStats({
        userId,
        totalPrayers: newTotalPrayers,
        currentLevel: newLevel,
      })
    ]);

    return { success: true, stats: updatedStats };
  }

  // Optimized batch prayer status checking with a single database query
  async batchCheckPrayedStatus(userId: string, cardIds: number[]): Promise<Record<number, boolean>> {
    if (cardIds.length === 0) return {};

    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);

    // Single query to check all prayer cards at once
    const prayedCards = await db
      .select({ 
        prayerCardId: prayerLogs.prayerCardId,
        count: count()
      })
      .from(prayerLogs)
      .where(
        and(
          eq(prayerLogs.userId, userId),
          inArray(prayerLogs.prayerCardId, cardIds),
          sql`${prayerLogs.prayedAt} >= ${startOfToday}`,
          sql`${prayerLogs.prayedAt} < ${endOfToday}`
        )
      )
      .groupBy(prayerLogs.prayerCardId);

    // Create status map
    const statusMap: Record<number, boolean> = {};
    
    // Initialize all cards as not prayed
    cardIds.forEach(cardId => {
      statusMap[cardId] = false;
    });
    
    // Mark prayed cards as true
    prayedCards.forEach(({ prayerCardId }) => {
      statusMap[prayerCardId] = true;
    });

    return statusMap;
  }

  async hasPrayedToday(userId: string, prayerCardId: number): Promise<boolean> {
    // Simplified and much faster check - just check if prayed today
    const today = new Date();
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);


    const [result] = await db
      .select({ count: count() })
      .from(prayerLogs)
      .where(
        and(
          eq(prayerLogs.userId, userId),
          eq(prayerLogs.prayerCardId, prayerCardId),
          sql`${prayerLogs.prayedAt} >= ${startOfToday}`,
          sql`${prayerLogs.prayedAt} < ${endOfToday}`
        )
      );

    return result.count > 0;
  }

  async undoPrayerLog(userId: string, prayerCardId: number): Promise<boolean> {
    // First get the prayer card to check its frequency
    const [prayerCard] = await db
      .select()
      .from(prayerCards)
      .where(and(eq(prayerCards.id, prayerCardId), eq(prayerCards.userId, userId)));

    if (!prayerCard) return false;

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = new Date(now);

    // Calculate the period based on frequency
    switch (prayerCard.frequency) {
      case 'daily':
        periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
        break;

      case 'weekly':
        // Get start of current week (Sunday)
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - now.getDay());
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 7);
        break;

      case 'monthly':
        // Get start of current month
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;

      default:
        // Default to daily for unknown frequencies
        periodStart = new Date(now);
        periodStart.setHours(0, 0, 0, 0);
        periodEnd = new Date(periodStart);
        periodEnd.setDate(periodEnd.getDate() + 1);
    }

    // Find and delete the most recent prayer log within the current period
    const [recentLog] = await db
      .select()
      .from(prayerLogs)
      .where(
        and(
          eq(prayerLogs.userId, userId),
          eq(prayerLogs.prayerCardId, prayerCardId),
          sql`${prayerLogs.prayedAt} >= ${periodStart}`,
          sql`${prayerLogs.prayedAt} < ${periodEnd}`
        )
      )
      .orderBy(desc(prayerLogs.prayedAt))
      .limit(1);

    if (!recentLog) return false;

    // Delete the prayer log
    await db
      .delete(prayerLogs)
      .where(eq(prayerLogs.id, recentLog.id));

    // Update prayer stats (decrement total prayers)
    const currentStats = await this.getPrayerStats(userId);
    if (currentStats) {
      const newTotalPrayers = Math.max(0, currentStats.totalPrayers - 1);
      const newLevel = Math.max(1, Math.floor(newTotalPrayers / 7) + 1);
      
      await this.upsertPrayerStats({
        userId,
        totalPrayers: newTotalPrayers,
        currentLevel: newLevel,
      });
    }

    return true;
  }
}

export const storage = new DatabaseStorage();
