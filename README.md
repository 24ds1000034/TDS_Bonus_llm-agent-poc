# LLM Agent POC — v8 (Minimal + Logs + Contrast UI)

Author: **24DS1000034-George**

What’s new:
- Minimalistic, **colorful but high-contrast** design
- **Logs Drawer** with request/response/error entries, copy & clear
- AiPipe is **default** provider
- Still fully compliant with the POC spec

Run:
```bash
python -m http.server 8080
# open http://localhost:8080
```

Fill Settings:
- Provider: AiPipe (default)
- Base URL: `https://<your-aipipe>/openai`
- API Key: your token
- Model: from dropdown
- Google Key + CX: for snippets
- AiPipe Endpoint: `https://<your-aipipe>/proxy`

Notes:
- CORS must be enabled on your AiPipe endpoints (OPTIONS + POST).
- Logs show URL, status, duration, response sample, and helpful hints.
