# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DreamScope is a dream journaling web application with AI-powered analysis. Currently implemented as a client-server architecture with plans for PWA features.

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (no build process)
- **Backend**: Node.js + Express.js
- **AI Integration**: Google Gemini API (server-side)
- **Storage**: Browser LocalStorage only
- **Package Manager**: npm (no uv/yarn)

### Key Files
- `index.html` - Single-page application with all views
- `app.js` - Main application logic, state management, event handling
- `styles.css` - Dark mode design with CSS variables
- `server.js` - Express server with `/api/analyze-dream` endpoint
- `/js/api-service.js` - API service module (note: contains legacy OpenAI code)

## Development Commands

### Local Development

```bash
# Install dependencies
npm install

# Run with AI features (requires Gemini API key)
export GEMINI_API_KEY="your-api-key"
npm start         # Production mode (port 3000)
npm run dev       # Development mode with nodemon

# Frontend only (no AI)
python -m http.server 8000
# or
npx http-server -p 8000
```

### Testing
- No test framework currently implemented
- Test manually in browser
- Use DevTools > Application > Storage to inspect LocalStorage

## Key Implementation Details

### Data Structure
Dreams stored in LocalStorage (`dreamscope_dreams`):
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
- Server endpoint: `POST /api/analyze-dream`
- Request body: `{ content: "dream text" }`
- Response: `{ analysis: "AI analysis text" }`
- Gemini API key from environment variable
- Client falls back to mock analysis if server unavailable

### State Management
- Global `app` object in `app.js`
- LocalStorage keys:
  - `dreamscope_dreams` - Dream entries array
  - `dreamscope_settings` - User preferences

### Adding Features
1. **UI Changes**: Edit `index.html` and `styles.css`
2. **Logic**: Add to `app.js` or create modules in `/js/`
3. **API Changes**: Update `server.js` and corresponding client code

## Important Notes

1. **No PWA Features Yet**: Service worker and manifest.json mentioned in docs but not implemented
2. **API Mismatch**: `api-service.js` has OpenAI code but server uses Gemini
3. **No Build Process**: Edit files directly, refresh browser
4. **Privacy-First**: All data stored locally, no user accounts
5. **Storage Limits**: LocalStorage ~5-10MB limit

## Common Tasks

### Debug LocalStorage
```javascript
// Browser console
JSON.parse(localStorage.getItem('dreamscope_dreams'))
localStorage.getItem('dreamscope_settings')
```

### Test AI Analysis
```bash
# With server running
curl -X POST http://localhost:3000/api/analyze-dream \
  -H "Content-Type: application/json" \
  -d '{"content": "I had a dream about flying"}'
```

### Monitor Storage Usage
The app includes storage quota monitoring - check console for warnings when approaching limits.