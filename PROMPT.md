# Cursor Master Prompt — "The AI Scientist" (Hack‑Nation Challenge 04)

> Paste the block below into Cursor (model: **Claude Opus 4.7**, Agent mode, with this
> repo open). It is a single, self‑contained instruction that drives the agent from an
> empty Next.js scaffold to a demo‑ready, judge‑grade application. It was written by an
> agentic architect for an agentic builder: every section is directly actionable, every
> artifact has a schema, every module has an acceptance test.
>
> The prompt is designed for **one-shot autonomy**: Cursor should plan, implement,
> self‑verify, and iterate until the acceptance criteria are met without further human
> guidance. Where ambiguity is unavoidable, the prompt specifies a default and moves on.

---

## ▶ Paste-into-Cursor Prompt

````
ROLE
You are a senior full‑stack engineer + applied‑AI architect. You will build an
end‑to‑end application called **instalab.ai** for the Hack‑Nation "AI Scientist"
challenge (Fulcrum Science × MIT Club NorCal × MIT Club Germany).

MISSION
Given a natural-language scientific hypothesis, the app must:
  1. Run a fast **Literature QC** ("plagiarism check for science") and emit one of
     { "not_found", "similar_work_exists", "exact_match_found" } with 1–3 citations.
  2. Generate an **operationally realistic experiment plan** containing: protocol,
     materials with catalog numbers and suppliers, itemised budget, phased timeline
     with dependencies, and a validation strategy.
  3. Offer a **Scientist Review** loop: structured ratings + corrections + annotations
     per section that persist to a feedback store, and visibly influence the *next*
     plan for a similar experiment type (few‑shot, retrieval‑augmented).
  4. Present all of the above in a **polished, demo‑grade UI** that a PI would enjoy
     using for 30 seconds in front of a judge.

QUALITY BAR
"Would a real PI trust this plan enough to order materials and start running it by
Friday?" Every design decision must be tested against that sentence. If a section
would make a scientist roll their eyes, redesign it.

────────────────────────────────────────────────────────────────────────────
NON-NEGOTIABLE TECHNICAL CONSTRAINTS
────────────────────────────────────────────────────────────────────────────
- Stack: **Next.js 14 App Router + TypeScript (strict) + React 18 + Tailwind CSS +
  shadcn/ui + lucide-react + framer-motion + zod + zustand**.
- LLM: **OpenAI** via the official `openai` SDK. Default model `gpt-4o-mini` for
  cheap stages, `gpt-4o` for the plan synthesiser. Wrap every call in a typed
  `llm.json(schema, …)` helper that enforces zod‑validated structured output
  (Responses API with `response_format: { type: "json_schema" }`). Never parse
  freeform JSON manually.
- Literature search: **Semantic Scholar Graph API** (primary, no key required),
  **arXiv** (fallback), and **Tavily** (optional web fallback if `TAVILY_API_KEY`
  is set). Wrap in a single `searchLiterature(query)` façade with graceful
  degradation and a deterministic stub for offline demos.
- All LLM/search calls are **server-only** (Route Handlers or Server Actions). No
  API key may ever reach the browser bundle — enforce with `server-only` import.
- Persistence: **SQLite via better-sqlite3** stored at `./.data/instalab.db`, with a
  thin repository layer. Migrations run on boot. No ORM dependency.
- Node ≥ 20. Package manager: `npm`.
- Use the existing repo layout (`app/` App Router, `app/lib/`). Do **not** reshape
  the directory tree; extend it.
- Must build cleanly with `npm run build`, pass `npm run typecheck`, and `npm run
  lint`. Add `npm test` using `vitest` for the agent + schema tests.

────────────────────────────────────────────────────────────────────────────
DIRECTORY TARGET (extend the existing repo, do not delete files)
────────────────────────────────────────────────────────────────────────────
app/
  layout.tsx                     # global shell, theme, toaster
  page.tsx                       # landing — hypothesis input + sample chips
  plan/[id]/page.tsx             # plan viewer with tabs + review drawer
  history/page.tsx               # past plans + feedback impact indicators
  api/
    plan/route.ts                # POST: create plan (streams progress events)
    plan/[id]/route.ts           # GET: fetch plan by id
    feedback/route.ts            # POST: persist scientist review
    literature/route.ts          # POST: standalone QC endpoint
  lib/
    env.ts                       # zod‑validated env loader
    db/
      client.ts                  # better-sqlite3 singleton + migrations
      repositories.ts            # plans, feedback, examples
    llm/
      openai.ts                  # client factory
      json.ts                    # llm.json(schema, messages, opts)
      tokens.ts                  # cost/latency accounting
    search/
      semanticScholar.ts
      arxiv.ts
      tavily.ts
      index.ts                   # searchLiterature façade + caching
    agents/
      types.ts                   # shared zod schemas
      classifier.ts              # domain + experiment_type tagging
      literatureQc.ts            # novelty signal + refs
      protocol.ts                # step-by-step methodology
      materials.ts               # reagents, suppliers, catalog numbers
      budget.ts                  # line-itemed costs
      timeline.ts                # phased Gantt with dependencies
      validation.ts              # success/failure criteria
      reviewMemory.ts            # few-shot retrieval from feedback store
      orchestrator.ts            # runs the DAG with streaming events
    prompts/
      *.ts                       # versioned prompt templates (const)
    schemas.ts                   # end-to-end Plan schema (source of truth)
  components/
    ui/                          # shadcn primitives (button, card, tabs, …)
    HypothesisForm.tsx
    SampleChips.tsx
    NoveltyBadge.tsx
    LiteraturePanel.tsx
    PlanHeader.tsx
    ProtocolView.tsx
    MaterialsTable.tsx
    BudgetView.tsx
    TimelineGantt.tsx
    ValidationView.tsx
    ReviewDrawer.tsx             # rate / correct / annotate per section
    StreamProgress.tsx           # live agent status timeline
    EmptyState.tsx
    MarkdownSafe.tsx
  globals.css
scripts/
  seed.ts                        # seeds 4 sample plans + stub feedback
tests/
  schemas.test.ts
  agents.classifier.test.ts
  agents.literatureQc.test.ts
  reviewMemory.test.ts

────────────────────────────────────────────────────────────────────────────
CANONICAL DATA CONTRACT  (app/lib/schemas.ts — this is the source of truth)
────────────────────────────────────────────────────────────────────────────
Define, export, and re-use everywhere via zod:

  HypothesisInput { question: string (min 20 chars) }

  Classification {
    domain: "diagnostics" | "gut_health" | "cell_biology" | "climate" | "chemistry"
           | "neuroscience" | "materials" | "other"
    experiment_type: string          # free‑form tag e.g. "cryopreservation_cells"
    model_system: string | null      # e.g. "HeLa cells", "C57BL/6 mice"
    intervention: string
    primary_readout: string
    controls: string[]
    risk_flags: string[]             # biosafety, animal ethics, irb, etc.
  }

  LiteratureHit {
    title: string
    authors: string[]
    year: number | null
    venue: string | null
    url: string
    doi: string | null
    abstract: string | null
    source: "semantic_scholar" | "arxiv" | "tavily" | "stub"
    relevance: number   # 0..1
  }
  LiteratureQC {
    signal: "not_found" | "similar_work_exists" | "exact_match_found"
    rationale: string                # 1–3 sentence plain‑English explanation
    references: LiteratureHit[]      # length 0..3
  }

  ProtocolStep {
    n: number
    title: string
    description: string              # markdown, includes concentrations, times
    duration_minutes: number
    hazards: string[]
    critical_parameters: string[]    # what ruins the experiment if wrong
    source_url: string | null        # grounded in a real protocol where possible
  }

  Material {
    name: string
    role: "reagent" | "consumable" | "equipment" | "service"
    catalog_number: string | null
    supplier: string | null          # Sigma‑Aldrich, Thermo, Addgene, ATCC, IDT, …
    quantity: string                 # "500 mg", "10 × 96‑well plates"
    unit_cost_usd: number | null
    total_cost_usd: number | null
    url: string | null
    notes: string | null
  }

  BudgetLine { category: string, description: string, cost_usd: number }
  Budget {
    currency: "USD"
    lines: BudgetLine[]
    subtotal_usd: number
    overhead_pct: number             # default 15
    total_usd: number
    assumptions: string[]
  }

  TimelinePhase {
    name: string
    start_week: number
    duration_weeks: number
    depends_on: string[]             # phase names
    deliverables: string[]
    staffing: string                 # "1 × postdoc, 0.5 × RA"
  }
  Timeline {
    total_weeks: number
    phases: TimelinePhase[]
    critical_path: string[]
  }

  ValidationStrategy {
    success_criteria: string[]       # quantitative thresholds
    failure_modes: string[]
    statistics: {
      power: number                  # 0..1, default 0.8
      alpha: number                  # default 0.05
      sample_size_justification: string
      planned_tests: string[]        # e.g. "two‑tailed t‑test"
    }
    go_no_go: string                 # decision rule at end
  }

  ExperimentPlan {
    id: string                       # cuid2
    createdAt: string                # ISO
    question: string
    classification: Classification
    literatureQC: LiteratureQC
    summary: string                  # 2–3 sentence executive summary
    protocol: ProtocolStep[]
    materials: Material[]
    budget: Budget
    timeline: Timeline
    validation: ValidationStrategy
    safety: { biosafety_level: string, ethics: string[], ppe: string[] }
    appliedFeedbackIds: string[]     # which prior reviews influenced this plan
    model_versions: Record<string,string>
  }

  ReviewSection =
    "protocol" | "materials" | "budget" | "timeline" | "validation" | "overall"
  Correction {
    section: ReviewSection
    target_id: string | null         # e.g. step n, material name
    rating: 1|2|3|4|5
    critique: string                 # what was wrong
    suggestion: string               # what should be done instead
  }
  Feedback {
    id: string
    planId: string
    experiment_type: string
    domain: string
    reviewer: string                 # freeform name/email
    corrections: Correction[]
    createdAt: string
  }

No agent may emit output that fails these schemas. `llm.json` must retry once with
the validation error appended to the system prompt; on second failure it throws a
typed `LLMSchemaError` which the orchestrator surfaces in the progress stream.

────────────────────────────────────────────────────────────────────────────
AGENT DAG (app/lib/agents/orchestrator.ts)
────────────────────────────────────────────────────────────────────────────
Run stages in this order and stream a Server‑Sent‑Events progress channel with
events shaped as { stage, status: "start"|"ok"|"error", ms, preview? }:

  1. classifier          → Classification
  2. literatureQc        ← depends on classifier + raw question
  3. reviewMemory.fetch  ← retrieves up to 5 prior Feedback entries matching
                           classifier.experiment_type / domain (vectorless: SQL
                           LIKE + lightweight embedding via OpenAI text‑embedding‑
                           3‑small, cosine similarity in Node)
  4. protocol            ← grounded in ≥2 protocol repository references (pass
                           search snippets + reviewMemory notes into the prompt)
  5. materials           ← must output ≥8 concrete items; every reagent line
                           must include supplier OR explicit "generic" + a
                           reason; prefer Sigma‑Aldrich / Thermo / IDT / Addgene
                           / ATCC / Promega / Qiagen
  6. budget              ← derived from materials + staffing + instrumentation;
                           overhead default 15%; currency USD
  7. timeline            ← phased with dependencies; critical_path computed
                           deterministically from depends_on (topological sort,
                           longest path) — do NOT ask the LLM to compute it
  8. validation          ← statistics block must be quantitative; include power
                           analysis justification
  9. assemble + persist  → ExperimentPlan saved via repositories.plans.insert()

Parallelise steps 4–5 where possible. Every stage must have a 30 s timeout with
graceful fallback content (never crash the whole run).

────────────────────────────────────────────────────────────────────────────
LITERATURE QC (app/lib/agents/literatureQc.ts)
────────────────────────────────────────────────────────────────────────────
Signal rules (apply in order, short‑circuit):
  - "exact_match_found"    if best hit relevance ≥ 0.90 AND the hit's title/abstract
                           contains ≥ 3 of the hypothesis's distinctive terms
                           (intervention + model_system + primary_readout).
  - "similar_work_exists"  if any hit relevance ≥ 0.60.
  - "not_found"            otherwise.
Relevance = weighted combo of BM25‑ish keyword overlap on title+abstract and a
cheap LLM re‑rank (gpt‑4o‑mini) returning a 0..1 score. Cache re‑ranks by
(hit.id, question hash) in the DB for 7 days.
Return 1–3 references, deduped by DOI/URL, sorted by relevance desc. Every
reference MUST have a working URL.

────────────────────────────────────────────────────────────────────────────
SCIENTIST REVIEW LOOP (the stretch goal — implement it)
────────────────────────────────────────────────────────────────────────────
- `ReviewDrawer.tsx` opens from any section of the plan viewer and lets the
  scientist: rate 1–5, write a critique, write a suggested correction, and
  optionally mark "apply to future plans of this experiment_type".
- `POST /api/feedback` validates with zod and stores in `feedback` table.
- `reviewMemory.fetch(classification)` retrieves the top K=5 corrections whose
  `(experiment_type, domain)` match, ranked by a cosine similarity between the
  new question's embedding and the stored plan's embedding (store the embedding
  on plan insert). Falls back to exact `experiment_type` match if embeddings
  unavailable.
- In every generation prompt (protocol, materials, budget, timeline, validation)
  inject a "Prior expert corrections to honour" section as bullet points:
      - [MUST] <suggestion>    (critique: <critique>)
  Mark the prompt versions with a "rev" integer so the UI can display
  "this plan incorporated 3 prior expert corrections" with a tooltip listing
  them. Track the applied feedback ids on the ExperimentPlan.

Demo requirement (the judge‑visible moment):
  Generate plan A → leave a correction on one protocol step and one budget line →
  click "Regenerate similar plan" → plan B must textually reflect both corrections
  without the user re‑entering them. Write an E2E test proving this.

────────────────────────────────────────────────────────────────────────────
UI / UX SPEC
────────────────────────────────────────────────────────────────────────────
Visual language: clean scientific instrument aesthetic. Off‑white background,
ink‑black type, a single accent color (`#0E7C66` teal), generous whitespace,
Inter for UI, JetBrains Mono for numbers/catalog codes. No stock gradients, no
glassmorphism. Dark mode supported via `next-themes`.

Landing page (`/`):
  - Minimal hero: "Turn a hypothesis into a runnable experiment plan."
  - Large textarea, char counter, "Generate plan" primary button.
  - 4 sample‑input chips (the four challenge hypotheses) that populate the
    textarea in one click.
  - Below the form: a subtle "How it works" strip showing the 3 stages.

Generation view (`/plan/[id]`):
  - Sticky top bar: question, novelty badge (color‑coded), total cost, total
    weeks, "applied N expert corrections" pill.
  - Tabs: Protocol · Materials · Budget · Timeline · Validation · Safety · Refs.
  - `TimelineGantt` is a real horizontal Gantt rendered in SVG with dependency
    arrows; hovering a bar highlights its dependencies.
  - `MaterialsTable` is sortable/filterable; totals row sticky at bottom.
  - Every section has an inline "Review" button opening `ReviewDrawer`.
  - Live streaming: during generation, render `StreamProgress` with one row per
    agent stage, elapsed ms, and a green check when done.

History page (`/history`):
  - List of plans with question, domain tag, novelty, total cost, weeks, "N
    reviews applied".
  - "Duplicate as similar experiment" button demonstrates feedback propagation.

Accessibility: all interactive elements keyboard‑reachable, ARIA on tabs, color
contrast ≥ 4.5:1, respects `prefers-reduced-motion`.

────────────────────────────────────────────────────────────────────────────
ENV + SAFETY
────────────────────────────────────────────────────────────────────────────
`.env.example` must list:
  OPENAI_API_KEY=
  TAVILY_API_KEY=            # optional
  SEMANTIC_SCHOLAR_API_KEY=  # optional, raises rate limit

If `OPENAI_API_KEY` is missing, the app must still run end‑to‑end using
deterministic stub agents that produce schema‑valid, obviously‑labelled
"DEMO MODE" plans — so judges can use the UI offline. Show a yellow banner when
in demo mode.

Every generated plan renders a persistent footer:
  "Decision-support draft. A qualified scientist must review safety, biosafety,
   IRB/IACUC, regulatory, and procurement details before execution."

────────────────────────────────────────────────────────────────────────────
IMPLEMENTATION PROTOCOL  (follow this loop, do not skip steps)
────────────────────────────────────────────────────────────────────────────
1. Plan via TodoWrite with the top‑level milestones below, mark one in_progress
   at a time, finish each before moving on:
     a. Schemas + env + db + llm.json helper + tests for schemas
     b. Search façade (Semantic Scholar + arXiv + stub) + tests
     c. Classifier + literatureQc agents + tests
     d. Protocol/materials/budget/timeline/validation agents
     e. Orchestrator with SSE streaming + API routes
     f. UI shell, landing, plan viewer tabs, timeline Gantt
     g. Review drawer + feedback persistence + reviewMemory retrieval
     h. Demo‑mode stubs, seed script, history page
     i. Polish: loading skeletons, empty states, a11y, dark mode
     j. Docs: update README with architecture diagram (ASCII) and demo script
2. After each milestone: run `npm run typecheck`, `npm run lint`, `npm test`,
   `npm run build`. Fix all failures before proceeding.
3. For every agent, write at least one unit test that feeds the four sample
   hypotheses from the challenge and asserts the output satisfies its zod schema.
4. Implement the stretch‑goal E2E demo as a Vitest that boots the orchestrator
   in demo mode, submits one of the sample questions, injects a fixed Feedback
   row, regenerates, and asserts the new plan's protocol text contains the
   correction's suggestion substring.
5. Commit logically (one commit per milestone) with Conventional Commit messages.
6. When done, produce a short DEMO.md with the exact 90‑second judge walkthrough:
   paste question → show novelty badge → tour tabs → leave correction →
   regenerate → show the applied‑corrections pill and the changed text.

────────────────────────────────────────────────────────────────────────────
ACCEPTANCE CHECKLIST  (you are not done until every box is true)
────────────────────────────────────────────────────────────────────────────
[ ] `npm run dev` serves at :3000 with zero console errors on a clean machine.
[ ] Pasting any of the four sample hypotheses produces a complete ExperimentPlan
    in < 45 s with the progress stream visible.
[ ] Literature QC always returns a signal and 0–3 references with working URLs.
[ ] Every plan has ≥ 6 protocol steps, ≥ 8 materials with supplier info, a
    budget whose line sum equals the displayed subtotal (±$0.01), and a timeline
    whose critical path is deterministically computed.
[ ] Scientist review round‑trip works; applied corrections pill + tooltip
    appear on the next similar plan, and the regeneration test passes.
[ ] Works fully in demo mode without OPENAI_API_KEY.
[ ] Build, lint, typecheck, and tests all pass.
[ ] UI is keyboard‑navigable, has dark mode, and looks clean on mobile ≥ 375 px.
[ ] README + DEMO.md are updated; repo builds from `npm ci && npm run build`.

Begin now. Plan your todos, then execute. Prefer small, verified steps over
large, unverified ones. Never ask the user a question you can answer by reading
the challenge brief or picking a reasonable default. Ship.
````

---

## Notes for the operator (not part of the pasted prompt)

- The prompt above is intentionally self‑contained so Cursor can run it in a single
  autonomous session. If you want to split work across sessions, feed it milestone
  by milestone (letters **a–j** in the *Implementation Protocol*).
- Cost control: stages 1–3 use `gpt-4o-mini`; only the plan synthesiser steps that
  materially benefit from it should escalate to `gpt-4o`.
- Demo safety: leave `OPENAI_API_KEY` unset on the judging laptop to force demo
  mode if network is flaky — the stubs are schema‑valid and visibly labelled.
- If Semantic Scholar rate‑limits during the demo, the arXiv fallback + cached
  re‑ranks keep Literature QC responsive.
