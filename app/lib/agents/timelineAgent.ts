import type { FeedbackEntry, ParsedQuestion, TimelineItem } from '../types';

export function runTimelineAgent(parsed: ParsedQuestion, feedback: FeedbackEntry[]): TimelineItem[] {
  const isAnimal = parsed.domain === 'gut';
  const hasTimelineFeedback = feedback.some((entry) =>
    entry.corrections.some((correction) => correction.section === 'timeline'),
  );

  const phases: TimelineItem[] = [
    {
      phase: 'Experimental design lock',
      duration: '2-3 days',
      dependencies: ['PI approval', 'statistical power assumptions', 'acceptance criteria'],
      deliverable: `Approved plan for ${parsed.experimentType} with locked success threshold: ${parsed.threshold}.`,
    },
    {
      phase: 'Sourcing and receipt QC',
      duration: '5-10 business days',
      dependencies: ['supplier stock confirmation', 'cold-chain shipping where applicable'],
      deliverable: 'Received materials with lot numbers, storage logs, and certificates captured.',
    },
    {
      phase: 'Assay setup and pilot run',
      duration: hasTimelineFeedback ? '5-7 days with expert-requested buffer' : '3-5 days',
      dependencies: ['critical reagents received', 'instrument calibration', 'positive/negative controls'],
      deliverable: `Pilot readout for ${parsed.outcome} that meets baseline QC before the main run.`,
    },
    {
      phase: 'Main experiment execution',
      duration: isAnimal ? '4-6 weeks' : '1-3 weeks',
      dependencies: isAnimal ? ['IACUC or local ethics approval', 'animal acclimation'] : ['validated pilot acceptance'],
      deliverable: 'Completed randomized experiment with deviation log and raw data export.',
    },
    {
      phase: 'Readout, analysis, and review',
      duration: '3-7 days',
      dependencies: ['blinded data export', 'QC flags resolved', 'statistical analysis plan'],
      deliverable: 'PI-reviewed report with effect size, confidence interval, and go/no-go recommendation.',
    },
  ];

  if (parsed.domain === 'climate') {
    phases.splice(3, 0, {
      phase: 'Bioreactor/electrochemical conditioning',
      duration: '3-7 days',
      dependencies: ['stable baseline current or growth curve', 'sterility check'],
      deliverable: 'Stable cathode potential and growth/sterility checks before CO2 fixation run.',
    });
  }

  return phases;
}
