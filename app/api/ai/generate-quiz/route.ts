import { NextRequest, NextResponse } from 'next/server';
import { callWithRetry } from '@/lib/ai/huggingface-client';
import { buildQuizPrompt } from '@/lib/ai/prompts/quiz-prompts';
import { parseQuizResponse } from '@/lib/ai/parsers/quiz-parser';
import { validateAndFilterQuestions } from '@/lib/ai/validators/quality-scorer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, concept, conceptId, topicId, level, count = 10 } = body;

        if (!topic || !concept || !conceptId || !topicId || !level) {
            return NextResponse.json(
                { questions: [], success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Build prompt and call AI
        const prompt = buildQuizPrompt(topic, concept, level, count);
        console.log('[generate-quiz] Calling HuggingFace for:', topic, concept, level);

        const response = await callWithRetry({
            prompt,
            maxTokens: 2000,
            temperature: 0.7,
        });

        if (!response.success) {
            console.warn('[generate-quiz] AI failed:', response.error);
            // Return fallback mock questions
            const fallbackQuestions = generateFallbackQuestions(topicId, conceptId, concept, level, count);
            return NextResponse.json({
                questions: fallbackQuestions,
                success: true,
                fallback: true,
            });
        }

        // Parse the response
        let questions = parseQuizResponse(response.text, topicId, conceptId, level, concept);

        if (questions.length === 0) {
            console.warn('[generate-quiz] Failed to parse questions, using fallback');
            const fallbackQuestions = generateFallbackQuestions(topicId, conceptId, concept, level, count);
            return NextResponse.json({
                questions: fallbackQuestions,
                success: true,
                fallback: true,
            });
        }

        // Validate and filter questions
        questions = validateAndFilterQuestions(questions);

        // If too few questions passed validation, supplement with fallback
        if (questions.length < Math.floor(count * 0.5)) {
            console.warn('[generate-quiz] Too few questions passed validation, supplementing');
            const fallbackCount = count - questions.length;
            const fallback = generateFallbackQuestions(topicId, conceptId, concept, level, fallbackCount);
            questions = [...questions, ...fallback];
        }

        console.log('[generate-quiz] Returning', questions.length, 'validated questions');
        return NextResponse.json({
            questions,
            success: true,
            fallback: false,
        });
    } catch (error) {
        console.error('[generate-quiz] Error:', error);
        return NextResponse.json(
            { questions: [], success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * Generate fallback quiz questions when AI fails.
 */
function generateFallbackQuestions(
    topicId: string,
    conceptId: string,
    concept: string,
    level: 'beginner' | 'intermediate' | 'expert',
    count: number
) {
    const questions = [];
    const mcqCount = Math.ceil(count * 0.6);
    const saCount = count - mcqCount;
    const now = new Date().toISOString();

    for (let i = 0; i < mcqCount; i++) {
        questions.push({
            id: `fallback-${conceptId}-mcq-${i}-${Date.now()}`,
            topicId,
            conceptId,
            conceptName: concept,
            type: 'mcq' as const,
            difficulty: level,
            question: getFallbackMCQQuestion(concept, i),
            options: getFallbackOptions(concept, i),
            correctAnswer: getFallbackOptions(concept, i)[0],
            explanation: `This tests your understanding of ${concept}.`,
            keywords: [concept.toLowerCase().split(' ')[0], 'concept', 'understanding'],
            validationScore: 75,
            aiGenerated: false,
            createdAt: now,
        });
    }

    for (let i = 0; i < saCount; i++) {
        questions.push({
            id: `fallback-${conceptId}-sa-${i}-${Date.now()}`,
            topicId,
            conceptId,
            conceptName: concept,
            type: 'short-answer' as const,
            difficulty: level,
            question: `Explain the key aspects of "${concept}" in your own words.`,
            correctAnswer: `${concept} is a fundamental concept that involves understanding and applying core principles effectively.`,
            explanation: `This tests your ability to articulate ${concept}.`,
            keywords: [concept.toLowerCase().split(' ')[0], 'explain', 'concept'],
            acceptableAnswers: [`${concept} involves key principles`, `Understanding ${concept}`],
            validationScore: 75,
            aiGenerated: false,
            createdAt: now,
        });
    }

    return questions;
}

function getFallbackMCQQuestion(concept: string, index: number): string {
    const templates = [
        `What is the primary purpose of "${concept}"?`,
        `Which of the following best describes "${concept}"?`,
        `When should you apply "${concept}" in practice?`,
        `What is a key characteristic of "${concept}"?`,
        `How does "${concept}" differ from related concepts?`,
        `What is the main benefit of understanding "${concept}"?`,
    ];
    return templates[index % templates.length];
}

function getFallbackOptions(concept: string, index: number): string[] {
    const optionSets = [
        [
            `To understand and apply ${concept} fundamentals`,
            `To replace all other methodologies`,
            `To complicate the development process`,
            `It has no practical purpose`,
        ],
        [
            `A systematic approach to ${concept}`,
            `An outdated technique`,
            `A purely theoretical concept`,
            `A random methodology`,
        ],
        [
            `When it solves a specific problem efficiently`,
            `Always, in every situation`,
            `Never, it's deprecated`,
            `Only in academic settings`,
        ],
        [
            `It provides structured problem-solving capabilities`,
            `It makes code run slower`,
            `It increases complexity unnecessarily`,
            `It has no real-world applications`,
        ],
        [
            `It focuses on specific aspects while related concepts cover broader areas`,
            `There is no difference`,
            `It's always better than alternatives`,
            `It's always worse than alternatives`,
        ],
        [
            `It enables more effective and efficient solutions`,
            `It has no benefits`,
            `It only works in specific programming languages`,
            `It requires expensive tools`,
        ],
    ];
    return optionSets[index % optionSets.length];
}
