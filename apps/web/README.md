# easy-OCR Web

Next.js debugging console for the easy-OCR API.

## Development

```bash
cd apps/web
npm install
npm run dev
```

The dev server runs on `http://127.0.0.1:3000` and expects the API at `http://127.0.0.1:8000/api`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_BASE` | `http://127.0.0.1:8000/api` | Base URL of the easy-OCR API. Must be set at build time for production. |

## Scripts

```bash
npm run typecheck      # TypeScript check only
npm run build          # Production build
npm run check          # typecheck + build
npm start              # Start production server
node scripts/e2e-smoke.js      # End-to-end smoke test (requires API + web server)
node scripts/screenshot.js     # Generate visual screenshots
```

## Console Features

- Upload an image to create an OCR job.
- Preview the structured `ProblemDocument`, source assets, and model calls.
- View timeline, quality report, and diagnostics.
- Create Markdown/HTML exports through the backend API.
