import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
  decimal,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (mandatory for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (mandatory for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status").default("trial"),
  trialEndsAt: timestamp("trial_ends_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Teams table
export const teams = pgTable("teams", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  managerId: varchar("manager_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Employees table
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Questions table
export const questions = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  type: varchar("type", { length: 50 }).notNull(), // 'metric', 'yesno', 'comment'
  isRequired: boolean("is_required").default(true),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Check-in schedules table
export const checkinSchedules = pgTable("checkin_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  frequency: varchar("frequency", { length: 20 }).notNull(), // 'weekly', 'biweekly', 'monthly'
  dayOfWeek: integer("day_of_week").notNull(), // 1-7 (Monday-Sunday)
  hour: integer("hour").notNull(), // 0-23
  isActive: boolean("is_active").default(true),
  lastSentAt: timestamp("last_sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Check-in responses table
export const checkinResponses = pgTable("checkin_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  responseValue: text("response_value"), // For metric: "7", for yesno: "yes"/"no", for comment: text
  checkinDate: timestamp("checkin_date").notNull(),
  submittedAt: timestamp("submitted_at").defaultNow(),
});

// Templates table
export const templates = pgTable("templates", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  questions: jsonb("questions").notNull(), // Array of question objects
  isBuiltIn: boolean("is_built_in").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pulse scores table (calculated periodically)
export const pulseScores = pgTable("pulse_scores", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  score: decimal("score", { precision: 3, scale: 1 }).notNull(),
  responseCount: integer("response_count").notNull(),
  totalEmployees: integer("total_employees").notNull(),
  weekStarting: timestamp("week_starting").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const userRelations = relations(users, ({ many }) => ({
  teams: many(teams),
}));

export const teamRelations = relations(teams, ({ one, many }) => ({
  manager: one(users, {
    fields: [teams.managerId],
    references: [users.id],
  }),
  employees: many(employees),
  questions: many(questions),
  schedules: many(checkinSchedules),
  responses: many(checkinResponses),
  pulseScores: many(pulseScores),
}));

export const employeeRelations = relations(employees, ({ one }) => ({
  team: one(teams, {
    fields: [employees.teamId],
    references: [teams.id],
  }),
}));

export const questionRelations = relations(questions, ({ one, many }) => ({
  team: one(teams, {
    fields: [questions.teamId],
    references: [teams.id],
  }),
  responses: many(checkinResponses),
}));

export const checkinScheduleRelations = relations(checkinSchedules, ({ one }) => ({
  team: one(teams, {
    fields: [checkinSchedules.teamId],
    references: [teams.id],
  }),
}));

export const checkinResponseRelations = relations(checkinResponses, ({ one }) => ({
  team: one(teams, {
    fields: [checkinResponses.teamId],
    references: [teams.id],
  }),
  question: one(questions, {
    fields: [checkinResponses.questionId],
    references: [questions.id],
  }),
}));

export const pulseScoreRelations = relations(pulseScores, ({ one }) => ({
  team: one(teams, {
    fields: [pulseScores.teamId],
    references: [teams.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertQuestionSchema = createInsertSchema(questions).omit({
  id: true,
  createdAt: true,
});

export const insertCheckinScheduleSchema = createInsertSchema(checkinSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertCheckinResponseSchema = createInsertSchema(checkinResponses).omit({
  id: true,
  submittedAt: true,
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
  createdAt: true,
});

export const insertPulseScoreSchema = createInsertSchema(pulseScores).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questions.$inferSelect;
export type InsertCheckinSchedule = z.infer<typeof insertCheckinScheduleSchema>;
export type CheckinSchedule = typeof checkinSchedules.$inferSelect;
export type InsertCheckinResponse = z.infer<typeof insertCheckinResponseSchema>;
export type CheckinResponse = typeof checkinResponses.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertPulseScore = z.infer<typeof insertPulseScoreSchema>;
export type PulseScore = typeof pulseScores.$inferSelect;
