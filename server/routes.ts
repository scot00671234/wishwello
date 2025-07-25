import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, requireAuth, authService } from "./auth";
import { pushService, type PushSubscriptionData } from "./push";
import { scheduleCheckins, calculatePulseScores } from "./scheduler";
import { sendFeedbackEmail } from "./emailService";
import {
  insertTeamSchema,
  insertEmployeeSchema,
  insertQuestionSchema,
  insertSurveyDeadlineSchema,
  insertSurveyResponseSchema,
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "@shared/schema";
import { z } from "zod";

// Skip Stripe initialization in development if keys are not provided
const hasStripeKeys = process.env.STRIPE_SECRET_KEY && process.env.VITE_STRIPE_PUBLIC_KEY;

const stripe = hasStripeKeys ? new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-06-30.basil",
}) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  setupAuth(app);

  // Initialize scheduler
  scheduleCheckins();
  calculatePulseScores();

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const data = signupSchema.parse(req.body);
      const user = await authService.signup(data.email, data.password, data.firstName, data.lastName);
      req.session.userId = user.id;
      res.json({ message: 'Account created successfully', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await authService.login(data.email, data.password);
      req.session.userId = user.id;
      res.json({ message: 'Login successful', user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logout successful' });
    });
  });

  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const data = forgotPasswordSchema.parse(req.body);
      await authService.requestPasswordReset(data.email);
      res.json({ message: 'Password reset email sent' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const data = resetPasswordSchema.parse(req.body);
      await authService.resetPassword(data.token, data.password);
      res.json({ message: 'Password reset successful' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/auth/verify-email', async (req, res) => {
    try {
      const token = req.query.token as string;
      if (!token) {
        return res.status(400).json({ message: 'Verification token required' });
      }
      await authService.verifyEmail(token);
      res.json({ message: 'Email verified successfully' });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/auth/user', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, isVerified: user.isVerified });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Team routes
  app.post('/api/teams', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const teamData = insertTeamSchema.parse({ ...req.body, managerId: userId });
      const team = await storage.createTeam(teamData);
      res.json(team);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/teams', requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const teams = await storage.getTeamsByManager(userId);
      res.json(teams);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get('/api/teams/:teamId', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const team = await storage.getTeamById(teamId);
      
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Team update and delete routes
  app.patch('/api/teams/:teamId', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const updates = req.body;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Update team name if provided
      if (updates.name) {
        await storage.updateTeam(teamId, { name: updates.name });
      }

      // Update employees if provided
      if (updates.employees) {
        const employeeData = updates.employees.map((email: string) => ({
          email,
          teamId,
        }));
        await storage.replaceEmployees(teamId, employeeData);
      }

      // Update questions if provided
      if (updates.questions) {
        const questionData = updates.questions.map((q: any, index: number) => ({
          ...q,
          teamId,
          order: index,
        }));
        await storage.updateQuestions(teamId, questionData);
      }

      // Update survey deadline if provided
      if (updates.surveyDeadline) {
        const deadlineData = insertSurveyDeadlineSchema.parse({ 
          ...updates.surveyDeadline, 
          teamId 
        });
        await storage.createOrUpdateSurveyDeadline(deadlineData);
      }

      const updatedTeam = await storage.getTeamById(teamId);
      res.json(updatedTeam);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete('/api/teams/:teamId', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      await storage.deleteTeam(teamId);
      res.json({ message: "Team deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Employee routes
  app.post('/api/teams/:teamId/employees', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { emails } = req.body;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Check if emails is an array and has valid emails
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        return res.status(400).json({ message: "No valid emails provided" });
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

  app.get('/api/teams/:teamId/employees', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      const employees = await storage.getEmployeesByTeam(teamId);
      res.json(employees);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Question routes
  app.post('/api/teams/:teamId/questions', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      const { questions } = req.body;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
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

  app.get('/api/teams/:teamId/questions', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      const questions = await storage.getQuestionsByTeam(teamId);
      res.json(questions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Schedule routes
  app.post('/api/teams/:teamId/schedule', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      const scheduleData = insertCheckinScheduleSchema.parse({ ...req.body, teamId });
      const schedule = await storage.createOrUpdateSchedule(scheduleData);
      res.json(schedule);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get('/api/teams/:teamId/schedule', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
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

  // Survey analytics endpoint (public route) - shows analytics after survey submission
  app.get('/api/feedback/:teamId/analytics', async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Validate team exists
      const team = await storage.getTeamById(teamId);
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Get questions and recent responses (last 30 days for context)
      const questions = await storage.getQuestionsByTeam(teamId);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const responses = await storage.getResponsesByTeam(teamId, thirtyDaysAgo);

      // Calculate analytics by question type
      const analytics = questions.map(question => {
        const questionResponses = responses.filter(r => r.questionId === question.id);
        
        if (question.type === 'metric') {
          // Calculate average, distribution for metric questions
          const values = questionResponses
            .map(r => parseFloat(r.responseValue))
            .filter(v => !isNaN(v));
          
          if (values.length === 0) {
            return {
              questionId: question.id,
              title: question.title,
              type: question.type,
              totalResponses: 0,
              average: null,
              distribution: {},
              insights: ['No responses yet for this question.']
            };
          }

          const average = values.reduce((sum, v) => sum + v, 0) / values.length;
          const distribution = values.reduce((dist: Record<string, number>, v) => {
            const key = v.toString();
            dist[key] = (dist[key] || 0) + 1;
            return dist;
          }, {});

          // Generate insights
          const insights = [];
          if (average >= 8) {
            insights.push('Excellent scores! Team is performing very well in this area.');
          } else if (average >= 6) {
            insights.push('Good scores with room for improvement.');
          } else {
            insights.push('Scores indicate this area needs attention and support.');
          }
          
          if (values.length >= 5) {
            const variance = values.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / values.length;
            if (variance > 4) {
              insights.push('High variation in responses suggests mixed experiences across the team.');
            } else {
              insights.push('Consistent responses indicate aligned team experiences.');
            }
          }

          return {
            questionId: question.id,
            title: question.title,
            type: question.type,
            totalResponses: values.length,
            average: Math.round(average * 10) / 10,
            distribution,
            insights
          };
        } 
        else if (question.type === 'yesno') {
          // Calculate yes/no percentages
          const yesCount = questionResponses.filter(r => r.responseValue?.toLowerCase() === 'yes').length;
          const noCount = questionResponses.filter(r => r.responseValue?.toLowerCase() === 'no').length;
          const total = yesCount + noCount;
          
          if (total === 0) {
            return {
              questionId: question.id,
              title: question.title,
              type: question.type,
              totalResponses: 0,
              yesPercentage: null,
              noPercentage: null,
              insights: ['No responses yet for this question.']
            };
          }

          const yesPercentage = Math.round((yesCount / total) * 100);
          const noPercentage = Math.round((noCount / total) * 100);

          // Generate insights
          const insights = [];
          if (yesPercentage >= 80) {
            insights.push('Strong positive consensus from the team.');
          } else if (yesPercentage >= 60) {
            insights.push('Majority positive, but some concerns exist.');
          } else if (yesPercentage >= 40) {
            insights.push('Mixed responses suggest this area needs attention.');
          } else {
            insights.push('Significant concerns - this area requires immediate focus.');
          }

          return {
            questionId: question.id,
            title: question.title,
            type: question.type,
            totalResponses: total,
            yesCount,
            noCount,
            yesPercentage,
            noPercentage,
            insights
          };
        } 
        else if (question.type === 'comment') {
          // Analyze comment themes and sentiment
          const comments = questionResponses
            .map(r => r.responseValue)
            .filter(comment => comment && comment.length > 5);

          if (comments.length === 0) {
            return {
              questionId: question.id,
              title: question.title,
              type: question.type,
              totalResponses: 0,
              comments: [],
              themes: [],
              insights: ['No comments yet for this question.']
            };
          }

          // Basic sentiment analysis and theme detection
          const positiveWords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'love', 'amazing', 'wonderful', 'positive', 'enjoy', 'appreciate'];
          const negativeWords = ['bad', 'terrible', 'awful', 'unhappy', 'frustrated', 'hate', 'difficult', 'problem', 'issue', 'concern', 'worried'];
          const stressWords = ['stress', 'overwhelmed', 'burnout', 'tired', 'exhausted', 'pressure', 'deadline'];
          const communicationWords = ['communication', 'feedback', 'meeting', 'talk', 'discuss', 'share', 'listen'];

          let positiveCount = 0;
          let negativeCount = 0;
          let stressCount = 0;
          let communicationCount = 0;

          comments.forEach(comment => {
            const lowerComment = comment.toLowerCase();
            if (positiveWords.some(word => lowerComment.includes(word))) positiveCount++;
            if (negativeWords.some(word => lowerComment.includes(word))) negativeCount++;
            if (stressWords.some(word => lowerComment.includes(word))) stressCount++;
            if (communicationWords.some(word => lowerComment.includes(word))) communicationCount++;
          });

          const themes = [];
          if (stressCount > 0) themes.push(`Stress/Workload (${stressCount} mentions)`);
          if (communicationCount > 0) themes.push(`Communication (${communicationCount} mentions)`);
          if (positiveCount >= comments.length * 0.6) themes.push('Generally Positive Feedback');
          if (negativeCount >= comments.length * 0.4) themes.push('Areas of Concern Identified');

          const insights = [];
          if (positiveCount > negativeCount) {
            insights.push('Overall positive sentiment in comments.');
          } else if (negativeCount > positiveCount) {
            insights.push('Comments highlight areas needing attention.');
          } else {
            insights.push('Mixed sentiment in feedback.');
          }

          if (stressCount >= comments.length * 0.3) {
            insights.push('⚠️ Multiple mentions of stress/workload - consider team support.');
          }

          return {
            questionId: question.id,
            title: question.title,
            type: question.type,
            totalResponses: comments.length,
            comments: comments.slice(0, 5), // Show first 5 for preview
            totalComments: comments.length,
            themes,
            sentimentCounts: {
              positive: positiveCount,
              negative: negativeCount,
              stress: stressCount,
              communication: communicationCount
            },
            insights
          };
        }

        return null;
      }).filter(Boolean);

      // Overall survey insights
      const totalResponses = responses.length;
      const uniqueRespondents = new Set(responses.map(r => `${r.teamId}-${r.submittedAt.toDateString()}`)).size;
      
      const overallInsights = [];
      if (totalResponses > 0) {
        overallInsights.push(`Received ${totalResponses} total responses from approximately ${uniqueRespondents} participants.`);
        
        // Calculate average engagement
        const metricQuestions = questions.filter(q => q.type === 'metric');
        if (metricQuestions.length > 0) {
          const avgScores = analytics
            .filter(a => a.type === 'metric' && a.totalResponses > 0)
            .map(a => a.average);
          
          if (avgScores.length > 0) {
            const overallAvg = avgScores.reduce((sum, score) => sum + score, 0) / avgScores.length;
            if (overallAvg >= 7.5) {
              overallInsights.push('🎉 Team wellbeing scores are strong overall!');
            } else if (overallAvg >= 6) {
              overallInsights.push('📊 Team wellbeing is good with opportunities for improvement.');
            } else {
              overallInsights.push('🔍 Survey indicates areas where the team needs additional support.');
            }
          }
        }
      } else {
        overallInsights.push('No responses collected yet.');
      }

      res.json({
        team: { name: team.name, companyName: team.companyName },
        questionAnalytics: analytics,
        overallInsights,
        responseStats: {
          totalResponses,
          approximateRespondents: uniqueRespondents,
          responsesPer30Days: totalResponses
        }
      });
    } catch (error: any) {
      console.error('Analytics error:', error);
      res.status(500).json({ message: error.message });
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
  app.get('/api/teams/:teamId/dashboard', requireAuth, async (req, res) => {
    try {
      const { teamId } = req.params;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Get date range from query params (default to last 30 days)
      const fromDate = req.query.from ? new Date(req.query.from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const toDate = req.query.to ? new Date(req.query.to as string) : new Date();

      const [employees, responses, questions] = await Promise.all([
        storage.getEmployeesByTeam(teamId),
        storage.getResponsesByTeam(teamId, fromDate),
        storage.getQuestionsByTeam(teamId)
      ]);

      // Calculate real-time metrics from responses
      const totalResponses = responses.length;
      const uniqueRespondents = new Set(responses.map(r => r.submittedAt.toDateString())).size;
      
      // Calculate average from metric questions
      const metricResponses = responses.filter(r => {
        const question = questions.find(q => q.id === r.questionId);
        return question?.type === 'metric';
      });

      let currentPulse = null;
      if (metricResponses.length > 0) {
        const validScores = metricResponses
          .map(r => parseFloat(r.responseValue))
          .filter(score => !isNaN(score));
        
        if (validScores.length > 0) {
          currentPulse = validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
          currentPulse = Math.round(currentPulse * 10) / 10; // Round to 1 decimal
        }
      }

      // Calculate response rate
      const responseRate = employees.length > 0 ? Math.round((uniqueRespondents / employees.length) * 100) : 0;

      // Get recent comments
      const commentResponses = responses.filter(r => {
        const question = questions.find(q => q.id === r.questionId);
        return question?.type === 'comment' && r.responseValue && r.responseValue.length > 10;
      });

      const recentComments = commentResponses
        .slice(0, 10)
        .map(r => ({
          text: r.responseValue,
          submittedAt: r.submittedAt,
        }));

      // Create pulse history (group by week for now)
      const pulseHistory = [];
      if (currentPulse !== null) {
        // For now, show current week data
        pulseHistory.push({
          date: new Date().toISOString(),
          score: currentPulse,
          responseCount: uniqueRespondents
        });
      }

      // Calculate trend (for now, just 0 since we need historical data)
      const trend = 0;

      res.json({
        currentPulse,
        trend,
        responseRate,
        totalEmployees: employees.length,
        totalResponses,
        uniqueRespondents,
        pulseHistory,
        recentComments,
      });
    } catch (error: any) {
      console.error('Dashboard error:', error);
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

  // Push notification routes
  app.post('/api/push/subscribe', async (req, res) => {
    try {
      const { endpoint, keys, teamId, employeeEmail } = req.body;
      
      if (!pushService.validateSubscription({ endpoint, keys })) {
        return res.status(400).json({ message: 'Invalid subscription data' });
      }

      // Store subscription in database
      await storage.savePushSubscription({
        endpoint,
        keys,
        teamId,
        employeeEmail
      });

      res.json({ message: 'Push subscription saved successfully' });
    } catch (error: any) {
      console.error('Push subscription error:', error);
      res.status(500).json({ message: 'Failed to save subscription' });
    }
  });

  app.post('/api/push/unsubscribe', async (req, res) => {
    try {
      const { endpoint } = req.body;
      await storage.removePushSubscription(endpoint);
      res.json({ message: 'Unsubscribed successfully' });
    } catch (error: any) {
      console.error('Push unsubscribe error:', error);
      res.status(500).json({ message: 'Failed to unsubscribe' });
    }
  });

  app.post('/api/push/send-team-survey', requireAuth, async (req, res) => {
    try {
      const { teamId, title } = req.body;
      
      // Verify team ownership
      const team = await storage.getTeamById(teamId);
      if (!team || team.managerId !== req.session.userId!) {
        return res.status(404).json({ message: "Team not found" });
      }

      // Get push subscriptions for this team
      const subscriptions = await storage.getPushSubscriptionsByTeam(teamId);
      
      if (subscriptions.length === 0) {
        return res.json({ message: 'No active subscriptions for this team', sent: 0, failed: 0 });
      }

      // Send notifications
      const results = await pushService.sendTeamSurvey(teamId, subscriptions, title);
      
      res.json({
        message: `Survey notifications sent`,
        sent: results.sent,
        failed: results.failed,
        total: subscriptions.length
      });
    } catch (error: any) {
      console.error('Send team survey error:', error);
      res.status(500).json({ message: 'Failed to send notifications' });
    }
  });

  app.post('/api/push/test', async (req, res) => {
    try {
      const { endpoint, keys, teamId } = req.body;
      
      if (!pushService.validateSubscription({ endpoint, keys })) {
        return res.status(400).json({ message: 'Invalid subscription data' });
      }

      const success = await pushService.sendTestNotification({
        endpoint,
        keys,
        teamId
      });

      res.json({ 
        message: success ? 'Test notification sent' : 'Failed to send test notification',
        success 
      });
    } catch (error: any) {
      console.error('Test notification error:', error);
      res.status(500).json({ message: 'Failed to send test notification' });
    }
  });

  // Stripe subscription route
  app.post('/api/get-or-create-subscription', requireAuth, async (req, res) => {
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
