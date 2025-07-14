# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DreamScope is a dream journaling web application that records dreams and analyzes deep psychology using AI. Privacy-first design with all data stored in browser LocalStorage.

## Architecture

### Technology Stack
- **Frontend**: Vanilla JavaScript, HTML5, CSS3 (no build process)
- **Backend**: Node.js + Express.js
- **AI Integration**: Google Gemini API (server-side)
- **Storage**: Browser LocalStorage only
- **Package Manager**: npm (no uv/yarn)

### Key Files
- `index.html` - Single-page application with all views (Flutter-ready structure)
- `app.js` - Main application logic, state management, event handling
- `styles.css` - Dark mode design with CSS variables
- `color-palettes.css` - 8 color theme definitions
- `server.js` - Express server with Gemini API integration
- `/js/utils.js` - Utility functions

### Flutter Conversion Files
- `flutter-mock.js` - Flutter Widget hierarchy and state management patterns
- `flutter-layout.css` - Flutter layout system (Row, Column, Stack) in CSS
- `flutter-components.css` - Material Design 3 components
- `flutter-animations.css` - Flutter animations in CSS
- `flutter-animations.js` - Complex animations (Hero, AnimatedContainer)
- `FLUTTER_CONVERSION_GUIDE.md` - Complete guide for converting to Flutter

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
  symbols: ["symbol1", "symbol2"],  // Extracted symbols
  aiAnalysis: {                      // AI analysis results
    symbols: [
      {
        symbol: "symbol name",
        meaning: "psychological interpretation"
      }
    ],
    overall: "overall dream analysis"
  }
}
```

### API Integration
- **Dream Analysis**: `POST /api/analyze-dream`
  - Request: `{ content: "dream text" }`
  - Response: `{ analysis: "AI analysis text" }`
- **Symbol Extraction**: `POST /api/extract-symbols`
  - Request: `{ content: "dream text" }`
  - Response: `{ symbols: ["symbol1", "symbol2"] }`
- **Symbol Analysis**: `POST /api/analyze-symbols`
  - Request: `{ content: "dream text", symbols: ["symbol1", "symbol2"] }`
  - Response: `{ symbols: [{symbol: "name", meaning: "interpretation"}], overall: "analysis" }`
- Gemini API key from environment variable
- All responses in easy-to-understand Japanese

### State Management
- Global `app` object in `app.js`
- LocalStorage keys:
  - `dreamscope_dreams` - Dream entries array
  - `dreamscope_settings` - User preferences (includes theme selection)
  - Storage quota monitoring with visual indicators

### Adding Features
1. **UI Changes**: Edit `index.html` and `styles.css`
2. **Color Themes**: Add new themes to `color-palettes.css`
3. **Logic**: Add to `app.js` or create modules in `/js/`
4. **API Changes**: Update `server.js` and corresponding client code

## Important Notes

1. **No PWA Features Yet**: Service worker and manifest.json mentioned in docs but not implemented
2. **No Build Process**: Edit files directly, refresh browser
3. **Privacy-First**: All data stored locally, no user accounts
4. **Storage Limits**: LocalStorage ~5-10MB limit with monitoring
5. **Archive Directory Removed**: Legacy OpenAI integration files have been archived and removed

## Common Tasks

### Debug LocalStorage
```javascript
// Browser console
JSON.parse(localStorage.getItem('dreamscope_dreams'))
localStorage.getItem('dreamscope_settings')
```

### Test AI Analysis
```bash
# Test dream analysis
curl -X POST http://localhost:3000/api/analyze-dream \
  -H "Content-Type: application/json" \
  -d '{"content": "空を飛ぶ夢を見ました"}'

# Test symbol extraction
curl -X POST http://localhost:3000/api/extract-symbols \
  -H "Content-Type: application/json" \
  -d '{"content": "空を飛ぶ夢を見ました"}'

# Test symbol analysis
curl -X POST http://localhost:3000/api/analyze-symbols \
  -H "Content-Type: application/json" \
  -d '{"content": "空を飛ぶ夢を見ました", "symbols": ["空", "飛ぶ"]}'
```

### Monitor Storage Usage
The app includes visual storage quota monitoring:
- Progress bar shows current usage
- Warnings appear when approaching limits
- Check console for detailed storage information

## Recent Updates

- **Flutter Conversion Support**: Added comprehensive Flutter conversion infrastructure
  - Widget mapping with `data-flutter-widget` attributes
  - Material Design 3 components faithfully recreated
  - State management patterns (Provider/Riverpod) simulated
  - Complete conversion guide with code examples
- **Color Themes**: Added 8 color themes (Default, Midnight, Ocean, Forest, Sunset, Lavender, Rose, Monochrome)
- **AI Analysis Improvements**: Enhanced Japanese output with easier-to-understand explanations
- **Symbol Analysis**: Advanced dream symbol extraction and interpretation
- **UI Enhancements**: Bento grid layout for AI analysis results
- **Storage Monitoring**: Visual indicators for LocalStorage usage

## Flutter Conversion

The project is prepared for Flutter conversion with:
- HTML structure that maps directly to Flutter Widget tree
- CSS classes that correspond to Flutter layout widgets
- JavaScript patterns that mirror Flutter state management
- Comprehensive documentation in `FLUTTER_CONVERSION_GUIDE.md`

To start Flutter conversion:
1. Run `flutter create dreamscope_app`
2. Follow the guide in `FLUTTER_CONVERSION_GUIDE.md`
3. Use the widget mapping comments in `index.html`