// Quality scorer for AI-generated quiz questions

import { AIGeneratedQuestion, ValidationResult } from '@/types/ai';
import { validateQuestionFormat } from './format-validator';

/**
 * Score a question on a 0-100 scale based on multiple quality factors.
 * Returns full validation result with score, issues, and review flag.
 */
export function scoreQuestion(question: AIGeneratedQuestion): ValidationResult {
    const formatResult = validateQuestionFormat(question);

    // If format is invalid, score is 0
    if (!formatResult.isValid) {
        return {
            ...formatResult,
            score: 0,
            flagForReview: false,
        };
    }

    let score = 100;
    const warnings = [...formatResult.warnings];

    // === Clarity (max -20) ===
    // Penalize overly long questions
    if (question.question.length > 200) {
        score -= 10;
        warnings.push('Question is somewhat long');
    }
    if (question.question.length > 300) {
        score -= 10;
    }

    // === Completeness (max -20) ===
    if (!question.explanation || question.explanation.length < 20) {
        score -= 15;
    } else if (question.explanation.length < 50) {
        score -= 5;
    }

    if (!question.keywords || question.keywords.length < 3) {
        score -= 5;
    }

    // === Keyword Quality (max -15) ===
    if (question.keywords && question.keywords.length > 0) {
        // Check if keywords are actually relevant (appear in question or answer)
        const combinedText = `${question.question} ${question.correctAnswer} ${question.explanation}`.toLowerCase();
        const relevantKeywords = question.keywords.filter(k =>
            combinedText.includes(k.toLowerCase())
        );
        const relevanceRatio = relevantKeywords.length / question.keywords.length;
        if (relevanceRatio < 0.5) {
            score -= 10;
            warnings.push('Less than half of keywords appear in question/answer text');
        }
    }

    // === Explanation Quality (max -15) ===
    const badExplanations = [
        'this is correct',
        'the answer is',
        'because it is',
        'that is the right answer',
    ];
    if (question.explanation) {
        const lower = question.explanation.toLowerCase();
        if (badExplanations.some(bad => lower.includes(bad) && lower.length < 40)) {
            score -= 15;
            warnings.push('Explanation is generic and unhelpful');
        }
    }

    // === MCQ Option Quality (max -15) ===
    if (question.type === 'mcq' && question.options) {
        // Check if options are too similar
        const optionLengths = question.options.map(o => o.length);
        const avgLen = optionLengths.reduce((a, b) => a + b, 0) / optionLengths.length;
        if (avgLen < 5) {
            score -= 10;
            warnings.push('MCQ options are very short');
        }

        // Check if any option is "none of the above" or similar
        const weakOptions = question.options.filter(o =>
            /none of the above|all of the above|both a and b/i.test(o)
        );
        if (weakOptions.length > 0) {
            score -= 5;
            warnings.push('MCQ contains weak option types');
        }
    }

    // Determine action based on score
    const flagForReview = score >= 70 && score < 85;

    return {
        isValid: true,
        score: Math.max(0, score),
        issues: formatResult.issues,
        warnings,
        flagForReview,
    };
}

/**
 * Validate and score an array of questions.
 * Returns only questions with score >= 70.
 */
export function validateAndFilterQuestions(
    questions: AIGeneratedQuestion[]
): AIGeneratedQuestion[] {
    return questions
        .map(q => {
            const result = scoreQuestion(q);
            return { ...q, validationScore: result.score };
        })
        .filter(q => q.validationScore >= 70);
}
