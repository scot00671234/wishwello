import {
  users,
  teams,
  employees,
  questions,
  checkinSchedules,
  checkinResponses,
  templates,
  pulseScores,
  type User,
  type UpsertUser,
  type Team,
  type InsertTeam,
  type Employee,
  type InsertEmployee,
  type Question,
  type InsertQuestion,
  type CheckinSchedule,
  type InsertCheckinSchedule,
  type CheckinResponse,
  type InsertCheckinResponse,
  type Template,
  type InsertTemplate,
  type PulseScore,
  type InsertPulseScore,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, avg, count } from "drizzle-orm";

export interface IStorage {
  // User operations for email-based auth
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  createUser(user: Omit<typeof users.$inferInsert, 'createdAt' | 'updatedAt'>): Promise<User>;
  verifyUser(id: string): Promise<void>;
  setPasswordResetToken(id: string, token: string, expiry: Date): Promise<void>;
  updateUserPassword(id: string, passwordHash: string): Promise<void>;
  clearPasswordResetToken(id: string): Promise<void>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  
  // Team operations
  createTeam(team: InsertTeam): Promise<Team>;
  getTeamsByManager(managerId: string): Promise<Team[]>;
  getTeamById(id: string): Promise<Team | undefined>;
  updateTeam(id: string, updates: Partial<InsertTeam>): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  
  // Employee operations
  addEmployees(employees: InsertEmployee[]): Promise<Employee[]>;
  getEmployeesByTeam(teamId: string): Promise<Employee[]>;
  replaceEmployees(teamId: string, employees: InsertEmployee[]): Promise<Employee[]>;
  deleteEmployee(id: string): Promise<void>;
  
  // Question operations
  createQuestions(questions: InsertQuestion[]): Promise<Question[]>;
  getQuestionsByTeam(teamId: string): Promise<Question[]>;
  updateQuestions(teamId: string, questions: InsertQuestion[]): Promise<Question[]>;
  deleteQuestion(id: string): Promise<void>;
  
  // Schedule operations
  createOrUpdateSchedule(schedule: InsertCheckinSchedule): Promise<CheckinSchedule>;
  getScheduleByTeam(teamId: string): Promise<CheckinSchedule | undefined>;
  getActiveSchedules(): Promise<CheckinSchedule[]>;
  updateScheduleLastSent(id: string): Promise<void>;
  
  // Response operations
  submitResponse(response: InsertCheckinResponse): Promise<CheckinResponse>;
  getResponsesByTeam(teamId: string, fromDate?: Date, toDate?: Date): Promise<CheckinResponse[]>;
  getResponsesForWeek(teamId: string, weekStart: Date): Promise<CheckinResponse[]>;
  
  // Template operations
  getBuiltInTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  
  // Pulse score operations
  createPulseScore(score: InsertPulseScore): Promise<PulseScore>;
  getPulseScoresByTeam(teamId: string, limit?: number): Promise<PulseScore[]>;
  getLatestPulseScore(teamId: string): Promise<PulseScore | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.verificationToken, token));
    return user;
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.resetToken, token));
    return user;
  }

  async createUser(userData: Omit<typeof users.$inferInsert, 'createdAt' | 'updatedAt'>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async verifyUser(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        isVerified: true,
        verificationToken: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async setPasswordResetToken(id: string, token: string, expiry: Date): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: token,
        resetTokenExpiry: expiry,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async clearPasswordResetToken(id: string): Promise<void> {
    await db
      .update(users)
      .set({
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        subscriptionStatus: 'active',
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Team operations
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    return newTeam;
  }

  async getTeamsByManager(managerId: string): Promise<Team[]> {
    return await db.select().from(teams).where(eq(teams.managerId, managerId));
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }

  async updateTeam(id: string, updates: Partial<InsertTeam>): Promise<Team> {
    const [team] = await db
      .update(teams)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(teams.id, id))
      .returning();
    return team;
  }

  async deleteTeam(id: string): Promise<void> {
    // Note: This will cascade delete all related records due to foreign key constraints
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Employee operations
  async addEmployees(employeeList: InsertEmployee[]): Promise<Employee[]> {
    return await db.insert(employees).values(employeeList).returning();
  }

  async getEmployeesByTeam(teamId: string): Promise<Employee[]> {
    return await db.select().from(employees).where(eq(employees.teamId, teamId));
  }

  async replaceEmployees(teamId: string, employeeList: InsertEmployee[]): Promise<Employee[]> {
    // Delete existing employees
    await db.delete(employees).where(eq(employees.teamId, teamId));
    // Insert new employees
    if (employeeList.length > 0) {
      return await db.insert(employees).values(employeeList).returning();
    }
    return [];
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Question operations
  async createQuestions(questionList: InsertQuestion[]): Promise<Question[]> {
    return await db.insert(questions).values(questionList).returning();
  }

  async getQuestionsByTeam(teamId: string): Promise<Question[]> {
    return await db
      .select()
      .from(questions)
      .where(eq(questions.teamId, teamId))
      .orderBy(questions.order);
  }

  async updateQuestions(teamId: string, questionList: InsertQuestion[]): Promise<Question[]> {
    // Delete existing questions
    await db.delete(questions).where(eq(questions.teamId, teamId));
    // Insert new questions
    return await db.insert(questions).values(questionList).returning();
  }

  async deleteQuestion(id: string): Promise<void> {
    await db.delete(questions).where(eq(questions.id, id));
  }

  // Schedule operations
  async createOrUpdateSchedule(schedule: InsertCheckinSchedule): Promise<CheckinSchedule> {
    const existing = await db
      .select()
      .from(checkinSchedules)
      .where(eq(checkinSchedules.teamId, schedule.teamId));

    if (existing.length > 0) {
      const [updated] = await db
        .update(checkinSchedules)
        .set(schedule)
        .where(eq(checkinSchedules.teamId, schedule.teamId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(checkinSchedules).values(schedule).returning();
      return created;
    }
  }

  async getScheduleByTeam(teamId: string): Promise<CheckinSchedule | undefined> {
    const [schedule] = await db
      .select()
      .from(checkinSchedules)
      .where(eq(checkinSchedules.teamId, teamId));
    return schedule;
  }

  async getActiveSchedules(): Promise<CheckinSchedule[]> {
    return await db
      .select()
      .from(checkinSchedules)
      .where(eq(checkinSchedules.isActive, true));
  }

  async updateScheduleLastSent(id: string): Promise<void> {
    await db
      .update(checkinSchedules)
      .set({ lastSentAt: new Date() })
      .where(eq(checkinSchedules.id, id));
  }

  // Response operations
  async submitResponse(response: InsertCheckinResponse): Promise<CheckinResponse> {
    const [newResponse] = await db.insert(checkinResponses).values(response).returning();
    return newResponse;
  }

  async getResponsesByTeam(teamId: string, fromDate?: Date, toDate?: Date): Promise<CheckinResponse[]> {
    let whereConditions = [eq(checkinResponses.teamId, teamId)];
    
    if (fromDate && toDate) {
      whereConditions.push(
        gte(checkinResponses.checkinDate, fromDate),
        lte(checkinResponses.checkinDate, toDate)
      );
    }
    
    return await db
      .select()
      .from(checkinResponses)
      .where(and(...whereConditions))
      .orderBy(desc(checkinResponses.submittedAt));
  }

  async getResponsesForWeek(teamId: string, weekStart: Date): Promise<CheckinResponse[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return await db
      .select()
      .from(checkinResponses)
      .where(
        and(
          eq(checkinResponses.teamId, teamId),
          gte(checkinResponses.checkinDate, weekStart),
          lte(checkinResponses.checkinDate, weekEnd)
        )
      );
  }

  // Template operations
  async getBuiltInTemplates(): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.isBuiltIn, true));
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  // Pulse score operations
  async createPulseScore(score: InsertPulseScore): Promise<PulseScore> {
    const [pulseScore] = await db.insert(pulseScores).values(score).returning();
    return pulseScore;
  }

  async getPulseScoresByTeam(teamId: string, limit = 12): Promise<PulseScore[]> {
    return await db
      .select()
      .from(pulseScores)
      .where(eq(pulseScores.teamId, teamId))
      .orderBy(desc(pulseScores.weekStarting))
      .limit(limit);
  }

  async getLatestPulseScore(teamId: string): Promise<PulseScore | undefined> {
    const [score] = await db
      .select()
      .from(pulseScores)
      .where(eq(pulseScores.teamId, teamId))
      .orderBy(desc(pulseScores.weekStarting))
      .limit(1);
    return score;
  }
}

export const storage = new DatabaseStorage();
