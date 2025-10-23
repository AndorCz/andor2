
# Andor2

Andor2 is a comprehensive web application for playing tabletop role-playing games (TTRPGs) online. It supports multiple game systems and provides a full-featured platform for game masters and players to create, manage, and play RPG campaigns collaboratively.

The platform is primarily targeted at Czech-speaking TTRPG players but supports international use with multiple game systems.

## Features

### Core Functionality
- **Authentication**: Email and Google OAuth login
- **Game Management**: Create and manage RPG campaigns
- **Character Management**: Player characters with detailed profiles
- **Game Threads**: Structured game session posts with filtering and whispered posts
- **Dice Rolling**: Integrated 3D dice system with sound effects
- **Interactive Maps**: Upload and manage campaign maps
- **Codex**: Game information database with sections and pages
- **Discussion Boards**: Meta-gaming chat and general discussion threads
- **General Chat**: Real-time messaging
- **Direct Messages**: User-to-user and character-to-character messaging
- **Solo Games**: AI-powered solo adventures
- **User Works**: Community content including short stories, images, and music

### Supported Game Systems
- Dungeons & Dragons 5th Edition (D&D 5e)
- Vampire: The Masquerade 5th Edition
- Dračí doupě 1.6 (Czech system)
- Cyberpunk 2020
- Call of Cthulhu
- Warhammer
- Shadowrun
- Pathfinder
- GURPS
- Fate
- Savage Worlds
- Dungeon World
- And many more...

### AI Integration
- AI Storyteller Assistant for game masters
- Multiple AI providers: OpenAI, Google Gemini, AIML, Replicate, Moonshot
- Intelligent NPC generation and management

## Tech Stack

### Frontend
- **Astro**: Static site generation and server-side rendering
- **Svelte**: Reactive UI components
- **TipTap**: Rich text editor
- **PixiJS**: Canvas rendering for maps and graphics
- **3D Dice**: WebGL dice rolling simulation

### Backend
- **Astro Server**: API routes and server-side logic
- **Supabase**: PostgreSQL database, authentication, and storage
- **Cloudflare Workers**: Serverless hosting and edge computing

### Development Tools
- **Vite**: Fast build tool and dev server
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Sentry**: Error monitoring and performance tracking

### Third-party Services
- **Database & Auth**: Supabase
- **Hosting**: Cloudflare Pages/Workers
- **Email**: Amazon SES
- **AI Providers**: OpenAI, Google Gemini, AIML, Replicate, Moonshot
- **Push Notifications**: OneSignal
- **CAPTCHA**: Cloudflare Turnstile

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase CLI (for local development)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AndorCz/andor2.git
cd andor2
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env` and configure your API keys and secrets.

4. Start Supabase locally (optional for development):
```bash
npm run db
```

5. Sync database schema:
```bash
npm run sync
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:4321`.

## Available Scripts

| Command                   | Description                                      |
| :------------------------ | :------------------------------------------------ |
| `npm install`             | Install dependencies                              |
| `npm run dev`             | Start development server at `localhost:4321`     |
| `npm run build`           | Build production site to `./dist/`                |
| `npm run preview`         | Preview production build locally                  |
| `npm run db`              | Start local Supabase instance                     |
| `npm run functions`       | Serve Supabase Edge Functions locally             |
| `npm run sync`            | Sync database schema with local Supabase          |
| `npm run astro ...`       | Run Astro CLI commands                            |

## Project Structure

```
src/
├── components/          # Reusable Svelte components
├── layouts/            # Astro page layouts
├── lib/                # Utility libraries and stores
├── pages/              # Astro pages and API routes
├── prompts/            # AI system prompts for different games
├── db/                 # Database schema and policies
└── ...

public/                 # Static assets
supabase/              # Supabase configuration and migrations
```

## Contributing

This project is licensed under GPL v3. See `LICENSE.md` for details.

## Deployment

The application is configured for deployment on Cloudflare Pages with Workers. Use `npm run build` to generate the production build, then deploy the `dist/` directory.

For local Cloudflare development:
```bash
npm run dev-cloudflare
```

