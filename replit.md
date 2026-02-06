# BPC Records - Brachial Plexus Clinic

## Overview
Mobile medical records application for a pediatric brachial plexus palsy clinic (Brachial Plexus Clinic - BPC). Used by 6 surgeons on Android and iOS devices.

**Clinic Name:** Brachial Plexus Clinic (BPC)
**Tagline:** "Hope in Every Touch"
**Logo:** Located at `assets/images/clinic-logo.png`

## Recent Changes
- 2026-02-06: Initial application build with full database schema, API routes, and mobile UI
- Database schema includes: surgeons, patients, visits, hsc_ams_scores, mallet_scores, clinical_exams
- Authentication via session-based auth with bcrypt password hashing
- Longitudinal table views for HSC AMS, Mallet, and Clinical Examination scores

## User Preferences
- Data displayed in longitudinal table format with dates as columns (like the reference photos provided)
- HSC AMS Score: 0-7 scale for each movement (Shoulder, Elbow, Forearm, Wrist, Finger, Thumb)
- Mallet Score: Grade I-V for 5 movements, aggregate out of 30
- Clinical Examination: Multiple parameters (Shoulder Subluxation, Passive/Active ER, etc.)
- Patient search by name and ID number
- Track which surgeon viewed/updated records with timestamps

## Project Architecture
- **Frontend:** Expo React Native (SDK 54) with file-based routing (expo-router)
- **Backend:** Express.js with TypeScript on port 5000
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Session-based authentication with express-session + connect-pg-simple
- **Font:** Inter (Google Fonts)
- **Colors:** Primary red (#C41E3A), Secondary blue (#1B3A6B)

### Key Files
- `shared/schema.ts` - Database schema (Drizzle ORM)
- `server/routes.ts` - API endpoints
- `server/storage.ts` - Database storage layer
- `server/db.ts` - Database connection
- `lib/auth-context.tsx` - Authentication context provider
- `app/index.tsx` - Login screen
- `app/(tabs)/index.tsx` - Patient list with search
- `app/(tabs)/settings.tsx` - Settings and logout
- `app/patient/new.tsx` - New patient registration form
- `app/patient/[id].tsx` - Patient detail with longitudinal tables
- `app/visit/new.tsx` - New visit entry with HSC AMS, Mallet, Clinical forms
