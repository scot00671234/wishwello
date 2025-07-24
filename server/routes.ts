import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { scheduleCheckins, calculatePulseScores } from "./scheduler";
import { sendFeedbackEmail } from "./emailService";
import {
  insertTeamSchema,
  insertEmployeeSchema,
  insertQuestionSchema,
  insertCheckinScheduleSchema,
  insertCheckinResponseSchema,
} from "@shared/schema";
import { z } from "zod";

// Skip Stripe initialization in development if keys are not provided
const hasStripeKeys = process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY;

const stripe = hasStripeKeys ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize scheduler
  scheduleCheckins();
  calculatePulseScores();

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

  // Team routes
  app.post('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teamData = insertTeamSchema.parse({ ...req.body, managerId: userId });
      const team = await storage.createTeam(teamData);
      res.json(team);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/teams', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const teams = await storage.getTeamsByManager(userId);
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/teams/:teamId', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const team = await storage.getTeamById(teamId);
      
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Employee routes
  app.post('/api/teams/:teamId/employees', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const { emails } = req.body;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }

      const employeeData = emails.map((email: string) => ({
        email,
        teamId,
      }));

      const employees = await storage.addEmployees(employeeData);
      res.json(employees);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/teams/:teamId/employees', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }

      const employees = await storage.getEmployeesByTeam(teamId);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Question routes
  app.post('/api/teams/:teamId/questions', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      const { questions } = req.body;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }

      const questionData = questions.map((q: any, index: number) => ({
        ...q,
        teamId,
        order: index,
      }));

      const updatedQuestions = await storage.updateQuestions(teamId, questionData);
      res.json(updatedQuestions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/teams/:teamId/questions', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }

      const questions = await storage.getQuestionsByTeam(teamId);
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Schedule routes
  app.post('/api/teams/:teamId/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }

      const scheduleData = insertCheckinScheduleSchema.parse({ ...req.body, teamId });
      const schedule = await storage.createOrUpdateSchedule(scheduleData);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/teams/:teamId/schedule', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }

      const schedule = await storage.getScheduleByTeam(teamId);
      res.json(schedule);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Feedback submission (public route)
  app.post('/api/feedback/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      const { responses } = req.body;

      // Validate team exists
      const team = await storage.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const checkinDate = new Date();
      checkinDate.setHours(0, 0, 0, 0); // Start of day

      // Submit each response
      for (const response of responses) {
        await storage.submitResponse({
          teamId,
          questionId: response.questionId,
          responseValue: response.value,
          checkinDate,
        });
      }

      res.json({ message: "Feedback submitted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Get feedback form (public route)
  app.get('/api/feedback/:teamId', async (req, res) => {
    try {
      const { teamId } = req.params;
      
      const team = await storage.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      const questions = await storage.getQuestionsByTeam(teamId);
      res.json({ team, questions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Dashboard data routes
  app.get('/api/teams/:teamId/dashboard', isAuthenticated, async (req: any, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.user.claims.sub) {
        return res.status(404).json({ message: "Team not found" });
      }

      const [pulseScores, employees, responses] = await Promise.all([
        storage.getPulseScoresByTeam(teamId, 12),
        storage.getEmployeesByTeam(teamId),
        storage.getResponsesByTeam(teamId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // Last 30 days
      ]);

      const latestScore = pulseScores[0];
      const previousScore = pulseScores[1];
      const trend = latestScore && previousScore ? 
        parseFloat(latestScore.score) - parseFloat(previousScore.score) : 0;

      // Get recent comments
      const comments = responses
        .filter(r => r.responseValue && r.responseValue.length > 10)
        .slice(0, 10)
        .map(r => ({
          text: r.responseValue,
          submittedAt: r.submittedAt,
        }));

      res.json({
        currentPulse: latestScore ? parseFloat(latestScore.score) : null,
        trend,
        responseRate: latestScore ? Math.round((latestScore.responseCount / latestScore.totalEmployees) * 100) : 0,
        totalEmployees: employees.length,
        pulseHistory: pulseScores.reverse().map(s => ({
          date: s.weekStarting,
          score: parseFloat(s.score),
          responseCount: s.responseCount,
        })),
        recentComments: comments,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Template routes
  app.get('/api/templates', async (req, res) => {
    try {
      const templates = await storage.getBuiltInTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe subscription route
  app.post('/api/get-or-create-subscription', isAuthenticated, async (req: any, res) => {
    if (!stripe) {
      return res.status(503).json({ message: 'Payment service not available' });
    }
    
    const user = req.user;

    if (user.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });

      return;
    }
    
    if (!user.email) {
      throw new Error('No user email on file');
    }

    try {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      });

      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234', // Default price ID
        }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 7,
      });

      await storage.updateUserStripeInfo(user.claims.sub, customer.id, subscription.id);
  
      res.send({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      });
    } catch (error: any) {
      return res.status(400).send({ error: { message: error.message } });
    }
  });

  // Stripe webhook
  app.post('/api/stripe-webhook', (req, res) => {
    // Handle Stripe webhooks for subscription updates
    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}
