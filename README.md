# Family Calendar Assistant

A web application that provides a conversational interface for managing family calendars, to-dos, and chores. The application leverages the Anthropic API and Model Context Protocol to enable natural language interactions with Google Calendar.

## Features

- Conversational interface for calendar management
- Google Calendar integration
- Family to-do and chore management
- User authentication and family account management
- Responsive design for mobile and desktop

## Tech Stack

- **Frontend**: React with TypeScript, Tailwind CSS
- **Backend**: Supabase (Auth, Database, Edge Functions)
- **APIs**: Google Calendar API, Anthropic API
- **Hosting**: Vercel

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- Google Cloud account (for Google OAuth and Calendar API)
- Anthropic API key

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/family-calendar-assistant.git
   cd family-calendar-assistant
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```
   cp .env.example .env
   ```

4. Fill in the environment variables in `.env` with your credentials

5. Start the development server:
   ```
   npm run dev
   ```

## Supabase Setup

### Database Schema

Set up the following tables in Supabase:

1. `families`: Stores family information
2. `family_members`: Connects users to families with roles
3. `todos`: Stores to-do items
4. `chores`: Stores chore assignments and tracking info
5. `chat_history`: Stores conversation history
6. `invitations`: Tracks pending invitations
7. `user_profiles`: Stores user profile information

Import the database schema from `supabase/schema.sql`.

### Edge Functions Setup

1. Install the Supabase CLI:
   ```
   npm install -g supabase
   ```

2. Link your Supabase project:
   ```
   supabase login
   supabase link --project-ref your-project-id
   ```

3. Deploy the Edge Functions:
   ```
   supabase functions deploy anthropic
   supabase functions deploy google-calendar
   ```

4. Set up environment variables for the Edge Functions:
   ```
   # For Anthropic API
   supabase secrets set ANTHROPIC_API_KEY=your-anthropic-api-key
   
   # For Google Calendar API
   supabase secrets set GOOGLE_CLIENT_ID=your-google-client-id
   supabase secrets set GOOGLE_CLIENT_SECRET=your-google-client-secret
   supabase secrets set REDIRECT_URI=your-oauth-redirect-uri
   ```

### Authentication Setup

1. Enable Google OAuth in Supabase Authentication settings
2. Configure Google OAuth with the required scopes:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

## Google Calendar API Setup

1. Create a project in Google Cloud Console
2. Enable Google Calendar API
3. Configure OAuth consent screen
4. Create OAuth 2.0 Client ID
5. Add authorized JavaScript origins and redirect URIs for your local and production environments

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Configure environment variables in Vercel project settings
4. Deploy the project

### Environment Variables

Make sure to set these environment variables in your production environment:

- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth client ID
- `VITE_GOOGLE_API_KEY`: Your Google API key
- `VITE_APP_URL`: Your application's URL

## Project Structure

- `src/components/`: React components
  - `auth/`: Authentication components
  - `calendar/`: Calendar view components
  - `chat/`: Conversational interface components
  - `todo/`: To-do management components
  - `chore/`: Chore management components
  - `layout/`: Layout components
- `src/contexts/`: React context providers
- `src/lib/`: Utility functions and API clients
- `src/types/`: TypeScript type definitions
- `supabase/functions/`: Supabase Edge Functions

## Security Considerations

- API keys are stored securely as environment variables
- Anthropic API calls are made through Supabase Edge Functions to keep API keys secure
- Google Calendar API uses OAuth for secure authentication
- User data is protected by Supabase's built-in Row Level Security

## License

This project is licensed under the MIT License - see the LICENSE file for details.