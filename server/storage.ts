import {
  users,
  teams,
  employees,
  questions,
  surveyDeadlines,
  surveyResponses,
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
  type SurveyDeadline,
  type InsertSurveyDeadline,
  type SurveyResponse,
  type InsertSurveyResponse,
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
  
  // Survey deadline operations
  createOrUpdateSurveyDeadline(deadline: InsertSurveyDeadline): Promise<SurveyDeadline>;
  getSurveyDeadlineByTeam(teamId: string): Promise<SurveyDeadline | undefined>;
  getActiveSurveyDeadlines(): Promise<SurveyDeadline[]>;
  closeSurvey(id: string): Promise<void>;
  
  // Response operations
  submitResponse(response: InsertSurveyResponse): Promise<SurveyResponse>;
  getResponsesByTeam(teamId: string, fromDate?: Date, toDate?: Date): Promise<SurveyResponse[]>;
  getResponsesForWeek(teamId: string, weekStart: Date): Promise<SurveyResponse[]>;
  
  // Template operations
  getBuiltInTemplates(): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  
  // Pulse score operations
  createPulseScore(score: InsertPulseScore): Promise<PulseScore>;
  getPulseScoresByTeam(teamId: string, limit?: number): Promise<PulseScore[]>;
  getLatestPulseScore(teamId: string): Promise<PulseScore | undefined>;
  
  // Push notification operations
  savePushSubscription(subscription: any): Promise<void>;
  removePushSubscription(endpoint: string): Promise<void>;
  getPushSubscriptionsByTeam(teamId: string): Promise<any[]>;
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
    const teamList = await db.select().from(teams).where(eq(teams.managerId, managerId));
    
    // Get related data for each team
    const teamsWithData = await Promise.all(
      teamList.map(async (team) => {
        const [teamEmployees, teamQuestions, teamSchedules] = await Promise.all([
          this.getEmployeesByTeam(team.id),
          this.getQuestionsByTeam(team.id),
          this.getSchedulesByTeam(team.id)
        ]);
        
        return {
          ...team,
          employees: teamEmployees,
          questions: teamQuestions,
          schedules: teamSchedules
        };
      })
    );
    
    return teamsWithData;
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    if (!team) return undefined;
    
    // Get related data
    const [teamEmployees, teamQuestions, teamSchedules] = await Promise.all([
      this.getEmployeesByTeam(team.id),
      this.getQuestionsByTeam(team.id),
      this.getSchedulesByTeam(team.id)
    ]);
    
    return {
      ...team,
      employees: teamEmployees,
      questions: teamQuestions,
      schedules: teamSchedules
    };
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

  // Survey deadline operations
  async createOrUpdateSurveyDeadline(deadline: InsertSurveyDeadline): Promise<SurveyDeadline> {
    const existing = await db
      .select()
      .from(surveyDeadlines)
      .where(eq(surveyDeadlines.teamId, deadline.teamId));

    if (existing.length > 0) {
      const [updated] = await db
        .update(surveyDeadlines)
        .set(deadline)
        .where(eq(surveyDeadlines.teamId, deadline.teamId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(surveyDeadlines).values(deadline).returning();
      return created;
    }
  }

  async getSurveyDeadlineByTeam(teamId: string): Promise<SurveyDeadline | undefined> {
    const [deadline] = await db
      .select()
      .from(surveyDeadlines)
      .where(eq(surveyDeadlines.teamId, teamId));
    return deadline;
  }

  async getActiveSurveyDeadlines(): Promise<SurveyDeadline[]> {
    return await db
      .select()
      .from(surveyDeadlines)
      .where(eq(surveyDeadlines.isActive, true));
  }

  async closeSurvey(id: string): Promise<void> {
    await db
      .update(surveyDeadlines)
      .set({ closedAt: new Date(), isActive: false })
      .where(eq(surveyDeadlines.id, id));
  }

  // Response operations
  async submitResponse(response: InsertSurveyResponse): Promise<SurveyResponse> {
    const [newResponse] = await db.insert(surveyResponses).values(response).returning();
    return newResponse;
  }

  async getResponsesByTeam(teamId: string, fromDate?: Date, toDate?: Date): Promise<SurveyResponse[]> {
    let whereConditions = [eq(surveyResponses.teamId, teamId)];
    
    if (fromDate && toDate) {
      whereConditions.push(
        gte(surveyResponses.submittedAt, fromDate),
        lte(surveyResponses.submittedAt, toDate)
      );
    }
    
    return await db
      .select()
      .from(surveyResponses)
      .where(and(...whereConditions))
      .orderBy(desc(surveyResponses.submittedAt));
  }

  async getResponsesForWeek(teamId: string, weekStart: Date): Promise<SurveyResponse[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    return await db
      .select()
      .from(surveyResponses)
      .where(
        and(
          eq(surveyResponses.teamId, teamId),
          gte(surveyResponses.submittedAt, weekStart),
          lte(surveyResponses.submittedAt, weekEnd)
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

  // Schedule operations (deprecated - using survey deadlines instead)
  async getSchedulesByTeam(teamId: string): Promise<any[]> {
    // Return empty array since schedules are deprecated in favor of survey deadlines
    return [];
  }

  async getScheduleByTeam(teamId: string): Promise<any> {
    // Return undefined since schedules are deprecated
    return undefined;
  }

  async createOrUpdateSchedule(scheduleData: any): Promise<any> {
    // Schedules are deprecated - this method is kept for compatibility
    return { id: 'deprecated', teamId: scheduleData.teamId };
  }

  // Push notification operations (simplified for now - would use proper schema in production)
  async savePushSubscription(subscription: any): Promise<void> {
    // For MVP, store as JSON in a simple way
    // In production, you'd want a proper pushSubscriptions table
    console.log('Saving push subscription:', subscription.endpoint);
    // Store in memory for now - in production use database
  }

  async removePushSubscription(endpoint: string): Promise<void> {
    console.log('Removing push subscription:', endpoint);
    // Remove from database in production
  }

  async getPushSubscriptionsByTeam(teamId: string): Promise<any[]> {
    console.log('Getting push subscriptions for team:', teamId);
    // Return empty array for now - in production query database
    return [];
  }
}

export const storage = new DatabaseStorage();
