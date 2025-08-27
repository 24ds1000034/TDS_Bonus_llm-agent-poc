# LLM Agent POC — v2 (Always-on Settings)

A minimal, hackable browser app that lets an LLM call tools (OpenAI-style) and loop until done:
- Google Custom Search (snippets)
- AiPipe proxy flow
- Sandboxed JavaScript execution

## What's new in v2
- Settings are **always visible** in a condensed grid — fewer clicks.
- Provider presets: OpenAI, Perplexity, Gemini (OpenAI-compat), OpenRouter, AiPipe.
- Persistence via `localStorage` for all fields.
- Clean, modern UI polish.

## Quick Start
1. Open `index.html` over HTTP (e.g., `python -m http.server 8080`) to avoid CORS issues.
2. Fill settings at the top (Base URL, API key, etc.).
3. Pick a provider, type a prompt, and send.
