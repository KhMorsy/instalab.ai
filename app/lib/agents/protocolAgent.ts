import type { FeedbackEntry, LiteratureQc, ParsedQuestion, ProtocolStep } from '../types';
import { tavilySearch } from './tavily';

const protocolsDomains = [
  'protocols.io',
  'bio-protocol.org',
  'jove.com',
  'openwetware.org',
  'nature.com',
  'atcc.org',
  'addgene.org',
  'promega.com',
  'qiagen.com',
];

function templateFor(parsed: ParsedQuestion, feedback: FeedbackEntry[]): ProtocolStep[] {
  const feedbackNote = feedback[0]?.corrections[0]?.correction;
  const memoryClause = feedbackNote ? ` Incorporate prior expert correction: ${feedbackNote}` : '';

  return [
    {
      id: 'protocol-lock',
      title: 'Protocol lock and risk review',
      duration: 'Day -3 to -1',
      method: `Translate the hypothesis into an approved protocol for ${parsed.modelSystem}; confirm inclusion/exclusion criteria, randomization, blinding, biosafety level, and disposal requirements.${memoryClause}`,
      qc: 'PI signs protocol version, risk assessment, and acceptance criteria before ordering perishable materials.',
      sources: ['Institutional SOP and domain protocol repositories'],
    },
    {
      id: 'materials-qc',
      title: 'Materials receipt and qualification',
      duration: 'Day 0',
      method: `Receive reagents for ${parsed.intervention}; record lot numbers, certificates of analysis, storage temperatures, and expiry dates. Run incoming QC on critical biological materials.`,
      qc: 'All critical reagents pass identity, sterility, and storage checks.',
      sources: ['Supplier technical bulletins and application notes'],
    },
    {
      id: 'controls',
      title: 'Baseline setup and controls',
      duration: 'Day 1',
      method: `Establish negative, vehicle, positive, and benchmark controls for ${parsed.modelSystem}. Capture baseline ${parsed.outcome} before applying intervention.`,
      qc: 'Baseline variability is within the pre-specified coefficient of variation threshold.',
      sources: ['Published comparable protocols'],
    },
    {
      id: 'intervention',
      title: 'Intervention execution',
      duration: 'Day 1 onward',
      method: `Apply ${parsed.intervention} at a minimum of three dose or condition levels plus control. Maintain identical handling, incubation, sampling, and operator conditions across arms.`,
      qc: 'Environmental logs and treatment records show no protocol deviations.',
      sources: ['Grounded from retrieved protocols and supplier instructions'],
    },
    {
      id: 'endpoint',
      title: 'Primary endpoint measurement',
      duration: 'Endpoint window',
      method: `Measure ${parsed.outcome} using the most validated assay available for this domain; include calibration curves, blanks, technical replicates, and assay controls.`,
      qc: 'Calibration curve R2 >= 0.98 and control values fall inside historical range.',
      sources: ['Assay standards and manufacturer protocols'],
    },
    {
      id: 'analysis',
      title: 'Statistical analysis and go/no-go call',
      duration: 'Analysis',
      method: `Compare treatment arms against controls using the pre-registered statistical test. Report effect size, confidence interval, raw data exclusions, and whether ${parsed.threshold} was met.`,
      qc: 'Independent reviewer reproduces calculations from raw data and notebook.',
      sources: ['MIQE/statistical reporting guidance where applicable'],
    },
  ];
}

export async function runProtocolAgent(
  parsed: ParsedQuestion,
  qc: LiteratureQc,
  feedback: FeedbackEntry[],
): Promise<ProtocolStep[]> {
  const queries = [
    `${parsed.domain} ${parsed.modelSystem} ${parsed.intervention} protocol`,
    `${parsed.outcome} ${parsed.modelSystem} assay protocol`,
    `${parsed.domain} standard operating protocol`,
  ].filter(Boolean);

  const retrieved = (
    await Promise.all(
      queries.map((query) =>
        tavilySearch(query, {
          maxResults: 3,
          includeDomains: protocolsDomains,
          searchDepth: 'advanced',
        }).catch(() => []),
      ),
    )
  ).flat();

  const uniqueSources = Array.from(new Map([...qc.references, ...retrieved].map((item) => [item.url, item])).values());
  return templateFor(parsed, feedback).map((step, index) => {
    const source = uniqueSources[index % Math.max(uniqueSources.length, 1)];
    return source ? { ...step, sources: [...step.sources, `${source.title} (${source.url})`] } : step;
  });
}
