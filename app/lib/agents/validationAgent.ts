import type { FeedbackEntry, ParsedQuestion, ValidationMetric } from '../types';

export function runValidationAgent(parsed: ParsedQuestion, feedback: FeedbackEntry[]): ValidationMetric[] {
  const feedbackMetric = feedback
    .flatMap((entry) => entry.corrections)
    .find((correction) => correction.section === 'validation')?.correction;

  return [
    {
      metric: 'Primary endpoint',
      method: `Measure ${parsed.outcome} using calibrated controls, blinded data export, and locked exclusion criteria.`,
      successCriteria: `${parsed.threshold}; ${feedbackMetric ?? 'effect size must be reproducible across independent replicates'}.`,
    },
    {
      metric: 'Protocol fidelity',
      method: 'Audit lot numbers, environmental logs, instrument calibration, and deviations in the lab notebook.',
      successCriteria: 'No critical deviations and all control arms within historical or manufacturer-recommended range.',
    },
    {
      metric: 'Mechanistic support',
      method: `Test whether observations are consistent with ${parsed.mechanism} using the closest available orthogonal readout.`,
      successCriteria: 'Mechanistic marker moves in the expected direction without invalidating primary assay QC.',
    },
  ];
}
