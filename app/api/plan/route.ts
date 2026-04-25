import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createExperimentPlan } from '../../lib/agents/orchestrator';

export const runtime = 'nodejs';

const planRequestSchema = z.object({
  question: z.string().trim().min(20, 'Enter a specific scientific hypothesis or question.').max(2000),
});

export async function POST(request: Request) {
  try {
    const payload = planRequestSchema.parse(await request.json());
    const plan = await createExperimentPlan(payload.question);
    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid request.' }, { status: 400 });
    }

    console.error(error);
    return NextResponse.json(
      { error: 'Unable to generate an experiment plan. Please try again with a narrower hypothesis.' },
      { status: 500 },
    );
  }
}
