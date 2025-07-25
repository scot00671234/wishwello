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

// User storage table for email-based authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isVerified: boolean("is_verified").default(false),
  verificationToken: varchar("verification_token"),
  resetToken: varchar("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
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

// Survey campaigns table (replaces checkin schedules)
export const surveyDeadlines = pgTable("survey_deadlines", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull().default("Team Wellbeing Survey"),
  description: text("description"),
  deadline: timestamp("deadline"), // null means no deadline
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  closedAt: timestamp("closed_at"), // manually closed surveys
});

// Survey responses table (replaces checkin responses)
export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  surveyId: uuid("survey_id").references(() => surveyDeadlines.id, { onDelete: "cascade" }),
  questionId: uuid("question_id").notNull().references(() => questions.id, { onDelete: "cascade" }),
  responseValue: text("response_value"), // For metric: "7", for yesno: "yes"/"no", for comment: text
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
  surveyDeadlines: many(surveyDeadlines),
  responses: many(surveyResponses),
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
  responses: many(surveyResponses),
}));

export const surveyDeadlineRelations = relations(surveyDeadlines, ({ one, many }) => ({
  team: one(teams, {
    fields: [surveyDeadlines.teamId],
    references: [teams.id],
  }),
  responses: many(surveyResponses),
}));

export const surveyResponseRelations = relations(surveyResponses, ({ one }) => ({
  team: one(teams, {
    fields: [surveyResponses.teamId],
    references: [teams.id],
  }),
  survey: one(surveyDeadlines, {
    fields: [surveyResponses.surveyId],
    references: [surveyDeadlines.id],
  }),
  question: one(questions, {
    fields: [surveyResponses.questionId],
    references: [questions.id],
  }),
}));

export const pulseScoreRelations = relations(pulseScores, ({ one }) => ({
  team: one(teams, {
    fields: [pulseScores.teamId],
    references: [teams.id],
  }),
}));

// Auth schemas
export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

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

export const insertSurveyDeadlineSchema = createInsertSchema(surveyDeadlines).omit({
  id: true,
  createdAt: true,
});

export const insertSurveyResponseSchema = createInsertSchema(surveyResponses).omit({
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
export type InsertSurveyDeadline = z.infer<typeof insertSurveyDeadlineSchema>;
export type SurveyDeadline = typeof surveyDeadlines.$inferSelect;
export type InsertSurveyResponse = z.infer<typeof insertSurveyResponseSchema>;
export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertPulseScore = z.infer<typeof insertPulseScoreSchema>;
export type PulseScore = typeof pulseScores.$inferSelect;
