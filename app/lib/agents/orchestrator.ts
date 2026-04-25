import type { ExperimentPlan, FeedbackEntry, LiteratureQc } from '../types';
import { runLiteratureAgent } from './literatureAgent';
import { runMaterialsAgent } from './materialsAgent';
import { parseScientificQuestion } from './query';
import { findRelevantFeedback } from './reviewMemory';
import { runProtocolAgent } from './protocolAgent';
import { runTimelineAgent } from './timelineAgent';
import { runValidationAgent } from './validationAgent';

export async function createExperimentPlan(question: string): Promise<ExperimentPlan> {
  const parsed = parseScientificQuestion(question);
  const feedback = await findRelevantFeedback(parsed);
  const literature = await runLiteratureAgent(parsed);

  const [protocol, materials, timeline, validation] = await Promise.all([
    runProtocolAgent(parsed, literature, feedback),
    runMaterialsAgent(parsed, feedback),
    runTimelineAgent(parsed, feedback),
    runValidationAgent(parsed, feedback),
  ]);

  const groundedSources = literature.references;
  return {
    id: crypto.randomUUID(),
    title: `${titleCase(parsed.domain)} experiment plan`,
    question,
    experimentType: parsed.experimentType,
    domain: parsed.domain,
    confidence: literature.references.length ? 0.78 : 0.58,
    executiveSummary:
      `Test whether ${parsed.intervention} changes ${parsed.outcome} relative to an appropriate control.`,
    literatureQc: literature,
    protocol,
    materials: materials.materials,
    budget: materials.budget,
    timeline,
    validation,
    staffing: [
      'Principal investigator or senior scientist: approve design, controls, and go/no-go criteria.',
      'Research scientist: own protocol execution, troubleshooting, and data-quality review.',
      'Research associate or technician: prepare reagents, run assays, capture raw data, and maintain chain-of-custody.',
      'Data analyst or biostatistician: pre-register analysis and reproduce final statistics.',
    ],
    risksAndMitigations: buildRiskRegister(literature, feedback),
    groundedSources,
    appliedFeedback: feedback.flatMap((entry) =>
      entry.corrections.map((correction) => `${correction.section}: ${correction.correction}`),
    ),
    generatedAt: new Date().toISOString(),
  };
}

function buildRiskRegister(literature: LiteratureQc, feedback: FeedbackEntry[]) {
  const risks = [
    `Published protocol mismatch: ${
      literature.noveltySignal === 'not found'
        ? 'Run a smaller feasibility pilot before committing full procurement.'
        : 'Compare parameters against cited references before ordering materials.'
    }`,
    'Supplier substitutions alter assay performance: lock critical reagents to validated clone, grade, or catalog where possible.',
    'Timeline slips from biological acclimation or assay optimization: front-load procurement and include explicit go/no-go criteria after the pilot measurement.',
  ];

  if (feedback.length) {
    risks.push(`Known expert correction area: review prior scientist note "${feedback[0].corrections[0]?.correction}".`);
  }

  return risks;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase());
}
