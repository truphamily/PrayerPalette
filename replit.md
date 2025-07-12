# Prayer Cards Application

## Overview

Prayer Cards is a modern web application designed to help users organize and manage their prayer life. Built with React and Express, it provides a clean interface for creating prayer cards with customizable frequencies, categories, and integrated scripture verses. The application uses Replit's authentication system and is optimized for the Replit development environment.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit's OpenID Connect integration with Passport.js
- **Session Management**: Express sessions with PostgreSQL storage
- **API Design**: RESTful endpoints with JSON responses

### Build System
- **Bundler**: Vite for frontend development and building
- **TypeScript**: Full TypeScript support across client and server
- **Development**: Hot module replacement and error overlay in development

## Key Components

### Authentication System
- **Provider**: Replit OpenID Connect integration
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple
- **User Management**: Automatic user creation and profile synchronization
- **Security**: HTTP-only cookies with secure session handling

### Database Schema
- **Users**: Profile information synced from Replit authentication
- **Categories**: Customizable prayer categories with colors and icons
- **Prayer Cards**: Main prayer entities with frequency settings and scripture integration
- **Prayer Requests**: Individual prayer items associated with cards
- **Sessions**: Required table for Replit Auth session management

### Prayer Management Features
- **Frequency-based Organization**: Daily, weekly, and monthly prayer cards
- **Category System**: Color-coded categories for prayer organization
- **Scripture Integration**: Built-in scripture search and verse attachment
- **Request Tracking**: Add and archive individual prayer requests per card

### UI/UX Design
- **Design System**: shadcn/ui with "new-york" style configuration
- **Responsive**: Mobile-first design with Tailwind CSS
- **Color Scheme**: Custom prayer-themed color palette with CSS variables
- **Accessibility**: Radix UI ensures ARIA compliance and keyboard navigation

## Data Flow

### Authentication Flow
1. Unauthenticated users see landing page
2. Login redirects to Replit OAuth
3. Successful authentication creates/updates user record
4. Session established with PostgreSQL storage
5. Client receives user data and navigates to main application

### Prayer Card Management
1. User creates prayer card with category, frequency, and optional scripture
2. Backend validates data using Zod schemas
3. Card stored in database with user association
4. Frontend updates via React Query cache invalidation
5. Cards displayed filtered by frequency tabs

### Scripture Integration
1. User searches for verses in prayer card creation modal
2. Frontend queries scripture API (placeholder for future integration)
3. Selected verses attached to prayer card
4. Scripture displayed alongside prayer content

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connection
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@hookform/resolvers**: Form validation integration
- **wouter**: Lightweight routing
- **express-session**: Session management

### UI Libraries
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **lucide-react**: Icon library

### Development Tools
- **tsx**: TypeScript execution for development
- **esbuild**: Server bundling for production
- **@replit/vite-plugin-***: Replit-specific development enhancements

## Deployment Strategy

### Development Environment
- **Server**: Hot reloading with tsx and Vite middleware
- **Database**: Neon PostgreSQL with connection pooling
- **Environment**: Optimized for Replit with specific plugins and error handling

### Production Build
- **Frontend**: Vite builds to `dist/public` directory
- **Backend**: esbuild bundles server to `dist/index.js`
- **Static Serving**: Express serves built frontend files
- **Database Migration**: Drizzle handles schema changes

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **SESSION_SECRET**: Session encryption key (required)
- **REPLIT_DOMAINS**: Allowed domains for OIDC (required)
- **ISSUER_URL**: OpenID Connect issuer URL (optional, defaults to Replit)

## User Preferences

Preferred communication style: Simple, everyday language.
UI/UX preferences: Prefers cleaner interfaces with subtle authentication prompts rather than prominent sign-in buttons.

## Changelog

Changelog:
- July 11, 2025. Added custom profile image upload functionality - users can now upload their own profile pictures through a dedicated profile settings modal accessible via the header avatar. Implemented secure file handling with 5MB limits, automatic image resizing to 200x200px, WebP optimization for performance, and proper validation for image formats. Profile images are stored in the uploads/profiles directory and integrated with the existing user authentication system.
- July 11, 2025. Successfully eliminated prayer button loading delays through synchronous prayer status management - implemented instant UI updates with TanStack Query caching (5-minute staleTime), created usePrayerStatusSync hook for immediate button responses, and optimized useAuth hook to prevent excessive /api/auth/user calls. Prayer buttons now load instantly when switching between Daily/Weekly/Monthly tabs.
- July 09, 2025. Updated prayer level system to advance every 7 prayers instead of 10 for faster progression and improved user engagement - modified frontend progress calculations, backend level computation in routes and storage, and adjusted level-up notifications accordingly. Enhanced dynamic prayer level icons to be filled with specified colors instead of outlined, and reorganized icon progression ranges for better milestone distribution (Heart→Star→Flame→Lightning→Shield→Award→Gem→Crown).
- July 09, 2025. Improved prayer request interface with enhanced spacing and clickable overflow text - added proper margin classes to prayer request detail modal header, made "+X more requests" text clickable to open requests modal with hover effects and underline styling for better user experience
- July 09, 2025. Successfully implemented comprehensive prayer request editing functionality - added edit button to prayer request detail modal with save/cancel options, created PUT /api/prayer-requests/:id endpoint for authenticated users, implemented updatePrayerRequest method in both database storage and local storage for guest mode, and added unified useUpdatePrayerRequest hook for both user types with real-time UI updates
- July 09, 2025. Enhanced guest user experience with better sign-in options - added permanent "Sign In" button in header for all guest users, fixed prayer level 1 Heart icon to display in proper red color by adding missing prayer-red CSS variable and utility class, and successfully implemented dynamic level icon system that changes based on user's prayer level with full-height icons
- July 09, 2025. Fixed critical application startup failure - resolved syntax error in scripture-search-modal.tsx caused by malformed JSON structure, removed duplicate "Forgiveness & Repentance" and "Healing & Health" categories, and added proper DialogDescription components to improve accessibility compliance
- July 09, 2025. Successfully implemented complete delete functionality for prayer requests - added DELETE API endpoint for authenticated users, delete method in local storage for guest mode, unified delete hook for both user types, and red-themed delete button in prayer request detail modal with proper security verification
- July 09, 2025. Fixed critical JSON parsing error in prayer card creation - added missing `/api/prayer-requests` endpoint that was causing server to return HTML instead of JSON, corrected prayer request schema validation by removing unnecessary userId field, and added proper content-type headers to ensure all API responses return valid JSON
- July 08, 2025. Fixed prayer card loading performance issue - eliminated delayed "Mark as Prayed" button loading by implementing proper batch query timing that waits for prayer cards to load before querying prayer status, ensuring buttons and cards load simultaneously
- July 08, 2025. Successfully implemented complete prayer tracking system with "Mark as Prayed" buttons - users can now track prayer completion, cards grey out when prayed, progress bar fills with red color showing advancement toward next level, and stats update in real-time. Made prayer level bar more compact and simplified by removing Trophy icon and progress text, added current level number to header. Added undo functionality with prominent red-themed undo button, moved prayer buttons outside header to prevent text crowding. Implemented smart sorting to move completed prayers to bottom of list so active prayers stay on top for better organization
- July 09, 2025. Simplified monthly frequency to single day selection only - removed complex multiple days selection interface in favor of clean single day input field to resolve "unexpected token" parsing errors and improve user experience
- July 07, 2025. Created comprehensive landing page showcasing all Prayer Palette features including authentication system, prayer card creation, smart scheduling, request management, scripture search, responsive design, and community forum for authenticated users
- July 07, 2025. Enhanced timezone support with auto-detection and preset dropdown selection - timezone now defaults to user's local timezone with helpful indicators
- July 07, 2025. Successfully completed data transfer functionality - prayer cards and requests now transfer perfectly from guest mode to authenticated accounts with proper category mapping
- July 07, 2025. Fixed category display consistency between guest and authenticated modes - removed icon duplication while maintaining visual consistency
- July 07, 2025. Fixed prayer request transfer endpoint from `/api/prayer-requests` to `/api/prayer-cards/{cardId}/requests` - all CRUD operations now work correctly
- July 07, 2025. Improved user interface by removing prominent sign-in button from header, keeping only contextual "Save to Account" button for cleaner guest experience
- July 07, 2025. Fixed React Hook order errors and authentication infinite loops - application now loads properly with stable authentication state
- July 06, 2025. Implemented data transfer from guest mode to authenticated accounts with proper category mapping - prayer cards now transfer with correct categories preserved by name matching
- July 06, 2025. Fixed prayer card deletion in guest mode by updating edit modal to use guest-compatible hooks instead of direct API calls - delete functionality now works properly without authorization errors
- July 06, 2025. Fixed prayer card creation errors by correcting API call parameter format in guest data hooks - all CRUD operations now work properly in both guest and authenticated modes
- July 06, 2025. Updated category name from "Non Christians" to "Non Believer" in both guest and authenticated modes - updated default categories and database records
- July 06, 2025. Fixed category display in prayer cards - resolved ID mismatch issue where categories had different IDs than prayer cards referenced, now categories show properly with color-coded backgrounds
- July 06, 2025. Fixed React duplicate key warnings and category consistency - guest and authenticated modes now show identical categories (Family, Friends, Personal, Work, Non Christians, Small Group, World Issues, Leadership) with improved ID generation to prevent conflicts
- July 06, 2025. Fixed database performance issues and SQL syntax errors - restored stable page loading with fast response times
- July 06, 2025. Successfully implemented guest mode - users can try the app without creating an account, with local storage and "Save to Account" prompts
- July 06, 2025. Fixed guest mode categories to match authenticated mode exactly (Family, Friends, Personal, Work, Non Christians, Small Group, World Issues, Leadership)
- July 06, 2025. Fixed prayer card frequency filtering - cards now appear only in their designated frequency tabs instead of appearing everywhere
- July 06, 2025. Fixed category loading issues in guest mode - eliminated 401 API errors by properly waiting for authentication state determination
- July 06, 2025. Successfully implemented "Random Day" buttons for Create and Edit Prayer Card modals - weekly prayers get random weekdays, monthly prayers get random days 1-28
- July 06, 2025. Optimized page loading performance - reduced API calls from 3 to 1 for daily prayers
- July 05, 2025. Fixed critical loading issue - authentication flow was stuck in infinite loading state
- July 05, 2025. Added comprehensive prayer reminder system with browser notifications and time scheduling
- July 05, 2025. Implemented clickable time selection interface for easier reminder setup
- July 05, 2025. Added test notification feature and automatic permission handling
- July 05, 2025. Added formatted date display under "Today's Prayer" header showing day of week, month, and day
- July 05, 2025. Improved scripture search modal UI with simplified verse layout and better spacing
- July 05, 2025. Enhanced spacing between scripture section labels and buttons in prayer modals
- July 04, 2025. Added textbox option for manual scripture input in both Create and Edit Prayer Card modals
- July 04, 2025. Expanded scripture search modal with 40+ authentic Bible prayer verses organized by categories (Prayer & Seeking God, Guidance & Wisdom, Strength & Comfort, Protection & Safety, Forgiveness & Repentance, Family & Relationships, Provision & Needs, Thanksgiving & Praise, Hope & Future, Healing & Health)
- July 04, 2025. Updated database schema to support multiple scripture verses per prayer card with arrays for scriptures and scriptureReferences
- July 04, 2025. Added comprehensive three-dot dropdown menu for prayer cards with edit, view requests, and add request functionality
- July 04, 2025. Implemented full prayer card editing modal with name, category, frequency, scripture, and delete options
- July 04, 2025. Created prayer requests management modal showing active and archived requests
- July 04, 2025. Fixed database connection issues with improved WebSocket configuration and retry logic
- July 04, 2025. Added robust error handling and connection testing for startup stability
- July 04, 2025. Added "Work" category with purple briefcase icon and fixed color conflicts
- July 04, 2025. Changed "Repentance" category to "Personal" while preserving category icons
- July 04, 2025. Added day-of-month selection for monthly prayers with smart Daily tab integration
- July 04, 2025. Enhanced Daily Prayers tab to include weekly prayers for current day of week
- July 04, 2025. Updated color scheme to #e81c32 red theme throughout application
- July 04, 2025. Added FontAwesome icons library for proper icon display
- July 03, 2025. Initial setup