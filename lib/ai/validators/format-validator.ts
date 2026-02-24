// Format validator for AI-generated quiz questions

import { AIGeneratedQuestion, ValidationResult } from '@/types/ai';

/**
 * Validate that a question has all required fields and proper format.
 */
export function validateQuestionFormat(question: AIGeneratedQuestion): ValidationResult {
    const issues: string[] = [];
    const warnings: string[] = [];

    // Required field checks
    if (!question.question || question.question.trim().length === 0) {
        issues.push('Question text is empty');
    }

    if (!question.correctAnswer || question.correctAnswer.trim().length === 0) {
        issues.push('Correct answer is missing');
    }

    if (!question.explanation || question.explanation.trim().length < 20) {
        issues.push('Explanation is missing or too short (min 20 chars)');
    }

    if (!question.keywords || question.keywords.length < 2) {
        warnings.push('Keywords array should have at least 3 items');
    }

    // MCQ-specific validation
    if (question.type === 'mcq') {
        if (!question.options || question.options.length !== 4) {
            issues.push('MCQ must have exactly 4 options');
        } else {
            // Check correct answer is among options
            if (!question.options.includes(question.correctAnswer)) {
                issues.push('Correct answer does not match any option');
            }

            // Check for duplicate options
            const uniqueOptions = new Set(question.options.map(o => o.toLowerCase()));
            if (uniqueOptions.size !== question.options.length) {
                warnings.push('MCQ has duplicate options');
            }
        }
    }

    // Short-answer specific
    if (question.type === 'short-answer') {
        if (!question.acceptableAnswers || question.acceptableAnswers.length === 0) {
            warnings.push('Short-answer should have acceptable answer variations');
        }
    }

    // Question quality checks
    if (question.question && question.question.length > 300) {
        warnings.push('Question text is very long (>300 chars)');
    }

    const isValid = issues.length === 0;

    return {
        isValid,
        score: 0, // Will be set by quality scorer
        issues,
        warnings,
        flagForReview: false,
    };
}
