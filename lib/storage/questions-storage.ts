// localStorage-based storage for AI-generated quiz questions

import { AIGeneratedQuestion } from '@/types/ai';

const QUESTIONS_KEY = 'learning-retention-questions';

export const questionsStorage = {
    /**
     * Get all stored questions.
     */
    getQuestions: (): AIGeneratedQuestion[] => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(QUESTIONS_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    },

    /**
     * Get questions for a specific topic.
     */
    getQuestionsForTopic: (topicId: string): AIGeneratedQuestion[] => {
        return questionsStorage.getQuestions().filter(q => q.topicId === topicId);
    },

    /**
     * Get questions for a specific concept.
     */
    getQuestionsForConcept: (topicId: string, conceptId: string): AIGeneratedQuestion[] => {
        return questionsStorage.getQuestions().filter(
            q => q.topicId === topicId && q.conceptId === conceptId
        );
    },

    /**
     * Get questions for a session (by concept IDs and count).
     */
    getQuestionsForSession: (
        topicId: string,
        conceptIds: string[],
        count: number
    ): AIGeneratedQuestion[] => {
        const allQuestions = questionsStorage.getQuestions().filter(
            q => q.topicId === topicId && conceptIds.includes(q.conceptId)
        );

        // Shuffle and pick the requested count
        const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count);
    },

    /**
     * Save questions (appends to existing, avoids duplicates by ID).
     */
    saveQuestions: (questions: AIGeneratedQuestion[]): void => {
        if (typeof window === 'undefined') return;
        const existing = questionsStorage.getQuestions();
        const existingIds = new Set(existing.map(q => q.id));

        const newQuestions = questions.filter(q => !existingIds.has(q.id));
        const combined = [...existing, ...newQuestions];

        localStorage.setItem(QUESTIONS_KEY, JSON.stringify(combined));
    },

    /**
     * Delete all questions for a topic.
     */
    deleteQuestionsForTopic: (topicId: string): void => {
        if (typeof window === 'undefined') return;
        const questions = questionsStorage.getQuestions();
        const filtered = questions.filter(q => q.topicId !== topicId);
        localStorage.setItem(QUESTIONS_KEY, JSON.stringify(filtered));
    },

    /**
     * Delete questions for a specific concept.
     */
    deleteQuestionsForConcept: (topicId: string, conceptId: string): void => {
        if (typeof window === 'undefined') return;
        const questions = questionsStorage.getQuestions();
        const filtered = questions.filter(q => !(q.topicId === topicId && q.conceptId === conceptId));
        localStorage.setItem(QUESTIONS_KEY, JSON.stringify(filtered));
    },

    /**
     * Check if questions exist for a topic.
     */
    hasQuestionsForTopic: (topicId: string): boolean => {
        return questionsStorage.getQuestionsForTopic(topicId).length > 0;
    },

    /**
     * Get question count by concept for a topic.
     */
    getQuestionCountByConcept: (topicId: string): Record<string, number> => {
        const questions = questionsStorage.getQuestionsForTopic(topicId);
        const counts: Record<string, number> = {};
        questions.forEach(q => {
            counts[q.conceptId] = (counts[q.conceptId] || 0) + 1;
        });
        return counts;
    },
};
