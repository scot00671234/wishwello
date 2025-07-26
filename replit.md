# Wish Wello - Employee Wellbeing Tracking Platform

## Overview

Wish Wello is a full-stack employee wellbeing tracking application designed to help managers detect potential resignation risks through anonymous employee feedback. The platform uses PWA push notifications to deliver instant survey notifications to employees' devices with zero setup required - employees simply click "Allow" once and receive all future surveys as push notifications.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with:

**Frontend**: React with TypeScript, using Vite as the build tool
**Backend**: Express.js server with TypeScript
**Database**: PostgreSQL with Drizzle ORM
**Authentication**: Replit-based OIDC authentication
**Payment Processing**: Stripe integration for subscriptions
**Notification System**: PWA push notifications with web-push library
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
3. **Notification Enablement**: Employees visit survey link once and enable PWA push notifications
4. **Instant Survey Distribution**: Managers send surveys instantly via push notifications (98% delivery rate)
5. **Response Collection**: Employees click notification → survey opens → submit anonymous feedback
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
- **Push Notifications**: web-push, Service Worker API
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

## Recent Changes (January 2025)

✓ **Modern Landing Page Redesign**: Clean, professional design focused specifically on Wish Wello's employee wellbeing services
✓ **Service-Focused Content**: Updated all content to highlight anonymous feedback, pulse tracking, and resignation risk detection
✓ **Enhanced Dashboard UI**: Modern styling with improved user experience and better visual hierarchy  
✓ **Wish Wello Branding**: Consistent branding throughout with focus on employee wellbeing and retention services
✓ **PWA Push Notification System**: Complete implementation with Service Worker, manifest.json, and web-push backend
✓ **Service Worker**: Background notification handling, offline support, and notification click handling
✓ **Push Service**: Backend service for sending bulk notifications with VAPID authentication
✓ **Survey Deadline Management**: Replaced recurring schedules with deadline-based survey management
✓ **Immediate Survey Access**: Team setup now provides instant access to shareable survey links
✓ **Live Survey Editing**: Added Survey tab in team editor for real-time question updates on same link
✓ **Unified Team Setup**: Consistent interface between team creation and editing with immediate functionality
✓ **Replit Migration Completed**: Successfully migrated from Replit Agent to standard Replit environment with proper client/server separation and security
✓ **Enhanced Email Input**: Improved email input functionality to support easy copy/paste from spreadsheets and contact lists with automatic email extraction
✓ **Question Templates**: Added 5 professional pre-made question templates for different wellbeing scenarios (General Wellbeing, Burnout Prevention, Team Engagement, Growth & Development, Remote Work Experience)

The platform now clearly positions Wish Wello as the leading employee wellbeing tracking solution, with all content and features directed towards helping managers detect resignation risks early and build stronger teams through anonymous feedback. The new survey system focuses on deadlines rather than recurring schedules, providing immediate access to shareable links upon team creation. The application is now fully compatible with the standard Replit environment and ready for production deployment.