import type { Domain, ParsedQuestion } from '../types';

const domainHints = [
  {
    key: 'diagnostics',
    terms: ['biosensor', 'anti-crp', 'c-reactive protein', 'whole blood', 'elisa', 'diagnostic', 'crp'],
  },
  {
    key: 'gut',
    terms: ['c57bl/6', 'mouse', 'mice', 'probiotic', 'intestinal', 'fitc-dextran', 'fitc', 'dextran', 'microbiome'],
  },
  {
    key: 'cell',
    terms: ['hela', 'cryoprotectant', 'post-thaw', 'thaw', 'freezing', 'viability', 'trehalose', 'dmso'],
  },
  {
    key: 'climate',
    terms: ['sporomusa', 'co2', 'carbon', 'bioelectrochemical', 'acetate', 'cathode', 'she'],
  },
] satisfies Array<{ key: Exclude<Domain, 'general'>; terms: string[] }>;

export function parseScientificQuestion(question: string): ParsedQuestion {
  const normalized = question.toLowerCase();
  const domain = classifyDomain(normalized);

  const outcome =
    question.match(/(?:will|to)\s+(.+?)(?:,| due to| compared| within|$)/i)?.[1]?.trim() ??
    'primary experimental endpoint';

  const intervention =
    question.match(/(?:introducing|supplementing|replacing|functionalized with|testing|using)\s+(.+?)(?:\s+will|,|$)/i)?.[1]?.trim() ??
    'proposed intervention';

  const modelSystem =
    question.match(/(?:in|into)\s+(.+?)(?:\s+with|\s+at|,|$)/i)?.[1]?.trim() ??
    'target experimental system';

  const threshold =
    question.match(/(?:below|above|at least|within|by)\s+[-]?\d[\w\s./%-]*/i)?.[0]?.trim() ??
    'pre-specified effect size or performance threshold';

  const mechanism =
    question.match(/due to\s+(.+?)(?:\.|$)/i)?.[1]?.trim() ??
    'mechanistic rationale to be tested';

  return {
    question,
    domain,
    experimentType: experimentTypeFor(domain),
    intervention,
    outcome,
    threshold,
    mechanism,
    modelSystem,
  };
}

function classifyDomain(normalizedQuestion: string): Domain {
  const scored = domainHints
    .map(({ key, terms }) => ({
      key,
      score: terms.reduce((sum, term) => sum + (normalizedQuestion.includes(term) ? term.length : 0), 0),
    }))
    .sort((left, right) => right.score - left.score);

  return scored[0]?.score ? scored[0].key : 'general';
}

function experimentTypeFor(domain: Domain) {
  const names: Record<Domain, string> = {
    diagnostics: 'rapid diagnostic assay validation',
    gut: 'controlled in vivo intervention study',
    cell: 'cell culture protocol optimization',
    climate: 'bioelectrochemical carbon fixation study',
    general: 'hypothesis-driven feasibility experiment',
  };

  return names[domain];
}
