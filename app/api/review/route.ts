import { NextResponse } from 'next/server';
import { z } from 'zod';
import { saveFeedback } from '@/app/lib/agents/reviewMemory';

const reviewSchema = z.object({
  planId: z.string().min(8),
  domain: z.enum(['diagnostics', 'gut', 'cell', 'climate', 'general']),
  experimentType: z.string().min(2),
  rating: z.number().min(1).max(5),
  corrections: z
    .array(
      z.object({
        section: z.enum(['protocol', 'materials', 'budget', 'timeline', 'validation']),
        original: z.string().optional(),
        correction: z.string().min(3),
        rationale: z.string().min(3),
      }),
    )
    .default([]),
});

export async function POST(request: Request) {
  try {
    const payload = reviewSchema.parse(await request.json());
    const review = await saveFeedback(payload);
    return NextResponse.json({ ok: true, review });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to store review' },
      { status: 400 },
    );
  }
}
