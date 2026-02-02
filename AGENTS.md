# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

DevEvent is a Next.js 16 application using the App Router that aggregates developer events (hackathons, meetups, conferences). It uses React 19, TypeScript, and Tailwind CSS v4 with custom utilities and animations.

## Development Commands

```bash
# Development server (runs on http://localhost:3000)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Linting
npm run lint
```

## Architecture

### Framework & Rendering
- **Next.js 16 App Router**: Uses the `app/` directory structure with React Server Components by default
- Client components marked with `"use client"` directive (e.g., PostHogProvider, LightRays)
- Single route layout with global Navbar and animated background (LightRays)

### Path Aliases
Uses `@/` alias for imports (maps to root directory):
```typescript
import EventCard from "@/components/EventCard";
import { cn } from "@/lib/utils";
```

### Data Layer
Currently static event data stored in `lib/constants.ts` as `EventItem[]` array. The branch `database-models` suggests migration to database models is planned.

### Key Components Architecture

**LightRays (`components/LightRays.tsx`)**:
- Custom WebGL-based animated background using OGL (OpenGL) library
- Implements complex shader rendering with configurable ray effects
- Uses Intersection Observer for performance (only renders when visible)
- Follows React hooks pattern for WebGL lifecycle management
- All shader code is inline GLSL (vertex and fragment shaders)

**PostHogProvider (`app/providers/PostHogProvider.tsx`)**:
- Analytics wrapper requiring `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` environment variables
- Client-side only provider wrapping main content

### Styling System

**Tailwind CSS v4** with custom configuration:
- Custom CSS variables for colors (primary: `#59deca`, background: `#030708`)
- Custom utilities: `@utility flex-center`, `@utility text-gradient`, `@utility glass`, `@utility card-shadow`
- Uses `tw-animate-css` for animations with prefix
- Component-level scoped styles using IDs (`#event-card`, `#explore-btn`, `#home`)
- Two custom Google fonts: Schibsted Grotesk (headings) and Martian Mono (monospace)

**shadcn/ui Integration** (`components.json`):
- Configured for New York style variant
- Base color: stone, uses CSS variables
- Lucide icons library
- Integrates react-bits registry

### Type Safety
- Strict TypeScript configuration (`strict: true`)
- Event data typed via `EventItem` type in `lib/constants.ts`
- Note: EventCard component has type mismatch - `time` prop typed as `number` but passed as `string` from constants

## Key Patterns

1. **Server vs Client Components**: Default to server components; only use `"use client"` when needed (state, effects, browser APIs, event handlers)

2. **Utility Function**: Use `cn()` from `lib/utils.ts` for conditional className merging (combines clsx + tailwind-merge)

3. **Custom Tailwind Utilities**: Prefer using predefined utilities (`flex-center`, `text-gradient`, `glass`) over inline styles

4. **Component Styling**: Components use scoped CSS in `globals.css` with ID selectors rather than separate CSS modules

5. **Environment Variables**: PostHog analytics requires env vars in `.env.local` - these are client-side vars (prefixed with `NEXT_PUBLIC_`)
