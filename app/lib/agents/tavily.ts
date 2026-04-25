import 'server-only';

export type TavilyResult = {
  title: string;
  url: string;
  content: string;
  score?: number;
};

type TavilyResponse = {
  results?: TavilyResult[];
};

const TAVILY_ENDPOINT = 'https://api.tavily.com/search';

export async function tavilySearch(
  query: string,
  options?: {
    maxResults?: number;
    includeDomains?: string[];
    searchDepth?: 'basic' | 'advanced';
  },
): Promise<TavilyResult[]> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    return [];
  }

  const response = await fetch(TAVILY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      query,
      max_results: options?.maxResults ?? 5,
      search_depth: options?.searchDepth ?? 'advanced',
      include_domains: options?.includeDomains,
      include_answer: false,
      include_raw_content: false,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as TavilyResponse;
  return payload.results ?? [];
}

export function hasTavilyKey() {
  return Boolean(process.env.TAVILY_API_KEY);
}

export const TAVILY_DOMAINS = {
  literature: [
    'semanticscholar.org',
    'arxiv.org',
    'ncbi.nlm.nih.gov',
    'pubmed.ncbi.nlm.nih.gov',
    'nature.com',
    'jove.com',
  ],
  protocol: [
    'protocols.io',
    'bio-protocol.org',
    'nature.com',
    'jove.com',
    'openwetware.org',
    'atcc.org',
    'addgene.org',
  ],
  supplier: [
    'thermofisher.com',
    'sigmaaldrich.com',
    'promega.com',
    'qiagen.com',
    'idtdna.com',
    'atcc.org',
    'addgene.org',
  ],
  standards: ['ncbi.nlm.nih.gov', 'bio-protocol.org', 'nature.com'],
} as const;
