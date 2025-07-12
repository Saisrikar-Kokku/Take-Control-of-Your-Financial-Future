# Expense Tracker & Money Management App

A comprehensive full-stack expense tracking application built with Next.js, Supabase, and AI-powered insights using Google Gemini.

## Features

### 🔐 Authentication
- User registration and login with Supabase Auth
- Protected routes with automatic redirects
- Secure session management

### 💰 Expense Management
- Add, view, and categorize expenses
- Real-time expense tracking
- Search and filter functionality
- Category-based organization

### 📊 Budget Planning
- Create monthly, weekly, and yearly budgets
- Visual progress tracking with progress bars
- Budget vs. actual spending comparisons
- Overspending alerts

### 🧠 AI-Powered Insights
- Spending pattern analysis using Google Gemini AI
- Personalized money-saving recommendations
- AI-generated weekend activity planning
- Smart financial insights

### 📱 Modern UI/UX
- Responsive design for all devices
- Clean, professional interface
- Smooth animations and transitions
- Intuitive navigation

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI primitives
- **Backend**: Supabase (Database, Auth, Real-time)
- **AI Integration**: Google Gemini API
- **Icons**: Lucide React
- **Deployment**: Ready for Netlify/Vercel

## Getting Started

### Prerequisites

1. Node.js 18+ installed
2. A Supabase account and project
3. Google Gemini API key (optional, for AI features)

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up Supabase**:
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Create a `.env.local` file:
     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     GEMINI_API_KEY=your_gemini_api_key_here
     ```

3. **Set up the database**:
   - Navigate to your Supabase project dashboard
   - Go to the SQL Editor
   - Run the migration file: `supabase/migrations/create_expense_tracker_schema.sql`
   - This will create the necessary tables with Row Level Security enabled

4. **Configure Supabase Auth**:
   - In your Supabase dashboard, go to Authentication > Settings
   - Add your site URL (e.g., `http://localhost:3000`) to the Site URL field
   - Disable email confirmation for development (optional)

5. **Start the development server**:
   ```bash
   npm run dev
   ```

## Database Schema

### Tables

1. **expenses**
   - `id`: UUID primary key
   - `user_id`: References auth.users
   - `amount`: Expense amount
   - `category`: Expense category
   - `description`: Optional description
   - `date`: Expense date
   - `created_at`: Timestamp

2. **categories**
   - `id`: UUID primary key
   - `user_id`: References auth.users
   - `name`: Category name
   - `created_at`: Timestamp

3. **budgets**
   - `id`: UUID primary key
   - `user_id`: References auth.users
   - `category_id`: Optional category reference
   - `amount`: Budget amount
   - `period`: Budget period (weekly/monthly/yearly)
   - `created_at`: Timestamp

All tables have Row Level Security enabled with policies for authenticated users.

## AI Integration

### Gemini API Setup

1. Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env.local` file as `GEMINI_API_KEY`
3. The app includes two AI features:
   - **Spending Analysis**: Analyzes your expenses and provides insights
   - **Weekend Planner**: Suggests activities based on your budget

### API Routes

- `POST /api/gemini/analyze-spending`: Analyzes expense patterns
- `POST /api/gemini/plan-weekend`: Generates weekend plans

## Project Structure

```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Dashboard page
│   ├── expenses/          # Expense management pages
│   ├── budget/            # Budget planning page
│   ├── ai-insights/       # AI insights page
│   ├── login/             # Authentication pages
│   └── signup/
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── AuthGuard.tsx     # Route protection
│   └── Navigation.tsx    # Main navigation
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
├── types/                # TypeScript type definitions
└── supabase/             # Database migrations
```

## Key Features Explained

### Authentication Flow
- Users can sign up and log in using email/password
- AuthGuard component protects private routes
- Automatic redirect to login for unauthenticated users
- Session persistence across page reloads

### Expense Tracking
- Intuitive form for adding expenses
- Real-time updates using Supabase
- Category-based filtering and searching
- Visual expense history with pagination

### Budget Management
- Create budgets for different periods
- Visual progress tracking with progress bars
- Automatic calculation of remaining budget
- Overspending alerts and notifications

### AI Insights
- Spending pattern analysis using Gemini AI
- Personalized recommendations for saving money
- Weekend activity planning based on budget
- Mock responses for demo purposes when API key is not configured

## Environment Variables

Create a `.env.local` file with:

```env
# Required for core functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional for AI features
GEMINI_API_KEY=your_gemini_api_key_here
```

## Deployment

### Netlify Deployment

1. Push your code to a Git repository
2. Connect your repository to Netlify
3. Add environment variables in Netlify dashboard
4. Deploy with build command: `npm run build`

### Vercel Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in your project directory
3. Add environment variables in Vercel dashboard
4. Deploy automatically on git push

## Security Features

- Row Level Security (RLS) on all database tables
- User isolation - users can only access their own data
- Environment variable protection for API keys
- Secure authentication with Supabase Auth
- Type-safe API routes with TypeScript

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
1. Check the existing issues on GitHub
2. Create a new issue with detailed description
3. Include environment details and error messages

---

Built with ❤️ using Next.js, Supabase, and Google Gemini AI