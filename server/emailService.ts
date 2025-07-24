import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Create email transporter (using environment variables for config)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}

export async function sendFeedbackEmail(
  employeeEmail: string, 
  teamId: string, 
  teamName: string,
  questions: Array<{ id: string; title: string; type: string; isRequired: boolean }>
): Promise<void> {
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const feedbackUrl = `https://${domain}/feedback/${teamId}`;

  const questionsHtml = questions.map(q => {
    if (q.type === 'metric') {
      return `
        <div style="margin-bottom: 24px;">
          <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">
            ${q.title} ${q.isRequired ? '*' : ''}
          </label>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span style="font-size: 12px; color: #6B7280;">Very Poor</span>
            ${Array.from({length: 10}, (_, i) => i + 1).map(num => 
              `<button data-question="${q.id}" data-value="${num}" style="width: 40px; height: 40px; border: 2px solid #E5E7EB; border-radius: 8px; background: white; font-weight: 600; color: #374151; cursor: pointer;">${num}</button>`
            ).join('')}
            <span style="font-size: 12px; color: #6B7280;">Excellent</span>
          </div>
        </div>
      `;
    } else if (q.type === 'yesno') {
      return `
        <div style="margin-bottom: 24px;">
          <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">
            ${q.title} ${q.isRequired ? '*' : ''}
          </label>
          <div style="display: flex; gap: 12px;">
            <button data-question="${q.id}" data-value="yes" style="flex: 1; padding: 12px; border: 2px solid #10B981; background: #ECFDF5; color: #065F46; border-radius: 8px; font-weight: 600; cursor: pointer;">✓ Yes</button>
            <button data-question="${q.id}" data-value="no" style="flex: 1; padding: 12px; border: 2px solid #E5E7EB; background: white; color: #374151; border-radius: 8px; font-weight: 600; cursor: pointer;">✗ No</button>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="margin-bottom: 24px;">
          <label style="display: block; font-weight: 600; color: #374151; margin-bottom: 8px;">
            ${q.title} ${q.isRequired ? '*' : ''}
          </label>
          <textarea data-question="${q.id}" rows="4" style="width: 100%; padding: 12px; border: 2px solid #E5E7EB; border-radius: 8px; font-family: inherit; resize: vertical;" placeholder="Share your thoughts..."></textarea>
        </div>
      `;
    }
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Team Check-in</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #F9FAFB;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0070F3, #7C3AED); padding: 32px; text-align: center;">
          <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 24px;">❤️</span>
          </div>
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">Weekly Team Check-in</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${teamName} • 2 minutes to complete</p>
        </div>

        <!-- Content -->
        <div style="padding: 32px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin-bottom: 8px;">How are you feeling this week?</h2>
            <p style="color: #6B7280; margin: 0;">Your responses are completely anonymous and help us improve our workplace.</p>
          </div>

          <form id="feedbackForm" style="margin-bottom: 32px;">
            ${questionsHtml}
            
            <button type="submit" style="width: 100%; background: #111827; color: white; padding: 16px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; margin-top: 16px;">
              Submit Feedback
            </button>
          </form>

          <div style="text-align: center; padding-top: 24px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px; margin: 0;">
              This feedback is completely anonymous and helps improve our workplace.<br>
              <a href="${feedbackUrl}" style="color: #0070F3; text-decoration: none;">Complete on web</a>
            </p>
          </div>
        </div>
      </div>

      <script>
        document.getElementById('feedbackForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const responses = [];
          const questions = document.querySelectorAll('[data-question]');
          
          questions.forEach(element => {
            const questionId = element.getAttribute('data-question');
            let value = null;
            
            if (element.tagName === 'BUTTON' && element.style.borderColor === 'rgb(16, 185, 129)') {
              value = element.getAttribute('data-value');
            } else if (element.tagName === 'TEXTAREA') {
              value = element.value;
            }
            
            if (value) {
              responses.push({ questionId, value });
            }
          });

          try {
            const response = await fetch('${feedbackUrl}', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ responses })
            });
            
            if (response.ok) {
              document.body.innerHTML = '<div style="text-align: center; padding: 40px;"><h2 style="color: #10B981;">Thank you for your feedback!</h2><p>Your response has been submitted anonymously.</p></div>';
            }
          } catch (error) {
            alert('Failed to submit feedback. Please try again.');
          }
        });

        // Add click handlers for buttons
        document.querySelectorAll('button[data-question]').forEach(button => {
          button.addEventListener('click', function() {
            const questionId = this.getAttribute('data-question');
            const questionButtons = document.querySelectorAll('[data-question="' + questionId + '"]');
            
            questionButtons.forEach(btn => {
              btn.style.borderColor = '#E5E7EB';
              btn.style.backgroundColor = 'white';
              btn.style.color = '#374151';
            });
            
            this.style.borderColor = '#10B981';
            this.style.backgroundColor = '#ECFDF5';
            this.style.color = '#065F46';
          });
        });
      </script>
    </body>
    </html>
  `;

  await sendEmail({
    to: employeeEmail,
    subject: `Weekly Check-in: ${teamName}`,
    html,
  });
}

export async function sendReminderEmail(employeeEmail: string, teamId: string, teamName: string): Promise<void> {
  const domain = process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000';
  const feedbackUrl = `https://${domain}/feedback/${teamId}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Friendly Reminder: Team Check-in</title>
    </head>
    <body style="font-family: 'Inter', sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #F9FAFB;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); overflow: hidden;">
        <div style="background: #FEF3C7; padding: 24px; text-align: center; border-left: 4px solid #F59E0B;">
          <h1 style="color: #92400E; margin: 0; font-size: 20px;">Friendly Reminder</h1>
          <p style="color: #A16207; margin: 8px 0 0 0;">We haven't received your check-in for ${teamName} yet</p>
        </div>

        <div style="padding: 32px; text-align: center;">
          <p style="color: #374151; margin-bottom: 24px;">Your anonymous feedback helps us create a better workplace for everyone. It only takes 2 minutes!</p>
          
          <a href="${feedbackUrl}" style="display: inline-block; background: #0070F3; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-bottom: 16px;">
            Complete Check-in
          </a>
          
          <p style="color: #6B7280; font-size: 14px; margin: 0;">
            This feedback is completely anonymous and optional.<br>
            If you'd prefer not to receive these reminders, please contact your manager.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: employeeEmail,
    subject: `Reminder: Team Check-in for ${teamName}`,
    html,
  });
}
