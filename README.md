# Phoneme Play Builder

Phoneme Play Builder is a frontend activity-building tool for Speech Pathology teachers and students. It allows a teacher to configure, preview, and download phoneme-based Wordle and Word Search activities as standalone HTML files that run in a normal web browser.

This project was created for **Assessment 1: Frontend Design and Usability**. Assessment 1 focuses on interface design, responsive layout, usability, accessibility, and reusable React components. It does not use a database or dynamic word-list management; those features are planned for later assessments.

## Author

- **Name:** Louis Callander
- **Student number:** 22308135

## Features

### Phoneme Wordle

- Uses one phoneme-based target word at a time
- Provides Foundation, Developing, and Extending difficulty levels
- Adjusts attempts, available sound keys, and hint behaviour
- Displays phoneme-to-English hover hints and gameplay feedback
- Reveals the English word when the activity is completed
- Downloads as a standalone playable HTML file

### Phoneme Word Search

- Uses a selectable list of five phoneme words
- Supports 7×7, 8×8, and 9×9 grids
- Generates a new layout when the grid size changes or the activity is reset
- Places words horizontally, vertically, diagonally, forwards, and backwards
- Allows students to select a word by choosing its first and last sounds
- Downloads the configured puzzle as a standalone playable HTML file

### Interface

- Home, About, Wordle, Word Search, and Settings pages
- Responsive desktop and mobile layouts
- Compact navigation menu for About and Settings
- Cookie-based light/dark themes and layout preferences
- Live playable previews before downloading

## Technology

- [Next.js](https://nextjs.org/) 16
- [React](https://react.dev/) 19
- TypeScript
- CSS

The project was created from `npx create-next-app .` as required by the assessment brief.

## Running the project

Requirements:

- Node.js 20 or newer
- npm

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser.

Run the production and code-quality checks:

```bash
npm run lint
npm run build
npm run start
```

## Project structure

```text
src/
├── app/
│   ├── about/          Project and author information
│   ├── api/download/   Standalone HTML download endpoint
│   ├── settings/       Theme and layout preferences
│   ├── word-search/    Word Search page
│   ├── wordle/         Wordle page
│   ├── globals.css     Responsive and theme styling
│   ├── layout.tsx      Root application layout
│   └── page.tsx        Home page
├── components/
│   ├── DownloadButton.tsx
│   ├── SiteShell.tsx
│   ├── WordSearchBuilder.tsx
│   └── WordleBuilder.tsx
└── lib/
    └── wordSearch.ts   Puzzle generation and shared phoneme hints
```

The shared site shell provides consistent navigation, structure, and footer content. Each activity builder owns its settings and preview state. The download component converts the selected settings into a self-contained HTML document. Shared Word Search utilities keep puzzle generation and phoneme hints consistent.

## Usability and accessibility

The interface is designed for teachers preparing classroom activities. Settings and the live preview appear together so teachers can immediately see the effect of their choices.

Accessibility considerations include:

- Semantic headings, navigation, forms, fieldsets, and buttons
- A skip link for keyboard and screen-reader users
- Visible keyboard focus indicators
- Keyboard-operable game controls
- Form labels and accessible names for phoneme cells
- Live status feedback during gameplay
- Text feedback alongside colour-based feedback
- High-contrast light and dark themes
- Responsive layouts for narrow screens
- Reduced-motion support
- Hover labels explaining equivalence, such as `/θ/ — TH as in thin`

## Design decisions and trade-offs

The visual design uses a restrained classroom-oriented layout with clear typography, generous spacing, and a limited colour palette. Builder controls and playable previews sit beside each other on large screens and stack on mobile devices.

Assessment 1 intentionally uses a small fixed collection of phoneme words. This keeps the work focused on frontend design while leaving clear extension points for database-driven word management in later assessments. Generated activities use inline CSS and JavaScript so each download remains a single portable HTML file. This makes the generator component larger, but allows teachers to use activities without hosting, installation, or an internet connection.

## Current limitations

- Phoneme words are defined in the frontend source code
- There is no database, authentication, or saved activity library
- Word Search supports a fixed set of five target words
- Downloaded activities do not store or report student results
- Modern browser support is assumed

These limitations match the frontend-only scope of Assessment 1.

## Using a generated activity

1. Open the Wordle or Word Search builder.
2. Choose the activity settings.
3. Test the activity in the live preview.
4. Select **Generate & download HTML**.
5. Open the downloaded `.html` file in a modern browser.

The generated file contains its own structure, styling, and gameplay code. It does not require the Next.js application to remain running.

## Submission notes

Exclude generated dependency and build directories such as `node_modules` and `.next` from the submitted ZIP. The assessment submission also includes the GitHub repository link and a 6–8 minute demonstration video.
