# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

DreamScope is an AI-powered dream journal application currently in the planning phase. The project aims to help users record, analyze, and gain insights from their dreams using GPT-4 and psychological interpretation frameworks.

## Current Project Status

**Planning Phase** - No code implementation yet. The repository contains:
- `企画書.md` - Project proposal document (v4.0) in Japanese outlining the complete vision

## Planned Architecture

### Core Features
1. **Dream Recording** - Accept single words or full text descriptions
2. **AI Analysis** - Use GPT-4 to interpret dreams based on Jungian and cognitive psychology
3. **Visualization** - Calendar views, tag clouds, trend analysis
4. **Sharing** - Optional anonymous sharing with image card generation

### Technical Stack (Planned)
- **Frontend**: Mobile app (iOS/Android) - technology not yet decided
- **Backend**: AI service using GPT-4
- **Key Components**:
  - Natural language completion for converting keywords to sentences
  - RAG (Retrieval-Augmented Generation) for context-aware analysis
  - Multi-perspective interpretation system
  - Data visualization and export features

## Development Roadmap

According to the proposal:
- Month 1: Prompt design and LLM testing
- Month 2: MVP completion
- Month 3: Beta release (TestFlight, 500 users)
- Month 4: Production release

## Important Notes

- This is NOT a git repository yet - initialize git when starting development
- Technology stack needs to be chosen (React Native, Flutter, or native)
- Follow the user's preference for Python package manager: use `uv` instead of pip/poetry
- The project will need proper package management setup once development begins

## Next Steps for Development

When starting actual development:
1. Initialize git repository
2. Choose and set up mobile development framework
3. Create project structure with appropriate package management
4. Set up development environment for prompt testing with GPT-4
5. Begin implementing the single-word to sentence completion feature as the first milestone