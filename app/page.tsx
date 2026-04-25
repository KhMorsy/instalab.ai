'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { ExperimentPlan, ReviewCorrection } from './lib/types';

const sampleQuestions = [
  'A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.',
  'Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.',
  'Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose membrane stabilization at low temperatures.',
  'Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of -400mV vs SHE will fix CO2 into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.',
];

const sections = [
  { id: 'qc', label: 'Literature QC' },
  { id: 'protocol', label: 'Protocol' },
  { id: 'materials', label: 'Materials' },
  { id: 'budget', label: 'Budget' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'validation', label: 'Validation' },
  { id: 'review', label: 'Scientist review' },
];

function currency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export default function Home() {
  const [question, setQuestion] = useState(sampleQuestions[0]);
  const [plan, setPlan] = useState<ExperimentPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [reviewSection, setReviewSection] = useState<ReviewCorrection['section']>('protocol');
  const [reviewCorrection, setReviewCorrection] = useState('');
  const [reviewNote, setReviewNote] = useState('');
  const [rating, setRating] = useState(4);
  const [reviewSaved, setReviewSaved] = useState('');

  const totalBudget = useMemo(
    () => plan?.budget.reduce((sum, line) => sum + line.estimatedCostUsd, 0) ?? 0,
    [plan],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setReviewSaved('');

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

      setPlan((await response.json()) as ExperimentPlan);
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
      setReviewSaved('Feedback captured. Generate a similar plan to see the correction used as review memory.');
      setReviewCorrection('');
      setReviewNote('');
    }
  }

  return (
    <main>
      <section className="hero">
        <div>
          <p className="eyebrow">Hack-Nation Challenge 04 - Fulcrum Science</p>
          <h1>AI Scientist: from hypothesis to runnable experiment plan</h1>
          <p className="heroCopy">
            A multi-agent planning system that checks novelty, grounds protocols in scientific sources,
            estimates materials and budget, and captures scientist review as reusable feedback memory.
          </p>
        </div>
        <div className="agentCard">
          <span>Agent swarm</span>
          <strong>Scout / Protocol / Supply / Schedule / Validation / Review memory</strong>
        </div>
      </section>

      <section className="panel inputPanel">
        <div className="sectionTitle">
          <span>Stage 1</span>
          <h2>Scientific question</h2>
        </div>
        <form onSubmit={submit}>
          <textarea
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Describe a hypothesis with intervention, measurable outcome, threshold, mechanism, and control..."
          />
          <div className="sampleGrid">
            {sampleQuestions.map((sample, index) => (
              <button key={sample} type="button" onClick={() => setQuestion(sample)}>
                Sample {index + 1}
              </button>
            ))}
          </div>
          <button className="primary" disabled={isLoading} type="submit">
            {isLoading ? 'Coordinating agents...' : 'Run literature QC and generate plan'}
          </button>
        </form>
        {error ? <p className="error">{error}</p> : null}
      </section>

      {plan ? (
        <>
          <nav className="toc">
            {sections.map((section) => (
              <a key={section.id} href={`#${section.id}`}>
                {section.label}
              </a>
            ))}
          </nav>

          <section className="panel" id="qc">
            <div className="sectionTitle">
              <span>Stage 2</span>
              <h2>Literature QC</h2>
            </div>
            <div className="qcGrid">
              <div className={`novelty ${plan.literatureQc.noveltySignal.replaceAll(' ', '-')}`}>
                {plan.literatureQc.noveltySignal}
              </div>
              <p>{plan.literatureQc.rationale}</p>
            </div>
            <div className="referenceGrid">
              {plan.literatureQc.references.map((reference) => (
                <a key={reference.url} className="reference" href={reference.url} target="_blank">
                  <strong>{reference.title}</strong>
                  <span>{reference.source}</span>
                  <small>{reference.relevance}</small>
                </a>
              ))}
            </div>
          </section>

          <section className="panel" id="protocol">
            <div className="sectionTitle">
              <span>Stage 3</span>
              <h2>Runnable experiment plan</h2>
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
                <span>Estimated budget</span>
                <strong>{currency(totalBudget)}</strong>
              </div>
              <div>
                <span>Confidence</span>
                <strong>{Math.round(plan.confidence * 100)}%</strong>
              </div>
            </div>
            <h3>Protocol</h3>
            <ol className="protocolList">
              {plan.protocol.map((step) => (
                <li key={step.id}>
                  <div>
                    <strong>{step.title}</strong>
                    <span>{step.duration}</span>
                  </div>
                  <p>{step.method}</p>
                  <small>QC: {step.qc}</small>
                </li>
              ))}
            </ol>
          </section>

          <section className="panel twoColumn" id="materials">
            <div>
              <h2>Materials and supply chain</h2>
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
              <h2>Budget</h2>
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
              <h2>Timeline and dependencies</h2>
              <div className="timeline">
                {plan.timeline.map((phase) => (
                  <div key={phase.phase}>
                    <span>{phase.phase}</span>
                    <strong>{phase.duration}</strong>
                    <p>{phase.deliverable}</p>
                    <small>Depends on: {phase.dependencies.join(', ')}</small>
                  </div>
                ))}
              </div>
            </div>
            <div id="validation">
              <h2>Validation approach</h2>
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

          <section className="panel" id="review">
            <div className="sectionTitle">
              <span>Stretch goal</span>
              <h2>Scientist review loop</h2>
            </div>
            {plan.appliedFeedback.length ? (
              <div className="memoryBox">
                <strong>Applied prior feedback</strong>
                {plan.appliedFeedback.map((feedback) => (
                  <p key={feedback}>{feedback}</p>
                ))}
              </div>
            ) : (
              <p className="muted">No prior review memory matched this experiment type yet.</p>
            )}
            <form className="reviewForm" onSubmit={submitReview}>
              <label>
                Section
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
                Rating
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
              <button className="primary" type="submit">
                Save structured correction
              </button>
              {reviewSaved ? <p className="success">{reviewSaved}</p> : null}
            </form>
          </section>
        </>
      ) : null}
    </main>
  );
}
