import cron from 'node-cron';
import { storage } from './storage';
import { sendFeedbackEmail, sendReminderEmail } from './emailService';

export function scheduleCheckins(): void {
  // Run every hour to check for scheduled check-ins
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      const schedules = await storage.getActiveSchedules();
      
      for (const schedule of schedules) {
        // Convert dayOfWeek (1-7 Monday-Sunday) to JavaScript (0-6 Sunday-Saturday)
        const scheduleDayJS = schedule.dayOfWeek === 7 ? 0 : schedule.dayOfWeek;
        
        if (scheduleDayJS === currentDay && schedule.hour === currentHour) {
          // Check if we already sent today
          const lastSent = schedule.lastSentAt;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          if (!lastSent || lastSent < today) {
            await sendCheckinEmails(schedule.teamId);
            await storage.updateScheduleLastSent(schedule.id);
          }
        }
      }
    } catch (error) {
      console.error('Error in check-in scheduler:', error);
    }
  });

  // Send reminders 72 hours after initial check-in
  cron.schedule('0 */6 * * *', async () => {
    // This would track which employees haven't responded and send reminders
    // Implementation depends on how you want to track individual responses anonymously
  });
}

async function sendCheckinEmails(teamId: string): Promise<void> {
  try {
    const [team, employees, questions] = await Promise.all([
      storage.getTeamById(teamId),
      storage.getEmployeesByTeam(teamId),
      storage.getQuestionsByTeam(teamId),
    ]);

    if (!team || !employees.length || !questions.length) {
      console.log(`Skipping check-in for team ${teamId} - missing data`);
      return;
    }

    console.log(`Sending check-ins to ${employees.length} employees for team: ${team.name}`);

    // Send emails to all active employees
    const emailPromises = employees
      .filter(emp => emp.isActive)
      .map(employee => 
        sendFeedbackEmail(employee.email, teamId, team.name, questions.map(q => ({
          id: q.id,
          title: q.title,
          type: q.type,
          isRequired: q.isRequired || false
        })))
      );

    await Promise.all(emailPromises);
    console.log(`Check-in emails sent successfully for team: ${team.name}`);
  } catch (error) {
    console.error(`Failed to send check-in emails for team ${teamId}:`, error);
  }
}

export function calculatePulseScores(): void {
  // Run every Sunday at midnight to calculate weekly pulse scores
  cron.schedule('0 0 * * 0', async () => {
    try {
      const teams = await storage.getTeamsByManager(''); // Get all teams
      
      for (const team of teams) {
        await calculateTeamPulseScore(team.id);
      }
    } catch (error) {
      console.error('Error calculating pulse scores:', error);
    }
  });
}

async function calculateTeamPulseScore(teamId: string): Promise<void> {
  try {
    // Get the start of the current week (Sunday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Get responses for this week
    const responses = await storage.getResponsesForWeek(teamId, weekStart);
    const employees = await storage.getEmployeesByTeam(teamId);

    if (responses.length === 0) {
      console.log(`No responses for team ${teamId} this week`);
      return;
    }

    // Calculate average score from metric questions (1-10 scale)
    const metricResponses = responses.filter(r => {
      const value = parseInt(r.responseValue || '0');
      return !isNaN(value) && value >= 1 && value <= 10;
    });

    if (metricResponses.length === 0) {
      console.log(`No metric responses for team ${teamId} this week`);
      return;
    }

    const totalScore = metricResponses.reduce((sum, r) => {
      return sum + parseInt(r.responseValue || '0');
    }, 0);

    const averageScore = totalScore / metricResponses.length;
    
    // Count unique responses (since we can't track individuals, count total responses)
    const responseCount = Math.ceil(responses.length / 3); // Rough estimate based on question count
    
    await storage.createPulseScore({
      teamId,
      score: averageScore.toFixed(1),
      responseCount,
      totalEmployees: employees.length,
      weekStarting: weekStart,
    });

    console.log(`Pulse score calculated for team ${teamId}: ${averageScore.toFixed(1)}`);

    // Check for alerts (score drop > 2.0 points)
    const previousScores = await storage.getPulseScoresByTeam(teamId, 2);
    if (previousScores.length >= 2) {
      const current = parseFloat(previousScores[0].score);
      const previous = parseFloat(previousScores[1].score);
      const drop = previous - current;

      if (drop > 2.0) {
        console.log(`ALERT: Team ${teamId} pulse score dropped by ${drop.toFixed(1)} points`);
        // Here you would send an alert email to the manager
        await sendPulseAlert(teamId, current, drop);
      }
    }
  } catch (error) {
    console.error(`Failed to calculate pulse score for team ${teamId}:`, error);
  }
}

async function sendPulseAlert(teamId: string, currentScore: number, drop: number): Promise<void> {
  try {
    const team = await storage.getTeamById(teamId);
    if (!team) return;

    const manager = await storage.getUser(team.managerId);
    if (!manager?.email) return;

    // Send alert email to manager
    // Implementation would go here
    console.log(`Would send pulse alert to ${manager.email} for team ${team.name}`);
  } catch (error) {
    console.error('Failed to send pulse alert:', error);
  }
}
