import { NextResponse } from 'next/server';
import { GeminiProcessor } from '@/lib/gemini';
import { type NewsItem } from '@/lib/analyzer';

export async function POST(request: Request) {
    try {
        const { items } = await request.json();

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Invalid items provided' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'Gemini API Key not configured' }, { status: 500 });
        }

        const gemini = new GeminiProcessor();
        const analysis = await gemini.analyzeCluster(items as NewsItem[]);

        return NextResponse.json({ analysis });

    } catch (error: any) {
        console.error("Analyze API Error:", error);
        return NextResponse.json({ error: 'Failed to analyze cluster' }, { status: 500 });
    }
}
