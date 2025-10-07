# Deployment Guide

## Environment Variables Required

Create a `.env.local` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI (for AI Insights and Receipt Scanning)
GEMINI_API_KEY=your_gemini_api_key

# OCR.Space API (for receipt scanning)
OCR_SPACE_API_KEY=your_ocr_space_api_key
```

## Getting Your API Keys

### 1. Supabase Setup
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Go to Settings > API
3. Copy your Project URL and anon/public key
4. Run the SQL migration in `supabase/migrations/20250712090418_bright_firefly.sql` in your Supabase SQL editor
5. Add the additional RLS policies and functions we created for groups:
   - Run the `create_group_with_member` function
   - Run the `join_group_by_id` function

### 2. Google Gemini API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your environment variables

### 3. OCR.Space API (Optional - for receipt scanning)
1. Go to [OCR.Space](https://ocr.space/ocrapi)
2. Sign up for a free account
3. Get your API key from the dashboard

## Deployment Platforms

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your GitHub repo to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder (if using static export) or connect to Git
3. Add environment variables in Netlify dashboard

### Railway/Render
1. Connect your GitHub repo
2. Add environment variables
3. Deploy

## Pre-deployment Checklist

- [ ] All environment variables are set
- [ ] Supabase database is set up with all tables and policies
- [ ] API keys are valid and have proper permissions
- [ ] Test all major features:
  - [ ] User registration/login
  - [ ] Adding expenses
  - [ ] Budget creation
  - [ ] AI insights
  - [ ] Receipt scanning
  - [ ] What-If simulator
  - [ ] Groups functionality
  - [ ] Theme toggle (light/dark/mood)
- [ ] No console errors in browser
- [ ] All pages load correctly
- [ ] Navigation works on all pages

## Build Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Troubleshooting

### Common Issues:
1. **RLS Policy Errors**: Make sure all Supabase RLS policies are properly set up
2. **API Key Errors**: Verify all API keys are correct and have proper permissions
3. **Build Errors**: Check for TypeScript errors and missing dependencies
4. **Theme Issues**: Ensure `next-themes` is properly configured

### Database Issues:
- Make sure all tables exist in Supabase
- Verify RLS policies are enabled and correct
- Check that the `create_group_with_member` function exists

## Features Included

✅ **Core Features:**
- User authentication (Supabase Auth)
- Expense tracking and management
- Budget planning and monitoring
- AI-powered spending insights
- Receipt scanning with OCR
- What-If scenario simulator
- Shared budget groups
- Dark/Light theme with mood-based themes

✅ **UI/UX:**
- Responsive design
- Loading indicators
- Error handling
- Form validation
- Toast notifications
- Modern shadcn/ui components

✅ **Technical:**
- TypeScript for type safety
- Next.js 13.5 App Router
- TailwindCSS for styling
- Supabase for backend
- Row Level Security (RLS)
- India timezone support
