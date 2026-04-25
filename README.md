# instalab.ai

An AI Scientist hackathon prototype: turn a natural-language scientific hypothesis into literature QC plus an operational experiment plan.

## Architecture

- **Next.js app router UI** for the three required stages: input, literature QC, and full experiment plan.
- **Server-side multi-agent orchestrator** under `app/lib/agents`:
  - query classifier
  - literature QC scout
  - protocol grounding agent
  - materials and budget agent
  - timeline agent
  - validation agent
  - scientist review memory
- **Tavily search integration** is server-only via `TAVILY_API_KEY`; the key is never exposed to the browser bundle.
- **Structured review loop** stores scientist corrections by experiment type and injects prior feedback into similar future plans.

## Local setup

```bash
npm install
cp .env.example .env.local
# Add TAVILY_API_KEY to .env.local
npm run dev
```

The app includes a deterministic fallback mode when Tavily is not configured, so the UI remains demoable without network credentials.

## Safety note

Generated plans are decision-support drafts. A qualified scientist must review safety, ethics, biosafety, regulatory requirements, and procurement details before execution.
# instalab.ai