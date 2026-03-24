# {{projectName}} - Frontend Development Guide

Frontend-only SpecVerse project for React SPA development.

## Project Type

**Frontend Only** - No backend generation
- React + TypeScript + Vite
- React Query for data fetching
- Connects to external API
- Standalone deployment structure

## Quick Commands

```bash
# Generate frontend code
npm run realize:all

# Setup and run
cd generated/code
npm install
npm run dev

# Open browser
open http://localhost:5173
```

## File Structure

```
{{projectName}}/
├── specs/main.specly              # UI specification
├── manifests/implementation.yaml  # Frontend-only manifest
└── generated/code/                # Standalone React app
    ├── src/                       # React components
    ├── index.html                 # HTML entry point
    ├── vite.config.ts             # Vite configuration
    └── package.json               # Frontend dependencies
```

## Development Workflow

1. **Edit UI Spec**: Modify `specs/main.specly` (views and models)
2. **Regenerate**: Run `npm run realize:all`
3. **Configure API**: Set `VITE_API_BASE_URL` in `.env`
4. **Test**: Use dev server or connect to real API

## Key Features

- **Standalone Structure**: All code in root (no backend/ subdirectory)
- **External API**: Connects via environment variables
- **React Router**: Auto-generated routes from views
- **React Query**: Data fetching with caching
- **TypeScript**: Full type safety

## API Configuration

Set in `generated/code/.env`:

```env
VITE_API_BASE_URL=https://your-api.com
VITE_API_PREFIX=/api
```

## Deployment

This generates a standalone React SPA that can deploy to:
- Vercel, Netlify (static hosting)
- AWS S3 + CloudFront
- GitHub Pages
- Any static file server

---

For comprehensive SpecVerse guidance, see the main [SpecVerse CLAUDE.md](https://github.com/SpecVerse/specverse-lang/blob/main/CLAUDE.md)
