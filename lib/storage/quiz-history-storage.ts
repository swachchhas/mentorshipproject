import { QuizResult } from '@/types';

export interface QuizAttempt {
    id: string; // Unique ID for this attempt Date.now().toString()
    topicId: string;
    sessionId?: string; // Optional linkage to an AI schedule session
    type: 'topic' | 'concept'; // Topic quiz (mixed) or Concept quiz (deep dive)
    targetConceptId?: string; // If 'concept' quiz, which concept it targeted
    score: number; // Overall percentage 0-100
    correctCount: number;
    totalCount: number;
    completedAt: string; // ISO date string
    durationSeconds?: number; // How long it took

    // Detailed breakdown per question
    questions: {
        questionId: string;
        conceptId: string;
        conceptName?: string;
        isCorrect: boolean;
        userAnswer: string;
        correctAnswer: string;
        timeSpentSeconds?: number;
    }[];

    // Breakdown of performance per concept in this attempt
    conceptBreakdown: {
        conceptId: string;
        conceptName?: string;
        correctCount: number;
        totalCount: number;
        score: number; // percentage for this specific concept in this quiz
    }[];
}

const STORAGE_KEY = 'learning_loop_quiz_history';

export const quizHistoryStorage = {
    // Get all history across all topics
    getAllHistory: (): QuizAttempt[] => {
        if (typeof window === 'undefined') return [];
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw);
        } catch (e) {
            console.error('Failed to parse quiz history', e);
            return [];
        }
    },

    // Get history for a specific topic, sorted newest first
    getHistoryForTopic: (topicId: string): QuizAttempt[] => {
        const history = quizHistoryStorage.getAllHistory();
        return history
            .filter(h => h.topicId === topicId)
            .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    },

    // Get history for a specific concept, sorted newest first
    getHistoryForConcept: (topicId: string, conceptId: string): QuizAttempt[] => {
        const topicHistory = quizHistoryStorage.getHistoryForTopic(topicId);
        // Find quizzes that either explicitly target this concept, or include questions for it
        return topicHistory.filter(h =>
            h.targetConceptId === conceptId ||
            h.conceptBreakdown.some(b => b.conceptId === conceptId)
        );
    },

    // Save a new attempt
    saveAttempt: (attempt: QuizAttempt): void => {
        if (typeof window === 'undefined') return;
        const history = quizHistoryStorage.getAllHistory();
        history.push(attempt);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    },

    // Delete history for a topic (e.g., when a topic is deleted)
    deleteHistoryForTopic: (topicId: string): void => {
        if (typeof window === 'undefined') return;
        const history = quizHistoryStorage.getAllHistory();
        const filtered = history.filter(h => h.topicId !== topicId);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
};
