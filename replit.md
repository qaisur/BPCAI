# BPC Records - Brachial Plexus Clinic

## Overview
Mobile medical records application for a pediatric brachial plexus palsy clinic (Brachial Plexus Clinic - BPC). Used by 6 surgeons on Android and iOS devices.

**Clinic Name:** Brachial Plexus Clinic (BPC)
**Tagline:** "Hope in Every Touch"
**Logo:** Located at `assets/images/clinic-logo.png`

## Recent Changes
- 2026-02-06: Initial application build with full database schema, API routes, and mobile UI
- 2026-02-06: Admin-only account creation system (no public registration)
- 2026-02-06: Auto-generated patient IDs in BPC-000001 format
- 2026-02-06: Added DropdownPicker and DatePicker reusable components
- 2026-02-06: All score inputs converted to dropdowns (HSC AMS 0-7, Mallet I-V, Clinical angles)
- 2026-02-06: "Intervention" renamed to "Intervention/Note" throughout
- 2026-02-06: Mallet "Additional Fields" section removed from visit form
- 2026-02-06: Mallet aggregate score corrected to /25 (5 categories x 5 max)
- 2026-02-06: Associated Features Note field added to patient form
- 2026-02-06: "Hand Prolapse" added to Presentation options, "Other" added to gender options
- 2026-02-06: DatePicker maxDate prop added - DOB and Visit Date cannot be future dates
- 2026-02-06: "Hand to Midline" added as 6th Mallet Score item, aggregate updated to /30
- 2026-02-06: Admin account set to Dr. Qaisur Rabbi (username: qaisurR), contact info on login page
- 2026-02-06: Login page shows admin contact: Phone +8801534919618, Email qaisur@gmail.com
- 2026-02-06: Admin account protected (non-deletable) in Manage Surgeons, non-admin accounts have delete button
- 2026-02-06: Patient PDF download feature - A4 PDF with all patient info + visit data (HSC AMS, Mallet, Clinical)

## User Preferences
- Data displayed in longitudinal table format with dates as columns
- HSC AMS Score: 0-7 scale dropdown for each movement (Shoulder, Elbow, Forearm, Wrist, Finger, Thumb)
- Mallet Score: Grade I-V dropdown for 6 movements (incl. Hand to Midline), aggregate out of 30
- Clinical Examination: Shoulder Subluxation & Putti Sign (Yes/No dropdown), Passive/Active ER (-90 to +90 degrees, 5-degree increments), Elbow FFD/Trumpeting/ABD/AIRD/IR (0-180 degrees, 5-degree increments)
- Patient search by name and ID number
- Track which surgeon viewed/updated records with timestamps
- Admin-only account creation (no public registration)
- Auto-generated Patient IDs in format BPC-000001, BPC-000002, etc.
- Dropdown menus for standardized data entry: Gestational Age (16-60 weeks), No. of Delivery (1-20), Birth Weight (1.0-7.0 kg in 0.1 increments)
- Calendar/scroll date pickers instead of manual text entry
- "Intervention" field renamed to "Intervention/Note"
- Associated Features section includes additional free-text note field

## Project Architecture
- **Frontend:** Expo React Native (SDK 54) with file-based routing (expo-router)
- **Backend:** Express.js with TypeScript on port 5000
- **Database:** PostgreSQL with Drizzle ORM
- **Auth:** Session-based authentication with express-session + connect-pg-simple
- **Font:** Inter (Google Fonts)
- **Colors:** Primary red (#C41E3A), Secondary blue (#1B3A6B)

### Key Files
- `shared/schema.ts` - Database schema (Drizzle ORM)
- `server/routes.ts` - API endpoints (including admin routes)
- `server/storage.ts` - Database storage layer (including getNextPatientId)
- `server/db.ts` - Database connection
- `lib/auth-context.tsx` - Authentication context provider (includes isAdmin)
- `components/DropdownPicker.tsx` - Reusable dropdown picker component
- `components/DatePicker.tsx` - Reusable date picker with day/month/year scroll
- `app/index.tsx` - Login screen (no register button)
- `app/(tabs)/index.tsx` - Patient list with search
- `app/(tabs)/settings.tsx` - Settings, logout, and admin panel for managing surgeon accounts
- `app/patient/new.tsx` - New patient form with auto-generated ID, dropdowns, date picker
- `app/patient/[id].tsx` - Patient detail with longitudinal tables
- `app/visit/new.tsx` - New visit entry with dropdown-based HSC AMS, Mallet, Clinical forms
