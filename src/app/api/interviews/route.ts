import { NextResponse } from 'next/server';

const INTERVIEWS_URL =
  'https://script.google.com/macros/s/AKfycbxd9xq3aJVeoJOVHNYAUZu1PRuC5Rx8cN8TF5VJoSJ9GVd5fJ7kImo6zTUJDfjZAQvs/exec';

export async function GET() {
  try {
    const url = new URL(INTERVIEWS_URL);
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString(), { cache: 'no-store' });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Interview sheet returned HTTP ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();

    return NextResponse.json({
      interviewSettings: Array.isArray(data?.interviewSettings)
        ? data.interviewSettings
        : [],
      questions: Array.isArray(data?.questions) ? data.questions : [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load interview data';

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
