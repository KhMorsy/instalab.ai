import 'server-only';

import { promises as fs } from 'fs';
import path from 'path';

import type { Domain, FeedbackEntry, ParsedQuestion } from '../types';

const memoryPath = path.join(process.cwd(), '.data', 'feedback.json');

async function ensureStore() {
  await fs.mkdir(path.dirname(memoryPath), { recursive: true });
  try {
    await fs.access(memoryPath);
  } catch {
    await fs.writeFile(memoryPath, '[]', 'utf8');
  }
}

export async function loadFeedback(): Promise<FeedbackEntry[]> {
  await ensureStore();
  const file = await fs.readFile(memoryPath, 'utf8');
  return JSON.parse(file) as FeedbackEntry[];
}

export async function saveFeedback(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>) {
  const entries = await loadFeedback();
  const saved: FeedbackEntry = {
    ...entry,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  entries.unshift(saved);
  await fs.writeFile(memoryPath, JSON.stringify(entries.slice(0, 200), null, 2), 'utf8');
  return saved;
}

export async function relevantFeedback(domain: Domain, experimentType: string) {
  const entries = await loadFeedback();
  return entries
    .filter((entry) => entry.domain === domain || entry.experimentType === experimentType)
    .slice(0, 5);
}

export async function findRelevantFeedback(parsed: ParsedQuestion) {
  return relevantFeedback(parsed.domain, parsed.experimentType);
}
