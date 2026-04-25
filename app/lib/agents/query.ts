import type { Domain, ParsedQuestion } from '../types';

const domainHints = [
  { key: 'diagnostics', terms: ['biosensor', 'antibody', 'blood', 'elisa', 'diagnostic', 'assay', 'crp'] },
  { key: 'gut', terms: ['mouse', 'mice', 'probiotic', 'intestinal', 'fitc', 'dextran', 'microbiome'] },
  { key: 'cell', terms: ['cell', 'hela', 'cryoprotectant', 'thaw', 'freezing', 'viability', 'trehalose'] },
  { key: 'climate', terms: ['co2', 'carbon', 'bioelectrochemical', 'acetate', 'cathode', 'sporomusa'] },
] satisfies Array<{ key: Domain; terms: string[] }>;

export function parseScientificQuestion(question: string): ParsedQuestion {
  const normalized = question.toLowerCase();
  const domain =
    domainHints.find(({ terms }) => terms.some((term) => normalized.includes(term)))?.key ??
    'general';

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
