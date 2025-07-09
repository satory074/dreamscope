# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DreamScope is a Progressive Web Application (PWA) for dream journaling with AI-powered analysis. It's a fully functional, offline-first web app that runs entirely in the browser with no backend dependencies.

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (no framework)
- **Data Visualization**: D3.js v7 (loaded from CDN)
- **AI Integration**: Gemini API (server-side, no client API key needed)
- **Storage**: Browser LocalStorage only
- **PWA**: Service Worker for offline functionality

### Key Files
- `index.html` - Single page with all views (input, history, analysis, settings)
- `app.js` - Main application logic and state management
- `styles.css` - Complete styling with dark mode design
- `service-worker.js` - Offline caching strategy
- `/js/` - Modular JavaScript features (word analysis, offline handling, etc.)

## Development Commands

Since this is a vanilla JS project with no build process:

### Running Locally

#### Frontend Only (No AI)
```bash
# Using Python's built-in server
python -m http.server 8000

# Or using Node.js http-server (if installed)
npx http-server -p 8000
```

#### With AI Server
```bash
# Install dependencies
npm install

# Set API key
export GEMINI_API_KEY="your-api-key"

# Start server (includes static file serving)
npm start
```

### Testing Service Worker and PWA Features
- Must serve over HTTPS or localhost
- Use Chrome DevTools > Application tab to inspect:
  - Service Worker status
  - Cache storage
  - LocalStorage data

### Development Workflow
1. Edit files directly (no build step)
2. Refresh browser to see changes
3. Clear cache if Service Worker changes: DevTools > Application > Storage > Clear site data

## Key Implementation Details

### State Management
- Global `app` object contains all state
- LocalStorage key: `dreamscope_dreams` stores dream entries
- No state management library

### Adding New Features
1. For new UI components: Add to `index.html`, style in `styles.css`
2. For new functionality: Add to `app.js` or create new module in `/js/`
3. Update Service Worker cache version when adding new files

### Data Structure
Dreams are stored as:
```javascript
{
  id: Date.now(),
  date: new Date().toISOString(),
  content: "dream description",
  keywords: ["keyword1", "keyword2"],
  aiAnalysis: "AI-generated analysis"
}
```

### API Integration
- AI analysis handled by server endpoint at `/api/analyze-dream`
- No API keys stored in client-side code
- Server manages Gemini API authentication
- Fallback to offline mode if server unavailable

## Important Considerations

1. **No Package Manager**: This project intentionally uses no npm/yarn/uv. Dependencies are loaded from CDN or included directly.

2. **Privacy-First**: All data stored locally. No backend, no user accounts, no cloud sync.

3. **Offline-First**: Service Worker caches all assets. App works fully offline except for AI analysis.

4. **Browser Compatibility**: Modern browsers only (ES6+, CSS Grid, Service Workers required).

5. **Storage Limits**: LocalStorage has ~5-10MB limit. Monitor storage usage for heavy users.

## Common Tasks

### Update Service Worker Cache
1. Increment `CACHE_VERSION` in `service-worker.js`
2. Update `urlsToCache` array if adding new files
3. Test by clearing browser cache and reloading

### Add New Visualization
1. Add container in `index.html` analysis tab
2. Create D3.js visualization in `app.js` `updateAnalytics()` function
3. Style in `styles.css`

### Debug LocalStorage Issues
```javascript
// In browser console
localStorage.getItem('dreamscope_dreams')
JSON.parse(localStorage.getItem('dreamscope_dreams'))
```

### Test PWA Installation
1. Serve over HTTPS or localhost
2. Check manifest.json is valid
3. Ensure Service Worker is registered
4. Look for install prompt in browser address bar