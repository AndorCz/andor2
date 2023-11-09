
# Andor2 ALPHA

Andor is a web app for playing role-playing games online.
The target audience are players of TTRPG games in the Czech Republic, using czech language.
The initial version will be an experimental MVP, with limited functionality. No need for premature optimization or security concerns.

## List of features
  - Authentication with Google
  - List of games
  - Game thread
    - AI storyteller
    - Player characters, assigned to users

## Pages

  ### Index: list of games
    Components: Table with names - links to game pages

  ### Game: game thread
    Components: Player and character management, text input, posts, paging

  ### Login: login with Google
    Components: Google login button

  Folder structure is based on [Astro's recommended project structure](https://docs.astro.build/en/core-concepts/project-structure).

## Tech stack

  ### Tools
  - [Git](https://git-scm.com) for version control
  - [Bun](https://bun.sh) for development server, bundling and database

  ### Back-end
  - [Bun](https://bun.sh) for deployment server and database
  - [Astro](https://docs.astro.build)
  - [SQLite3](https://www.sqlite.org/index.html) for database

  ### Front-end
  - [Svelte](https://svelte.dev) for UI components, within Astro
  - [Svelte Testing Library](https://testing-library.com/docs/svelte-testing-library/intro) for unit tests

  ### Third-party
  Feature of the AI storyteller is using [OpenAI API](https://openai.com/blog/openai-api/), model GPT-4-turbo.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command               | Action                                           |
| :---------------------| :----------------------------------------------- |
| `bun install`         | Installs dependencies                            |
| `bun dev`             | Starts local dev server at `localhost:4321`      |
| `bun build`           | Build your production site to `./dist/`          |
| `bun preview`         | Preview your build locally, before deploying     |
| `bun astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `bun astro -- --help` | Get help using the Astro CLI                     |

# Astro

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