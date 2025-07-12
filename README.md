# Prayer Cards Application

A comprehensive web-based prayer management platform that helps users organize and track their prayer life with intelligent scheduling, user engagement features, and personalized spiritual growth tools.

## Features

### 🙏 Prayer Management
- **Smart Scheduling**: Create prayer cards with daily, weekly, or monthly frequencies
- **Category Organization**: Organize prayers by categories (Family, Friends, Personal, Work, etc.)
- **Progress Tracking**: Track completed prayers and view your spiritual growth progress
- **Prayer Requests**: Add and manage specific prayer requests for each prayer card

### 📱 User Experience
- **Guest Mode**: Try the app without creating an account
- **Profile Customization**: Upload custom profile images
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Instant UI feedback and synchronization

### 🔔 Smart Features
- **Prayer Reminders**: Browser notifications at scheduled times
- **Scripture Integration**: Search and attach Bible verses to prayer cards
- **Level System**: Gamified progress tracking with advancement levels
- **Data Transfer**: Seamlessly transfer prayer data from guest to authenticated accounts

### 🔐 Authentication
- **Replit OAuth**: Secure authentication through Replit's OpenID Connect
- **Session Management**: Persistent login sessions with secure storage
- **Profile Sync**: Automatic profile information synchronization

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** + shadcn/ui components
- **TanStack Query** for state management
- **Wouter** for routing
- **React Hook Form** with Zod validation

### Backend
- **Express.js** API server
- **PostgreSQL** database with Drizzle ORM
- **Passport.js** for authentication
- **Sharp** for image processing
- **WebSockets** for real-time features

### Development
- **Vite** for fast development and building
- **TypeScript** for type safety
- **Hot Module Replacement** for instant feedback

## Getting Started

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- Replit account (for authentication)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/prayer-cards-app.git
cd prayer-cards-app
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your database and authentication details
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5000`

### Environment Variables

Required environment variables:

```env
DATABASE_URL=postgresql://username:password@host:port/database
SESSION_SECRET=your-session-secret-key
REPLIT_DOMAINS=your-replit-domain.com
ISSUER_URL=https://replit.com/oidc
REPL_ID=your-repl-id
```

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/           # Utility libraries
│   │   └── pages/         # Page components
├── server/                # Express backend
│   ├── db.ts             # Database connection
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data access layer
│   └── replitAuth.ts     # Authentication setup
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema definitions
└── uploads/             # User uploaded files
```

## Key Features Walkthrough

### Prayer Card Management
Users can create prayer cards with:
- Custom names and descriptions
- Frequency settings (daily, weekly, monthly)
- Category assignment with color coding
- Scripture verse attachments
- Individual prayer requests

### Progress Tracking
The app includes a gamified progress system:
- Prayer completion tracking
- Level advancement (Heart → Star → Flame → Lightning → Shield → Award → Gem → Crown)
- Progress visualization with dynamic icons
- Statistics dashboard

### Guest Mode
New users can try the app immediately:
- Full functionality without account creation
- Local storage for temporary data
- Seamless data transfer when signing up
- "Save to Account" prompts for important actions

## Database Schema

The app uses a PostgreSQL database with the following main tables:
- `users` - User profiles and authentication data
- `categories` - Prayer organization categories
- `prayer_cards` - Main prayer entities
- `prayer_requests` - Individual prayer items
- `prayer_logs` - Prayer completion tracking
- `user_prayer_stats` - Progress and statistics
- `sessions` - Authentication session storage

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For questions or support, please open an issue in the GitHub repository.