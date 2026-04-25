import { LiteratureQc, Reference, ParsedQuestion } from '../types';
import { TavilyResult, tavilySearch } from './tavily';

const literatureDomains = [
  'semanticscholar.org',
  'arxiv.org',
  'ncbi.nlm.nih.gov',
  'pubmed.ncbi.nlm.nih.gov',
  'protocols.io',
  'bio-protocol.org',
  'nature.com',
  'jove.com',
  'openwetware.org',
];

function normalizeResult(result: TavilyResult): Reference {
  return {
    title: result.title,
    url: result.url,
    source: new URL(result.url).hostname.replace('www.', ''),
    relevance: Math.round((result.score ?? 0.72) * 100),
    snippet: result.content,
  };
}

function noveltyFromResults(results: TavilyResult[], question: string): LiteratureQc['noveltySignal'] {
  const exactTerms = ['exact protocol', 'protocol', 'same hypothesis', 'same assay'];
  const questionTerms = question
    .toLowerCase()
    .split(/[^a-z0-9+-]+/)
    .filter((term) => term.length > 4);

  const strongMatches = results.filter((result) => {
    const haystack = `${result.title} ${result.content}`.toLowerCase();
    const termHits = questionTerms.filter((term) => haystack.includes(term)).length;
    return termHits >= Math.min(5, Math.ceil(questionTerms.length * 0.45));
  });

  if (strongMatches.some((result) => exactTerms.some((term) => `${result.title} ${result.content}`.toLowerCase().includes(term)))) {
    return 'exact match found';
  }

  if (strongMatches.length > 0 || results.length > 0) {
    return 'similar work exists';
  }

  return 'not found';
}

export async function runLiteratureAgent(parsed: ParsedQuestion): Promise<LiteratureQc> {
  const query = `"${parsed.question}" protocol OR assay OR methods OR experiment`;
  const results = await tavilySearch(query, {
    includeDomains: literatureDomains,
    maxResults: 5,
    searchDepth: 'advanced',
  });

  const references = results.slice(0, 3).map(normalizeResult);
  const noveltySignal = noveltyFromResults(results, parsed.question);

  return {
    noveltySignal,
    references,
    rationale:
      references.length > 0
        ? 'The literature scout found nearby methods or hypotheses in indexed literature/protocol sources; review the linked records before execution.'
        : 'No close match was returned from the configured literature/protocol searches. Treat this as a fast novelty signal, not a full systematic review.',
  };
}
