import { NextRequest, NextResponse } from 'next/server';
import { callWithRetry } from '@/lib/ai/huggingface-client';
import { buildConceptPrompt, getFallbackConcepts } from '@/lib/ai/prompts/concept-prompts';
import { parseConceptResponse } from '@/lib/ai/parsers/concept-parser';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, level } = body;

        if (!topic || !level) {
            return NextResponse.json(
                { concepts: [], success: false, error: 'Missing topic or level' },
                { status: 400 }
            );
        }

        // Build prompt and call AI
        const prompt = buildConceptPrompt(topic, level);
        console.log('[generate-concepts] Calling HuggingFace for:', topic, level);

        const response = await callWithRetry({ prompt, maxTokens: 500, temperature: 0.7 });

        if (!response.success) {
            console.warn('[generate-concepts] AI failed, using fallback:', response.error);
            return NextResponse.json({
                concepts: getFallbackConcepts(topic, level),
                success: true,
                fallback: true,
            });
        }

        // Parse the response
        const concepts = parseConceptResponse(response.text);

        if (concepts.length === 0) {
            console.warn('[generate-concepts] Failed to parse concepts, using fallback');
            return NextResponse.json({
                concepts: getFallbackConcepts(topic, level),
                success: true,
                fallback: true,
            });
        }

        console.log('[generate-concepts] Generated', concepts.length, 'concepts');
        return NextResponse.json({
            concepts,
            success: true,
            fallback: false,
        });
    } catch (error) {
        console.error('[generate-concepts] Error:', error);
        return NextResponse.json(
            { concepts: [], success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
