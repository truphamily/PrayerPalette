import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  boolean,
  integer,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  isDefault: boolean("is_default").default(false),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const prayerCards = pgTable("prayer_cards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly'
  dayOfWeek: varchar("day_of_week", { length: 20 }), // for weekly prayers
  dayOfMonth: integer("day_of_month"), // for monthly prayers (1-31) - kept for backward compatibility
  daysOfMonth: integer("days_of_month").array(), // for multiple monthly prayer days (1-31)
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  scriptures: text("scriptures").array(),
  scriptureReferences: varchar("scripture_references", { length: 100 }).array(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const prayerRequests = pgTable("prayer_requests", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  prayerCardId: integer("prayer_card_id").notNull().references(() => prayerCards.id, { onDelete: "cascade" }),
  isArchived: boolean("is_archived").default(false),
  archivedAt: timestamp("archived_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userReminderSettings = pgTable("user_reminder_settings", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  enableReminders: boolean("enable_reminders").default(false),
  reminderTimes: text("reminder_times").array().default([]), // Array of time strings like ["09:00", "18:00"]
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"),
  enableBrowserNotifications: boolean("enable_browser_notifications").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPrayerStats = pgTable("user_prayer_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  totalPrayers: integer("total_prayers").default(0),
  currentLevel: integer("current_level").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const prayerLogs = pgTable("prayer_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  prayerCardId: integer("prayer_card_id").references(() => prayerCards.id, { onDelete: "cascade" }).notNull(),
  prayedAt: timestamp("prayed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  prayerCards: many(prayerCards),
  categories: many(categories),
  reminderSettings: one(userReminderSettings),
  prayerStats: one(userPrayerStats),
  prayerLogs: many(prayerLogs),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  prayerCards: many(prayerCards),
}));

export const prayerCardsRelations = relations(prayerCards, ({ one, many }) => ({
  user: one(users, {
    fields: [prayerCards.userId],
    references: [users.id],
  }),
  category: one(categories, {
    fields: [prayerCards.categoryId],
    references: [categories.id],
  }),
  prayerRequests: many(prayerRequests),
  prayerLogs: many(prayerLogs),
}));

export const prayerRequestsRelations = relations(prayerRequests, ({ one }) => ({
  prayerCard: one(prayerCards, {
    fields: [prayerRequests.prayerCardId],
    references: [prayerCards.id],
  }),
}));

export const userReminderSettingsRelations = relations(userReminderSettings, ({ one }) => ({
  user: one(users, {
    fields: [userReminderSettings.userId],
    references: [users.id],
  }),
}));

export const userPrayerStatsRelations = relations(userPrayerStats, ({ one }) => ({
  user: one(users, {
    fields: [userPrayerStats.userId],
    references: [users.id],
  }),
}));

export const prayerLogsRelations = relations(prayerLogs, ({ one }) => ({
  user: one(users, {
    fields: [prayerLogs.userId],
    references: [users.id],
  }),
  prayerCard: one(prayerCards, {
    fields: [prayerLogs.prayerCardId],
    references: [prayerCards.id],
  }),
}));

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertPrayerCardSchema = createInsertSchema(prayerCards).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrayerRequestSchema = createInsertSchema(prayerRequests).omit({
  id: true,
  createdAt: true,
  archivedAt: true,
});

export const upsertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertUserReminderSettingsSchema = createInsertSchema(userReminderSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPrayerStatsSchema = createInsertSchema(userPrayerStats).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPrayerLogSchema = createInsertSchema(prayerLogs).omit({
  id: true,
  prayedAt: true,
});

// Types
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type PrayerCard = typeof prayerCards.$inferSelect;
export type InsertPrayerCard = z.infer<typeof insertPrayerCardSchema>;
export type PrayerRequest = typeof prayerRequests.$inferSelect;
export type InsertPrayerRequest = z.infer<typeof insertPrayerRequestSchema>;
export type UserReminderSettings = typeof userReminderSettings.$inferSelect;
export type InsertUserReminderSettings = z.infer<typeof insertUserReminderSettingsSchema>;
export type UserPrayerStats = typeof userPrayerStats.$inferSelect;
export type InsertUserPrayerStats = z.infer<typeof insertUserPrayerStatsSchema>;
export type PrayerLog = typeof prayerLogs.$inferSelect;
export type InsertPrayerLog = z.infer<typeof insertPrayerLogSchema>;

// Extended types for API responses
export type PrayerCardWithDetails = PrayerCard & {
  category: Category | null;
  prayerRequests: PrayerRequest[];
  activeRequestsCount: number;
};
