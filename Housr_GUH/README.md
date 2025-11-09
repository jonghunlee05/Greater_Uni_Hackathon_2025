# Housr GUH — Furniture Marketplace Dashboard

Housr GUH is a responsive React + Vite + TypeScript application that showcases a premium furniture marketplace. It features a modern dashboard layout, dynamic navigation, and modular UI building blocks powered by shadcn/ui and Tailwind CSS.

## Features
- Multi-section landing page with hero, product highlights, testimonials, and CTA blocks.
- Responsive navigation with desktop and mobile experiences via sidebar + command palette.
- Reusable shadcn/ui components (e.g. cards, carousel, badges, accordions) styled with Tailwind CSS.
- Modular component structure for easy extension and future data integration.

## Tech Stack
- React 18 with TypeScript
- Vite build tooling
- Tailwind CSS utility styling
- shadcn/ui component library

## Getting Started
```sh
# Install dependencies
npm install

# Start the development server
npm run dev

# Lint the project
npm run lint

# Build for production
npm run build
```

The app runs on Vite’s default port (`http://localhost:5173`). Update the scripts or ports in `package.json` if needed.

## Project Structure
```
Housr_GUH/
├── public/              # Static assets served as-is
├── src/
│   ├── assets/          # Images used across the UI
│   ├── components/      # Reusable UI primitives and navigation helpers
│   ├── hooks/           # Custom React hooks (e.g. responsive helpers)
│   ├── pages/           # Routed views (`Index.tsx`, `NotFound.tsx`)
│   ├── lib/             # Utility helpers
│   └── main.tsx         # App entry point
├── App.tsx              # Root layout composition
├── App.css / index.css  # Global styles
└── tailwind.config.ts   # Tailwind configuration
```

## Customization Tips
- Adjust theme colors, typography, and spacing in `tailwind.config.ts`.
- Update navigation items in `src/components/NavLink.tsx` to reflect real routes.
- Replace placeholder assets in `src/assets/` with production imagery.
- Integrate data sources or APIs by wiring up fetch logic in `src/pages/Index.tsx` and converting UI components to consume live state.

## Contributing
1. Create a feature branch.
2. Commit with clear messages describing the change.
3. Open a pull request for review.

For questions or improvements, reach out to the GUH 2025 team. Happy building!
