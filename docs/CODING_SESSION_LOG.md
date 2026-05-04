# AI Scientist coding session log

This document captures the user prompts from this session, the product requirements (challenge brief), what was implemented, verification steps, and representative agent/API outputs. **Secrets are redacted** (Tavily key appears only as `TAVILY_API_KEY=***REDACTED***`).

---

## Part 1: Original challenge / build prompt (user)

The user provided the full **Hack-Nation Challenge 04 — The AI Scientist** brief, including:

- **Goal:** Natural-language scientific question → literature QC → full operational experiment plan.
- **Literature QC:** Novelty signal (`not found` | `similar work exists` | `exact match found`) and 1–3 references.
- **Experiment plan:** Protocol (grounded in real sources), materials/supply chain (catalog numbers, suppliers), budget, timeline, validation.
- **Stretch:** Scientist review loop with structured feedback and reuse.
- **Sample hypotheses:** Diagnostics, Gut health, Cell biology, Climate biotech.
- **Resources:** protocols.io, Bio-protocol, Nature Protocols, JoVE, OpenWetWare, supplier sites, MIQE, etc.
- **Tavily:** User supplied a Tavily API key in chat; requirement was **never expose it in the public repo** — store server-side only.
- **Architecture:** Multi-agent, efficient and holistic for any hypothesis.

---

## Part 2: User follow-up prompts (chronological)

1. **Test the application** by posting a hypothesis.
2. **Build the UI/UX** to enable testing; modern and intuitive; same repo.
3. **Merge conflicts with `main`:** classify, fix simple conflicts, report complicated ones; fetch `main` first.
4. **Show the UI/UX** (how to open it).
5. **Could not open** localhost — needed a public URL.
6. **Test with one hypothesis** (API-level).
7. **Where is the generated protocol?**
8. **Missing details / not protocols.io style** — user wanted fuller report.
9. **Retest with one hypothesis** — full report in final UI/UX.
10. **Add the TAVILY_API_KEY** (user wanted it configured).
11. **Where to add it / how at repo root** — explained `.env.local`.
12. **Debug the UI** with one hypothesis.
13. **Buggy UI screenshot** — messy layout, “Waiting for hypothesis” while text present.
14. **Another trial** with a different hypothesis.
15. **Link to look at it** — Serveo tunnel URL.
16. **Detailed prompt** for what they were trying to create (full spec).
17. **This request:** Whole markdown file for the session with prompt and agent outputs.

---

## Part 3: What the implementation agents produced (summary)

### Repository / stack

- **Next.js** (App Router) + **TypeScript**
- **API routes:** `POST /api/plan`, `POST /api/review`
- **Server-only Tavily** via `app/lib/agents/tavily.ts` and `TAVILY_API_KEY` in `.env.local` (gitignored)
- **Multi-agent modules** under `app/lib/agents/` (query parsing, literature QC, protocol, materials/budget, timeline, validation, review memory, orchestrator)
- **UI:** `app/page.tsx`, `app/globals.css`

### Security

- `.env.local` is **not committed**; `.gitignore` includes `.env` and `.env*.local` and `.data`
- No Tavily key in source; `.env.example` uses a placeholder only

### Notable fixes during the session

- **Domain classification:** Scored hints so “assay” in gut text does not mis-route to diagnostics.
- **Merge conflicts with `main`:** Resolved as simple add/add; kept branch versions (UI + classifier + `.data` ignore).
- **Protocol depth:** Expanded `ProtocolStep` and protocol agent to protocols.io-style fields (inputs, equipment, actions, QC, safety, notes, sources).
- **UI class mismatch:** JSX classes (`testerGrid`, `sampleCards`, `primaryButton`, etc.) aligned with CSS so layout was not broken pill UI.
- **Tavily:** When key missing, fallback mode; when key present, live references (e.g. PMC) and novelty signals update.

---

## Part 4: Representative “agent” outputs (API / UI verification)

### 4.1 API — Climate hypothesis (before detailed protocol expansion, example shape)

**Request (conceptual):**

```json
{
  "question": "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of -400mV vs SHE will fix CO2 into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%."
}
```

**Representative response fields (session snapshot):**

```json
{
  "domain": "climate",
  "experimentType": "bioelectrochemical carbon fixation study",
  "noveltySignal": "not found",
  "protocolSteps": [
    "Protocol lock and risk review",
    "Materials receipt and qualification",
    "Baseline setup and controls",
    "Intervention execution",
    "Primary endpoint measurement",
    "Statistical analysis and go/no-go call"
  ],
  "materials": 5,
  "budgetUsd": 19424,
  "timelinePhases": 6,
  "validationMetrics": [
    "Primary endpoint",
    "Protocol fidelity",
    "Mechanistic support"
  ]
}
```

*(Exact numbers can vary by Tavily hits and catalog logic.)*

### 4.2 API — Gut hypothesis with Tavily enabled (session snapshot)

After `TAVILY_API_KEY` was set in `.env.local` (value **not** reproduced here):

```json
{
  "domain": "gut",
  "noveltySignal": "exact match found",
  "referenceCount": 3,
  "references": [
    {
      "title": "Effect of Probiotic Supplementation on Intestinal Permeability in Overweight and Obesity: A Systematic Review of Randomized Controlled Trials and Animal Studies",
      "source": "pmc.ncbi.nlm.nih.gov",
      "relevance": 68
    },
    {
      "title": "Lactobacillus rhamnosus GG Stimulates Dietary Tryptophan-Dependent Production of Barrier-Protecting Methylnicotinamide",
      "source": "pmc.ncbi.nlm.nih.gov",
      "relevance": 66
    },
    {
      "title": "Lactobacillus rhamnosus GG Treatment Potentiates Intestinal Hypoxia-Inducible Factor, Promotes Intestinal Integrity and Ameliorates Alcohol-Induced Liver Injury - PMC",
      "source": "pmc.ncbi.nlm.nih.gov",
      "relevance": 65
    }
  ]
}
```

### 4.3 UI browser trial — Gut health (after Tavily + UI fixes)

**Observed UI summary (automated browser check):**

```json
{
  "generatedHeading": "Gut experiment plan",
  "noveltySignal": "exact match found",
  "references": [
    "pmc.ncbi.nlm.nih.gov … Intestinal Permeability … Relevance score: 68",
    "pmc.ncbi.nlm.nih.gov … Methylnicotinamide … Relevance score: 66",
    "pmc.ncbi.nlm.nih.gov … Intestinal Integrity … Relevance score: 65"
  ],
  "metrics": [
    "Novelty signal exact match found",
    "Estimated budget $13,045",
    "Materials 5",
    "Confidence 78%"
  ],
  "protocolCards": 6,
  "materialRows": 5,
  "timelineCards": 5,
  "validationCards": 3,
  "hasFullReportFields": true
}
```

### 4.4 UI browser trial — Cell biology (trehalose)

```json
{
  "generatedHeading": "Cell experiment plan",
  "noveltySignal": "exact match found",
  "references": [
    "pmc.ncbi.nlm.nih.gov Chemical approaches to cryopreservation Relevance score: 100",
    "pmc.ncbi.nlm.nih.gov Intracellular Delivery of Trehalose for Cell Banking - PMC Relevance score: 100",
    "pmc.ncbi.nlm.nih.gov Cryostorage of Mesenchymal Stem Cells and Biomedical Cell … Relevance score: 100"
  ],
  "metrics": [
    "Novelty signal exact match found",
    "Estimated budget $9,942",
    "Materials 5",
    "Confidence 78%"
  ],
  "protocolCards": 6,
  "materialRows": 5,
  "timelineCards": 5,
  "validationCards": 3
}
```

### 4.5 Public preview link (session)

For remote viewing during development, a **temporary** tunnel was used (valid only while the tunnel process runs):

- `https://4a57ff5ce2cea3e8-52-71-224-55.serveousercontent.com`

Serveo shows an interstitial warning; user must click **Continue to Site**.

**Note:** Next.js dev mode may log blocked cross-origin HMR unless `allowedDevOrigins` includes that host in `next.config` — that was a dev-only warning, not a plan-generation failure.

---

## Part 5: Full detailed product specification (verbatim prompt delivered in session)

The following is the complete specification prompt generated during the session for what you were trying to build. **Tavily credentials must never appear in this file**; use `TAVILY_API_KEY=***REDACTED***` in examples only.

```text
Build a polished, end-to-end, multi-agent AI Scientist web application for the Hack-Nation Challenge 04: "The AI Scientist - From hypothesis to runnable experiment plan", in collaboration with MIT Club of Northern California, MIT Club of Germany, and powered by Fulcrum Science.

The product goal is to help scientists, principal investigators, labs, CROs, pharma teams, funders, and research organizations turn a natural-language scientific hypothesis into a complete, operationally realistic experiment plan that a real lab could review, cost, source, and execute.

The application must support three required stages:

1. Input
- Let the user enter a scientific question or hypothesis in natural language.
- The input should work well for hypotheses that include:
  - intervention
  - model system
  - measurable outcome
  - threshold or success criterion
  - mechanism
  - control condition
- Include polished sample hypothesis cards for the four challenge examples:
  - Diagnostics: paper-based electrochemical anti-CRP biosensor for whole-blood CRP detection below 0.5 mg/L within 10 minutes, matching ELISA sensitivity without sample preprocessing.
  - Gut Health: C57BL/6 mice supplemented with Lactobacillus rhamnosus GG for 4 weeks to reduce intestinal permeability by at least 30%, measured by FITC-dextran assay, due to claudin-1 and occludin upregulation.
  - Cell Biology: replacing sucrose with trehalose as a cryoprotectant in HeLa cell freezing medium to increase post-thaw viability by at least 15 percentage points versus standard DMSO protocol.
  - Climate Biotech: introducing Sporomusa ovata into a bioelectrochemical system at -400 mV vs SHE to fix CO2 into acetate at at least 150 mmol/L/day, outperforming current benchmarks by at least 20%.

2. Literature QC
- Before generating the plan, run a fast literature/protocol QC check.
- Determine whether the exact experiment/protocol has been done before or whether similar work exists.
- Output one of:
  - "not found"
  - "similar work exists"
  - "exact match found"
- Return 1-3 relevant references when applicable.
- Use Tavily API for live search.
- Tavily must search the sources recommended in the challenge, including:
  - protocols.io
  - Bio-protocol
  - Nature Protocols
  - JOVE
  - OpenWetWare
  - Semantic Scholar
  - arXiv
  - PubMed / NCBI / PMC
  - Thermo Fisher application notes
  - Sigma-Aldrich technical bulletins
  - Promega protocols
  - Qiagen protocols
  - IDT tools/resources
  - ATCC
  - Addgene
  - MIQE qPCR guidelines
- The Tavily API key must be stored server-side only in an ignored `.env.local` file as `TAVILY_API_KEY`.
- The key must never be committed, exposed to the client, printed in logs, embedded in frontend code, or included in README examples except as a placeholder variable name.
- If Tavily is missing, the app may use deterministic fallback demo mode, but when a key is present it must make live Tavily calls and show real references.

3. Experiment Plan
Generate a complete, operationally grounded experiment plan that a real scientist could evaluate and use as a starting point. The output must include:

A. Executive summary
- State the hypothesis, intervention, model system, primary endpoint, control, success threshold, and overall experimental logic.

B. Protocol
- Generate a detailed protocols.io-style protocol, not a high-level summary.
- Each protocol step must include:
  - step number
  - title
  - duration / estimated time
  - purpose
  - inputs / reagents
  - equipment / setup
  - detailed method
  - ordered action checklist
  - QC gate / acceptance criteria
  - safety and handling notes
  - controls
  - sample plan
  - expected output
  - grounded source references
- Protocol should be domain-specific:
  - Diagnostics: electrode preparation, antibody immobilization, blocking, whole-blood matrix testing, calibration curve, ELISA comparison, electrochemical readout, limit of detection, assay time.
  - Gut Health: IACUC/local animal approval, C57BL/6 mouse randomization, cage map, probiotic CFU verification, gavage/feed dosing, FITC-dextran permeability assay, serum fluorescence, tight-junction protein readouts, humane endpoints.
  - Cell Biology: HeLa qualification, passage/confluence checks, mycoplasma status, freezing-media preparation, trehalose/DMSO comparison, controlled-rate freezing, thaw workflow, viability assay, post-thaw recovery.
  - Climate Biotech: anaerobic handling, Sporomusa ovata culture, H-cell or bioelectrochemical reactor setup, cathode/reference electrode calibration to SHE, CO2 feed, -400 mV condition, acetate quantification, abiotic/open-circuit/killed-cell controls.
- The protocol should be grounded in live or retrieved protocol/literature/supplier sources when Tavily is available.

C. Materials and supply chain
- List specific materials and reagents.
- Include supplier names, catalog numbers, quantities, purposes, lead times, and estimated costs.
- Use realistic supplier examples:
  - Thermo Fisher
  - Sigma-Aldrich
  - ATCC
  - DSMZ
  - Metrohm DropSens
  - Fuel Cell Store
  - VWR / Fisher Scientific
  - Addgene / Promega / Qiagen / IDT where relevant
- Include domain-specific material lines, e.g.:
  - anti-human CRP antibody
  - screen-printed carbon electrodes
  - CRP protein standard
  - Lactobacillus rhamnosus GG ATCC 53103
  - FITC-dextran 4 kDa
  - anti-claudin-1 antibody
  - HeLa cells ATCC CCL-2
  - trehalose dihydrate
  - DMSO cell culture grade
  - Sporomusa ovata DSM 2662
  - H-type bioelectrochemical cell
  - carbon cloth cathode
- When Tavily supplier results are available, include live source URLs for availability/verification.

D. Budget
- Generate realistic itemized cost estimates.
- Include:
  - reagents/materials
  - labor
  - instrument/core usage
  - contingency/overhead
- Show total estimated budget in USD.
- Make assumptions explicit, such as:
  - $75/hour blended CRO or academic core labor rate
  - internal core recharge estimate
  - supplier prices must be confirmed before ordering
  - budget excludes institutional overhead unless explicitly added

E. Timeline
- Generate a phased timeline with durations and dependencies.
- Include phases such as:
  - experimental design lock
  - sourcing and receipt QC
  - assay setup and pilot run
  - conditioning/acclimation if needed
  - main experiment execution
  - readout, analysis, and review
- For animal studies, include ethics approval and acclimation dependencies.
- For bioelectrochemical systems, include reactor conditioning.
- For cell biology, include culture recovery/passaging and freeze-thaw recovery.
- Show deliverables for each phase.

F. Validation approach
- Define primary endpoint and success threshold.
- Define controls and failure modes.
- Include assay QC criteria.
- Include reproducibility expectations, e.g. independent biological or technical replicates.
- Include raw-data handling, blinded analysis where relevant, and go/no-go decision criteria.
- Include mechanistic validation, such as claudin/occludin expression, acetate quantification, ELISA benchmark, or post-thaw viability recovery.

G. Staffing
- Include required roles:
  - PI / senior scientist
  - research scientist
  - research associate / technician
  - data analyst / biostatistician
- Include responsibilities for each role.

H. Risks and mitigations
- Include operational, scientific, supplier, timeline, safety, and data-quality risks.
- Include mitigation strategies, such as:
  - pilot feasibility run
  - confirm catalog/clone/grade before ordering
  - lock controls and acceptance criteria
  - pre-register statistical approach
  - document deviations and batch records
  - route biosafety/ethics review before execution

I. Scientist review loop / stretch goal
- Build a structured review interface where a scientist can:
  - rate the generated plan
  - choose a section to correct
  - enter a correction
  - enter a rationale
- Store feedback in a local structured feedback store, e.g. `.data/feedback.json`.
- Tag feedback by:
  - domain
  - experiment type
  - plan ID
  - section
  - correction
  - rationale
  - rating
  - created timestamp
- When generating future plans of a similar domain or experiment type, retrieve prior feedback and incorporate it into the protocol, budget, validation, or assumptions.
- Show applied prior feedback in the UI.

Architecture requirements:
- Build as a Next.js TypeScript app using the App Router.
- Use a server-side API route:
  - `POST /api/plan`
  - accepts `{ "question": "..." }`
  - returns a structured `ExperimentPlan`.
- Use a server-side API route:
  - `POST /api/review`
  - stores structured scientist feedback.
- Tavily calls must happen only server-side.
- Frontend must never import or expose the API key.
- Use TypeScript types for:
  - `Domain`
  - `NoveltySignal`
  - `Reference`
  - `LiteratureQc`
  - `ParsedQuestion`
  - `ProtocolStep`
  - `MaterialLine`
  - `BudgetLine`
  - `TimelineItem`
  - `ValidationMetric`
  - `ReviewCorrection`
  - `FeedbackEntry`
  - `ExperimentPlan`
- Use Zod validation for incoming API requests.
- Include deterministic fallback mode if Tavily key is missing, but clearly display that no live references were returned.
- Keep `.env.local` and `.data` ignored in git.
- Provide `.env.example` with:
  - `TAVILY_API_KEY=replace-with-your-server-side-key`

Suggested multi-agent architecture:
- Coordinator Agent
  - parses hypothesis
  - classifies domain
  - orchestrates specialist agents
- Literature QC Agent
  - uses Tavily to search literature/protocol repositories
  - returns novelty signal and references
- Protocol Grounding Agent
  - retrieves protocols and source grounding
  - generates protocols.io-style protocol steps
- Materials and Supply Agent
  - maps domain to reagents, suppliers, catalog numbers, quantities, lead times, costs
  - optionally verifies suppliers with Tavily
- Budget Agent
  - itemizes total budget with assumptions
- Timeline Agent
  - builds phased execution timeline and dependencies
- Validation Agent
  - defines endpoints, controls, QC gates, thresholds, failure modes
- Feedback Memory Agent
  - stores scientist review corrections
  - retrieves relevant corrections for similar future plans

UI/UX requirements:
- Build a modern, polished, intuitive interface.
- Avoid cluttered or pill-like collapsed controls.
- Use a clear layout:
  - top brand/header
  - hypothesis input card
  - readable sample hypothesis cards
  - clear run button
  - compact agent progress panel
  - prominent full report section
- Before generation, show an empty-state report panel explaining that Literature QC, protocol, materials, budget, timeline, validation, staffing, risks, and review loop will appear after running.
- After generation, show:
  - generated plan title
  - executive summary
  - sticky or easily accessible navigation
  - KPI cards for novelty, budget, materials, confidence
  - Literature QC with novelty badge and live references
  - Full protocol with detailed cards
  - Materials and supply chain table
  - Budget list
  - Timeline cards
  - Validation cards
  - Staffing
  - Risks and mitigations
  - Scientist review loop
- Auto-scroll to the generated report after a plan is created.
- Make sample hypothesis cards readable in a two-column grid on desktop and single column on mobile.
- The UI should be responsive, modern, and demo-friendly.
- Include loading states while agents run.
- Include no visible secrets in the UI.

Testing requirements:
- Run:
  - `npm run typecheck`
  - `npm run build`
- Test via API:
  - submit the Gut Health hypothesis and verify domain `gut`, live Tavily references, protocol steps, materials, budget, timeline, validation.
  - submit the Cell Biology hypothesis and verify domain `cell`, live Tavily references, protocol, materials, budget, timeline, validation.
  - submit the Climate hypothesis and verify domain `climate`, bioelectrochemical protocol details, materials, budget, timeline, validation.
- Test via browser UI:
  - load the UI
  - select a sample hypothesis card
  - click "Run QC and generate plan"
  - verify the full report renders
  - verify live Tavily references render when API key is configured
  - verify no browser exceptions
  - verify detailed protocol fields are visible:
    - Purpose
    - Time estimate
    - Inputs
    - Equipment
    - Actions
    - Safety and handling
    - QC gate
    - Notes
    - Grounded sources

Security requirements:
- Do not commit Tavily API key.
- Do not expose key in frontend bundles.
- Do not put the real key in README or `.env.example`.
- `.env.local` must be gitignored.
- `.data` feedback store must be gitignored.
- Public repo must contain only placeholders for secrets.

Final deliverable:
A working Next.js app in the same repository that lets a user enter a hypothesis, runs live Tavily-powered Literature QC, generates a complete operational experiment plan, renders a detailed protocols.io-style report, shows materials/budget/timeline/validation clearly, and captures scientist feedback for future plan improvement.
```

---

## Part 6: Commands used for verification (agents / CI)

```bash
npm install
npm run typecheck
npm run build
```

Local dev:

```bash
npm run dev
```

Local Tavily config (do not commit):

```bash
# /workspace/.env.local
TAVILY_API_KEY=***REDACTED***
```

API smoke test:

```bash
curl -sS -X POST http://localhost:3000/api/plan \
  -H 'Content-Type: application/json' \
  -d '{"question":"YOUR_HYPOTHESIS_HERE"}'
```

---

## Part 7: Git history (high level)

Commits from this workstream included (non-exhaustive):

- Build AI scientist planning app  
- Modernize experiment testing UI  
- Merge main and resolve UI conflicts  
- Expand protocol report detail  
- Fix report UI layout  

PR reference (from session): GitHub PR for branch `cursor/ai-scientist-agentic-app-b9a2` (e.g. PR #2 in the `instalab.ai` repo context).

---

## Part 8: How to extend this log

To make this file a **verbatim** transcript:

1. Export your Cursor chat to Markdown or copy all turns.  
2. Paste below under **“Appendix: Raw transcript.”**  
3. Redact any secrets before sharing publicly.

---

## Appendix: Raw transcript

*(Paste full chat export here if desired.)*
