// Parser for AI-generated quiz questions

import { AIGeneratedQuestion } from '@/types/ai';

interface RawQuestion {
    type?: string;
    question?: string;
    options?: string[];
    correctAnswer?: string;
    explanation?: string;
    keywords?: string[];
    acceptableAnswers?: string[];
}

/**
 * Parse AI response text into structured quiz question objects.
 * Attempts JSON parsing, then falls back to extraction.
 */
export function parseQuizResponse(
    responseText: string,
    topicId: string,
    conceptId: string,
    level: 'beginner' | 'intermediate' | 'expert',
    conceptName?: string
): AIGeneratedQuestion[] {
    const trimmed = responseText.trim();
    let rawQuestions: RawQuestion[] = [];

    // Try JSON array extraction
    try {
        const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            rawQuestions = JSON.parse(jsonMatch[0]);
        }
    } catch {
        // Try to find individual JSON objects
        try {
            const objectMatches = trimmed.match(/\{[\s\S]*?\}/g);
            if (objectMatches) {
                rawQuestions = objectMatches
                    .map(m => {
                        try { return JSON.parse(m); } catch { return null; }
                    })
                    .filter((q): q is RawQuestion => q !== null);
            }
        } catch {
            // No valid JSON found
        }
    }

    if (!Array.isArray(rawQuestions)) {
        return [];
    }

    // Transform and validate each question
    const questions: AIGeneratedQuestion[] = [];

    rawQuestions.forEach((raw, index) => {
        if (!raw.question || !raw.correctAnswer) return;

        const questionType = raw.type === 'short-answer' ? 'short-answer' : 'mcq';
        const now = new Date().toISOString();

        const question: AIGeneratedQuestion = {
            id: `ai-${topicId}-${conceptId}-${index}-${Date.now()}`,
            topicId,
            conceptId,
            conceptName: conceptName,
            type: questionType as 'mcq' | 'short-answer',
            difficulty: level,
            question: String(raw.question).trim(),
            correctAnswer: String(raw.correctAnswer).trim(),
            explanation: String(raw.explanation || 'No explanation provided.').trim(),
            keywords: Array.isArray(raw.keywords)
                ? raw.keywords.map(k => String(k).trim())
                : [],
            validationScore: 0, // Will be set by validator
            aiGenerated: true,
            createdAt: now,
        };

        // MCQ-specific fields
        if (questionType === 'mcq') {
            if (Array.isArray(raw.options) && raw.options.length >= 4) {
                question.options = raw.options.slice(0, 4).map(o => String(o).trim());
                // Ensure correctAnswer matches one of the options
                if (!question.options.includes(question.correctAnswer)) {
                    // Try case-insensitive match
                    const match = question.options.find(
                        o => o.toLowerCase() === question.correctAnswer.toLowerCase()
                    );
                    if (match) {
                        question.correctAnswer = match;
                    } else {
                        // Replace first wrong option with correct answer
                        question.options[0] = question.correctAnswer;
                    }
                }
            } else {
                // Invalid MCQ, skip
                return;
            }
        }

        // Short-answer specific fields
        if (questionType === 'short-answer') {
            question.acceptableAnswers = Array.isArray(raw.acceptableAnswers)
                ? raw.acceptableAnswers.map(a => String(a).trim())
                : [];
        }

        questions.push(question);
    });

    return questions;
}
