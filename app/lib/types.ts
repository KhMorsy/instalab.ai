export type Domain = 'diagnostics' | 'gut' | 'cell' | 'climate' | 'general';
export type SourceCategory = 'literature' | 'protocol' | 'supplier' | 'standards';

export type NoveltySignal = 'not found' | 'similar work exists' | 'exact match found';

export type Reference = {
  title: string;
  url: string;
  source: string;
  snippet: string;
  relevance: number;
};

export type LiteratureQc = {
  noveltySignal: NoveltySignal;
  rationale: string;
  references: Reference[];
};

export type ParsedQuestion = {
  question: string;
  domain: Domain;
  experimentType: string;
  intervention: string;
  outcome: string;
  threshold: string;
  mechanism: string;
  modelSystem: string;
};

export type ProtocolStep = {
  id: string;
  title: string;
  duration: string;
  method: string;
  qc: string;
  sources: string[];
};

export type MaterialLine = {
  name: string;
  purpose: string;
  supplier: string;
  catalogNumber: string;
  quantity: string;
  leadTime: string;
  estimatedUnitCostUsd: number;
};

export type BudgetLine = {
  category: string;
  estimatedCostUsd: number;
  assumption: string;
};

export type TimelineItem = {
  phase: string;
  duration: string;
  dependencies: string[];
  deliverable: string;
};

export type ValidationMetric = {
  metric: string;
  method: string;
  successCriteria: string;
};

export type ReviewCorrection = {
  section: 'protocol' | 'materials' | 'budget' | 'timeline' | 'validation';
  original?: string;
  correction: string;
  rationale: string;
};

export type FeedbackEntry = {
  id: string;
  planId: string;
  domain: Domain;
  experimentType: string;
  rating: number;
  corrections: ReviewCorrection[];
  createdAt: string;
};

export type ExperimentPlan = {
  id: string;
  title: string;
  question: string;
  domain: Domain;
  experimentType: string;
  confidence: number;
  executiveSummary: string;
  literatureQc: LiteratureQc;
  protocol: ProtocolStep[];
  materials: MaterialLine[];
  budget: BudgetLine[];
  timeline: TimelineItem[];
  validation: ValidationMetric[];
  staffing: string[];
  risksAndMitigations: string[];
  groundedSources: Reference[];
  appliedFeedback: string[];
  generatedAt: string;
};
