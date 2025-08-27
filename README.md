# LLM Agent POC — Browser-Based Multi-Tool Reasoning

A minimal, hackable **single-file** browser app that lets an LLM use **OpenAI-style tool calls** to:
- Search the web via **Google Custom Search**
- Call an **AiPipe proxy** flow
- Execute **JavaScript** safely in a sandboxed Worker

No build step. Open `index.html` and go.

---

## Features

- OpenAI-style Chat Completions + tool calling (`tools`, `tool_choice: "auto"`)
- Provider presets: **OpenAI**, **Perplexity**, **Gemini (OpenAI-compat)**, **OpenRouter**, **AiPipe**, **Custom**
- Tooling:
  - `google_search(query, num?)` → title/link/snippet via Google CSE
  - `aipipe_run(flow, payload, endpoint?)` → posts to your AiPipe proxy
  - `run_js(code, timeout_ms?)` → sandboxed Worker, returns `logs` + `result`
- Bootstrap UI, inline tool JSON cards, **Bootstrap alerts** for errors
- **Max tool loops** guard to avoid infinite cycles
- **Clear** button to reset the conversation

---

## Quick Start

1. Open `index.html` in a modern browser.
2. Click **Settings** and fill in:
   - **Base URL**: e.g. `https://api.openai.com`
   - **API Key**: your provider key
   - (Optional) **Google Search API Key** + **Google CSE CX**
   - (Optional) **AiPipe Endpoint**
3. Choose a provider preset in the navbar. The base URL + model will auto-fill.
4. Type: `Interview me to create a blog post about IBM`.

> To trigger tools, ask the agent to *search*, *run_js*, or *aipipe_run*. The LLM decides when to call tools.

---

## Provider Notes

- **OpenAI**: `https://api.openai.com`, example model `gpt-4o-mini`.
- **Perplexity**: `https://api.perplexity.ai`, example model `llama-3.1-sonar-small-128k-online`.
- **Gemini (OpenAI compat)**: `https://generativelanguage.googleapis.com/openai/` with a Google API key; choose e.g. `gemini-1.5-pro`.
- **OpenRouter**: `https://openrouter.ai/api`, set your OpenRouter key and model.
- **AiPipe**: if your proxy exposes an OpenAI-style `/v1/chat/completions`, you can point the **Base URL** to it and chat. Separately, the `aipipe_run` tool also lets flows be invoked directly via POST.

---

## Security Considerations

- `run_js` executes code **in a Web Worker** without DOM access. It returns `logs` + `result` and times out by default.
- Keys are typed into the UI and used only in client-side requests. In production, proxy requests server-side.

---

## License

MIT
