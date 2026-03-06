# PSC BRO - Daily Quiz Competitions

Master PSC Exams with daily quiz challenges, real-time leaderboards, and competitive learning. Join thousands of aspirants preparing for Kerala PSC exams.

## Tech Stack

This project is built with:

- **Vite** - Fast build tool and dev server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (Database, Auth, Storage)

## Prerequisites

- Node.js 16+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- Supabase account and project

## Getting Started

### 1. Clone the repository

```sh
git clone <YOUR_GIT_URL>
cd pscbro
```

### 2. Install dependencies

```sh
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with your Supabase credentials:

```env
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_APP_ID="your-app-id"
```

### 4. Start the development server

```sh
npm run dev
```

The application will be available at `http://localhost:8080`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run build:dev` - Build in development mode
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## Project Structure

```
pscbro/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page components
│   ├── lib/            # Utility functions and configurations
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── supabase/           # Supabase migrations and config
└── index.html          # HTML entry point
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add your environment variables in Vercel project settings
4. Deploy!

### Netlify

1. Push your code to GitHub
2. Import your repository in [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add your environment variables in Netlify site settings
6. Deploy!

## Supabase Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the migrations in the `supabase/` folder
3. Update your `.env` file with the project credentials
4. Configure Row Level Security (RLS) policies as needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is private and proprietary.
