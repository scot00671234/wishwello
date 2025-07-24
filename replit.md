# Wish Wello - Employee Wellbeing Tracking Platform

## Overview

Wish Wello is a full-stack employee wellbeing tracking application designed to help managers detect potential resignation risks through anonymous employee feedback. The platform enables teams to set up customizable check-in schedules, collect anonymous responses, and monitor wellbeing trends through pulse scores and analytics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with:

**Frontend**: React with TypeScript, using Vite as the build tool
**Backend**: Express.js server with TypeScript
**Database**: PostgreSQL with Drizzle ORM
**Authentication**: Replit-based OIDC authentication
**Payment Processing**: Stripe integration for subscriptions
**Email Service**: Nodemailer for automated check-ins and reminders
**UI Framework**: Shadcn/ui components with Tailwind CSS

## Key Components

### Frontend Architecture
- **Client-side routing**: Wouter for lightweight routing
- **State management**: TanStack Query for server state, React hooks for local state
- **Form handling**: React Hook Form with Zod validation
- **UI components**: Radix UI primitives with custom styling
- **Charts**: Recharts for pulse score visualization

### Backend Architecture
- **API Layer**: Express.js REST API with middleware for authentication and logging
- **Database Layer**: Drizzle ORM with type-safe schema definitions
- **Authentication**: Passport.js with OpenID Connect strategy for Replit auth
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **Scheduled Tasks**: Node-cron for automated check-in emails and pulse calculations

### Database Schema
- **Users**: Store user profiles and subscription information
- **Teams**: Organizational units managed by users
- **Employees**: Anonymous team members receiving check-ins
- **Questions**: Customizable feedback questions (metric, yes/no, comment types)
- **Checkin Schedules**: Configurable timing for automated feedback requests
- **Checkin Responses**: Anonymous feedback submissions
- **Pulse Scores**: Calculated wellbeing metrics over time

## Data Flow

1. **Team Setup**: Managers create teams and add employee emails
2. **Question Configuration**: Custom feedback questions are created per team
3. **Schedule Setup**: Automated check-in timing is configured
4. **Email Distribution**: Scheduled emails sent to employees with anonymous feedback links
5. **Response Collection**: Employees submit anonymous feedback through public forms
6. **Data Analysis**: Pulse scores calculated from responses and trends tracked
7. **Dashboard Visualization**: Managers view aggregated insights and individual comments

## External Dependencies

### Third-party Services
- **Neon Database**: PostgreSQL hosting service
- **Stripe**: Payment processing for subscriptions
- **SMTP Service**: Email delivery (configurable provider)
- **Replit Authentication**: OIDC-based user authentication

### Key Libraries
- **Database**: Drizzle ORM, @neondatabase/serverless
- **Authentication**: Passport.js, openid-client
- **Email**: Nodemailer
- **Validation**: Zod
- **UI**: Radix UI, Tailwind CSS, Shadcn/ui
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Scheduling**: node-cron

## Deployment Strategy

The application is designed for deployment on Replit with:

**Build Process**: 
- Frontend built with Vite and served as static files
- Backend bundled with esbuild for Node.js runtime

**Environment Configuration**:
- Database connection via DATABASE_URL
- SMTP credentials for email service
- Stripe API keys for payment processing
- Session secrets for authentication

**Development Workflow**:
- Hot module replacement in development
- TypeScript compilation checking
- Database migrations via Drizzle Kit

**Production Considerations**:
- Static file serving through Express
- Session persistence in PostgreSQL
- Error handling and logging middleware
- HTTPS enforcement for secure authentication

The architecture emphasizes type safety, developer experience, and scalability while maintaining simplicity for the MVP scope. The anonymous feedback system ensures employee privacy while providing valuable insights to management.