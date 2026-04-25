'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { ExperimentPlan, ReviewCorrection } from './lib/types';

const sampleQuestions = [
  {
    label: 'Diagnostics',
    title: 'Rapid CRP biosensor',
    helper: 'Paper-based blood diagnostic benchmarked against ELISA.',
    question:
      'A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.',
  },
  {
    label: 'Gut health',
    title: 'Probiotic barrier study',
    helper: 'Mouse intervention with FITC-dextran permeability readout.',
    question:
      'Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.',
  },
  {
    label: 'Cell biology',
    title: 'Trehalose cryoprotection',
    helper: 'HeLa freezing protocol optimization against DMSO.',
    question:
      'Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose membrane stabilization at low temperatures.',
  },
  {
    label: 'Climate biotech',
    title: 'CO2 to acetate system',
    helper: 'Bioelectrochemical carbon fixation with Sporomusa ovata.',
    question:
      'Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of -400mV vs SHE will fix CO2 into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.',
  },
];

const sections = [
  { id: 'qc', label: 'Literature QC' },
  { id: 'protocol', label: 'Protocol' },
  { id: 'materials', label: 'Materials' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'review', label: 'Review loop' },
];

const agentStages = [
  'Parse hypothesis',
  'Search literature',
  'Ground protocol',
  'Estimate supply chain',
  'Build timeline',
  'Define validation',
];

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function noveltyClass(signal?: string) {
  return signal?.replaceAll(' ', '-') ?? 'not-run';
}

export default function Home() {
  const [question, setQuestion] = useState(sampleQuestions[0].question);
  const [activeSample, setActiveSample] = useState(0);
  const [plan, setPlan] = useState<ExperimentPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewSection, setReviewSection] = useState<ReviewCorrection['section']>('protocol');
  const [reviewCorrection, setReviewCorrection] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [rating, setRating] = useState(4);
  const [reviewSaved, setReviewSaved] = useState('');
  const [copied, setCopied] = useState('');

  const totalBudget = useMemo(
    () => plan?.budget.reduce((sum, line) => sum + line.estimatedCostUsd, 0) ?? 0,
    [plan],
  );

  const requestPreview = useMemo(
    () => JSON.stringify({ question }, null, 2),
    [question],
  );

  const isReadyToSubmit = question.trim().length >= 20 && !isLoading;

  async function copyText(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    window.setTimeout(() => setCopied(''), 1800);
  }

  function chooseSample(index: number) {
    setActiveSample(index);
    setQuestion(sampleQuestions[index].question);
    setError('');
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setReviewSaved('');
    setCopied('');

    try {
      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Unable to generate plan.');
      }

      const generatedPlan = (await response.json()) as ExperimentPlan;
      setPlan(generatedPlan);
      window.setTimeout(() => {
        document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!plan) {
      return;
    }

    setReviewSaved('');
    const response = await fetch('/api/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: plan.id,
        domain: plan.domain,
        experimentType: plan.experimentType,
        rating,
        corrections: [
          {
            section: reviewSection,
            original: 'See generated plan section.',
            correction: reviewCorrection,
            rationale: reviewNote,
          },
        ],
      }),
    });

    if (response.ok) {
      setReviewSaved('Feedback saved. Generate a similar plan to see this correction applied.');
      setReviewCorrection('');
      setReviewNote('');
    } else {
      setReviewSaved('Could not save feedback. Please add a correction and rationale.');
    }
  }

  return (
    <main className="appShell">
      <header className="topBar">
        <div className="brandMark">IL</div>
        <div>
          <strong>InstaLab AI Scientist</strong>
          <span>Hypothesis to runnable experiment plan</span>
        </div>
        <a href="#tester">Test the app</a>
      </header>

      <section className="hero">
        <div className="heroCopyBlock">
          <p className="eyebrow">Hack-Nation Challenge 04 - Fulcrum Science</p>
          <h1>Plan lab-ready experiments with a coordinated AI agent team.</h1>
          <p className="heroCopy">
            Enter a scientific hypothesis, run a fast literature QC check, and inspect a full operational
            plan with protocol, suppliers, budget, timeline, validation, and feedback memory.
          </p>
          <div className="heroActions">
            <a className="primaryLink" href="#tester">
              Start testing
            </a>
            <a className="ghostLink" href="#review">
              Review loop
            </a>
          </div>
        </div>
        <aside className="agentCard">
          <span>Multi-agent run</span>
          <strong>Scout / Protocol / Supply / Schedule / Validation / Review memory</strong>
          <div className="miniMetrics">
            <div>
              <b>3</b>
              <small>required stages</small>
            </div>
            <div>
              <b>6</b>
              <small>specialist agents</small>
            </div>
            <div>
              <b>0</b>
              <small>client-side secrets</small>
            </div>
          </div>
        </aside>
      </section>

      <section className="testerGrid" id="tester">
        <form className="panel inputPanel" onSubmit={submit}>
          <div className="sectionTitle">
            <div>
              <span>Stage 1</span>
              <h2>Hypothesis tester</h2>
            </div>
            <small>{question.trim().length} characters</small>
          </div>

          <label className="fieldLabel" htmlFor="hypothesis">
            Scientific question or hypothesis
          </label>
          <textarea
            id="hypothesis"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Describe an intervention, model system, measurable outcome, threshold, mechanism, and control..."
          />

          <div className="sampleCards" aria-label="Sample hypotheses">
            {sampleQuestions.map((sample, index) => (
              <button
                className={activeSample === index ? 'sampleCard active' : 'sampleCard'}
                key={sample.title}
                type="button"
                onClick={() => chooseSample(index)}
              >
                <span>{sample.label}</span>
                <strong>{sample.title}</strong>
                <small>{sample.helper}</small>
              </button>
            ))}
          </div>

          <div className="buttonRow">
            <button className="primaryButton" disabled={!isReadyToSubmit} type="submit">
              {isLoading ? 'Running agent workflow...' : 'Run QC and generate plan'}
            </button>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => copyText(requestPreview, 'request')}
            >
              Copy API payload
            </button>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => {
                setQuestion('');
                setPlan(null);
                setError('');
              }}
            >
              Clear
            </button>
          </div>
          {copied === 'request' ? <p className="success">API payload copied.</p> : null}
          {error ? <p className="error">{error}</p> : null}
        </form>

        <aside className="panel runPanel">
          <div className="sectionTitle">
            <div>
              <span>Live run</span>
              <h2>Agent progress</h2>
            </div>
            <div className={isLoading ? 'statusPill running' : plan ? 'statusPill done' : 'statusPill'}>
              {isLoading ? 'Running' : plan ? 'Complete' : 'Ready'}
            </div>
          </div>

          <div className="agentRail">
            {agentStages.map((stage, index) => (
              <div className={isLoading || plan ? 'agentStep active' : 'agentStep'} key={stage}>
                <span>{index + 1}</span>
                <div>
                  <strong>{stage}</strong>
                  <small>
                    {isLoading
                      ? 'Queued in the coordinator'
                      : plan
                        ? 'Completed for latest plan'
                        : 'Waiting for hypothesis'}
                  </small>
                </div>
              </div>
            ))}
          </div>

          <pre className="requestPreview">{requestPreview}</pre>
        </aside>
      </section>

      {isLoading ? (
        <section className="loadingGrid" aria-live="polite">
          {['Literature QC', 'Protocol grounding', 'Materials and budget'].map((item) => (
            <div className="skeletonCard" key={item}>
              <span>{item}</span>
              <div />
              <div />
            </div>
          ))}
        </section>
      ) : null}

      {!plan && !isLoading ? (
        <section className="emptyReport panel" id="report">
          <div>
            <span className="eyebrow">Full report preview</span>
            <h2>Run a hypothesis to generate the required deliverables.</h2>
            <p>
              The final report will show Literature QC, a protocols.io-style protocol, materials and supply chain,
              budget, timeline, validation, staffing, risks, and the scientist review loop.
            </p>
          </div>
          <div className="deliverableGrid">
            {['Literature QC', 'Protocol', 'Materials', 'Budget', 'Timeline', 'Validation'].map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </section>
      ) : null}

      {plan ? (
        <section className="reportStack" id="report">
          <section className="resultsHeader">
            <div>
              <span className="eyebrow">Generated plan</span>
              <h2>{plan.title}</h2>
              <p>{plan.executiveSummary}</p>
            </div>
            <button
              className="secondaryButton"
              type="button"
              onClick={() => copyText(JSON.stringify(plan, null, 2), 'plan')}
            >
              {copied === 'plan' ? 'Copied plan' : 'Copy plan JSON'}
            </button>
          </section>

          <nav className="toc" aria-label="Plan sections">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>

          <section className="metricGrid">
            <div className="metricCard">
              <span>Novelty signal</span>
              <strong>{plan.literatureQc.noveltySignal}</strong>
            </div>
            <div className="metricCard">
              <span>Estimated budget</span>
              <strong>{currency(totalBudget)}</strong>
            </div>
            <div className="metricCard">
              <span>Materials</span>
              <strong>{plan.materials.length}</strong>
            </div>
            <div className="metricCard">
              <span>Confidence</span>
              <strong>{Math.round(plan.confidence * 100)}%</strong>
            </div>
          </section>

          <section className="panel" id="qc">
            <div className="sectionTitle">
              <div>
                <span>Stage 2</span>
                <h2>Literature QC</h2>
              </div>
              <div className={`novelty ${noveltyClass(plan.literatureQc.noveltySignal)}`}>
                {plan.literatureQc.noveltySignal}
              </div>
            </div>
            <p className="mutedText">{plan.literatureQc.rationale}</p>
            {plan.literatureQc.references.length ? (
              <div className="referenceGrid">
                {plan.literatureQc.references.map((reference) => (
                  <a key={reference.url} className="reference" href={reference.url} rel="noreferrer" target="_blank">
                    <span>{reference.source}</span>
                    <strong>{reference.title}</strong>
                    <small>Relevance score: {reference.relevance}</small>
                  </a>
                ))}
              </div>
            ) : (
              <div className="emptyState">
                No live references returned. Add <code>TAVILY_API_KEY</code> on the server for real literature hits.
              </div>
            )}
          </section>

          <section className="panel" id="protocol">
            <div className="sectionTitle">
              <div>
                <span>Stage 3</span>
                <h2>Runnable experiment plan</h2>
              </div>
              <small>{plan.experimentType}</small>
            </div>
            <div className="metaGrid">
              <div>
                <span>Domain</span>
                <strong>{plan.domain}</strong>
              </div>
              <div>
                <span>Experiment type</span>
                <strong>{plan.experimentType}</strong>
              </div>
              <div>
                <span>Generated</span>
                <strong>{new Date(plan.generatedAt).toLocaleString()}</strong>
              </div>
            </div>
            <ol className="protocolList">
              {plan.protocol.map((step, index) => (
                <li key={step.id}>
                  <div className="protocolHeader">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div>
                      <strong>{step.title}</strong>
                      <small>{step.duration}</small>
                    </div>
                  </div>
                  <p>{step.method}</p>
                  <div className="protocolDetailGrid">
                    <div>
                      <span>Purpose</span>
                      <p>{step.method}</p>
                    </div>
                    <div>
                      <span>Time estimate</span>
                      <p>{step.estimatedTime}</p>
                    </div>
                  </div>
                  <div className="protocolSubgrid">
                    <div>
                      <span>Inputs</span>
                      <ul>
                        {step.inputs.map((input) => (
                          <li key={input}>{input}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span>Equipment</span>
                      <ul>
                        {step.equipment.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span>Actions</span>
                      <ol>
                        {step.actions.map((action) => (
                          <li key={action}>{action}</li>
                        ))}
                      </ol>
                    </div>
                    <div>
                      <span>Safety and handling</span>
                      <p>{step.safety}</p>
                    </div>
                    <div>
                      <span>QC gate</span>
                      <p>{step.qc}</p>
                    </div>
                    <div>
                      <span>Notes</span>
                      <ul>
                        {step.notes.map((note) => (
                          <li key={note}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  {step.sources.length ? (
                    <div className="sourceList">
                      <span>Grounded sources</span>
                      {step.sources.map((source) => (
                        <small key={source}>{source}</small>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>

          <section className="panel twoColumn" id="materials">
            <div>
              <div className="sectionTitle compact">
                <div>
                  <span>Operations</span>
                  <h2>Materials and supply chain</h2>
                </div>
              </div>
              <div className="tableWrap">
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Supplier</th>
                      <th>Catalog</th>
                      <th>Purpose</th>
                      <th>Lead time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.materials.map((material) => (
                      <tr key={`${material.name}-${material.catalogNumber}`}>
                        <td>{material.name}</td>
                        <td>{material.supplier}</td>
                        <td>{material.catalogNumber}</td>
                        <td>{material.purpose}</td>
                        <td>{material.leadTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div id="budget">
              <div className="sectionTitle compact">
                <div>
                  <span>Costs</span>
                  <h2>Budget</h2>
                </div>
              </div>
              <div className="budgetList">
                {plan.budget.map((line) => (
                  <div key={line.category}>
                    <span>{line.category}</span>
                    <strong>{currency(line.estimatedCostUsd)}</strong>
                    <small>{line.assumption}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel twoColumn" id="timeline">
            <div>
              <div className="sectionTitle compact">
                <div>
                  <span>Execution</span>
                  <h2>Timeline and dependencies</h2>
                </div>
              </div>
              <div className="timeline">
                {plan.timeline.map((phase, index) => (
                  <div key={phase.phase}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <strong>{phase.phase}</strong>
                    <b>{phase.duration}</b>
                    <p>{phase.deliverable}</p>
                    <small>Depends on: {phase.dependencies.join(', ')}</small>
                  </div>
                ))}
              </div>
            </div>
            <div id="validation">
              <div className="sectionTitle compact">
                <div>
                  <span>Decision quality</span>
                  <h2>Validation approach</h2>
                </div>
              </div>
              <div className="validationGrid">
                {plan.validation.map((validation) => (
                  <div key={validation.metric}>
                    <strong>{validation.metric}</strong>
                    <p>{validation.method}</p>
                    <small>Success: {validation.successCriteria}</small>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel supportGrid">
            <div>
              <div className="sectionTitle compact">
                <div>
                  <span>Team</span>
                  <h2>Staffing</h2>
                </div>
              </div>
              <ul className="cleanList">
                {plan.staffing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="sectionTitle compact">
                <div>
                  <span>Risk</span>
                  <h2>Mitigations</h2>
                </div>
              </div>
              <ul className="cleanList">
                {plan.risksAndMitigations.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel reviewPanel" id="review">
            <div className="sectionTitle">
              <div>
                <span>Stretch goal</span>
                <h2>Scientist review loop</h2>
              </div>
              <div className="statusPill done">Structured feedback</div>
            </div>

            {plan.appliedFeedback.length ? (
              <div className="memoryBox">
                <strong>Applied prior feedback</strong>
                {plan.appliedFeedback.map((feedback) => (
                  <p key={feedback}>{feedback}</p>
                ))}
              </div>
            ) : (
              <div className="emptyState">No prior review memory matched this experiment type yet.</div>
            )}

            <form className="reviewForm" onSubmit={submitReview}>
              <label>
                Section to correct
                <select
                  value={reviewSection}
                  onChange={(event) => setReviewSection(event.target.value as ReviewCorrection['section'])}
                >
                  <option value="protocol">Protocol</option>
                  <option value="materials">Materials</option>
                  <option value="budget">Budget</option>
                  <option value="timeline">Timeline</option>
                  <option value="validation">Validation</option>
                </select>
              </label>
              <label>
                Scientist rating
                <input
                  max="5"
                  min="1"
                  onChange={(event) => setRating(Number(event.target.value))}
                  type="range"
                  value={rating}
                />
                <span>{rating}/5</span>
              </label>
              <label>
                Correction
                <textarea
                  value={reviewCorrection}
                  onChange={(event) => setReviewCorrection(event.target.value)}
                  placeholder="Example: Use paired baseline FITC-dextran measurements before randomization."
                  required
                />
              </label>
              <label>
                Rationale
                <textarea
                  value={reviewNote}
                  onChange={(event) => setReviewNote(event.target.value)}
                  placeholder="Why this correction matters operationally or scientifically."
                  required
                />
              </label>
              <button className="primaryButton" type="submit">
                Save structured correction
              </button>
              {reviewSaved ? <p className="success">{reviewSaved}</p> : null}
            </form>
          </section>
        </section>
      ) : null}
    </main>
  );
}
