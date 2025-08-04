
# Andor2

Andor is a web app for playing role-playing games online.
The target audience are players of TTRPG games, primarily in czech language.
The initial version will be an experimental MVP, with limited functionality.

## List of features
  - Authentication (Email and Google)
  - List of games
  - Game
    - AI storyteller's assistant
    - Player characters, assigned to users
    - Game thread
      - Filtering
      - Whispered posts
    - Dice
    - Maps
    - Codex of game information
    - Discussion: Meta gaming chat
  - Works (User submitted short stories, images and music)
  - Boards (General discussion threads on various topics)
  - General chat
  - User DMs
  - Character DMs

## Pages

  ### Index: List of games
    Components: Table with names - links to game pages

  ### Game: Game thread
    Components: Player and character management, text input, posts, paging

  ### Login: Authenticate with Google
    Components: Google login button

  Folder structure is based on [Astro's recommended project structure](https://docs.astro.build/en/core-concepts/project-structure).

## Tech stack

  ### Tools
  - [Git](https://git-scm.com) for version control

  ### Back-end
  - [Astro](https://docs.astro.build)
  - [Supabase](https://supabase.com) - database, auth
  - [OpenAI API](https://openai.com/blog/openai-api/), model GPT-4o
  - [Gemini API](https://ai.google.dev/gemini-api), model Gemini 1.5

  ### Front-end
  - [Svelte](https://svelte.dev) for UI components, within Astro
  - [Svelte Testing Library](https://testing-library.com/docs/svelte-testing-library/intro) for unit tests

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :-------------------------| :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

# Astro

The framework does server-side rendering. In case a client-side hydration is needed, use a directive such as this:
```
<UserPanel client:load />
```

## 🚀 Project Structure

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.
