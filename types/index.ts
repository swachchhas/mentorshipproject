import { StudyPlan } from './ai';

export type Topic = {
    id: string;
    name: string;
    concepts: Concept[];
    level: 'beginner' | 'intermediate' | 'expert';
    industry?: string;
    focusArea?: string;
    retentionScore?: number; // Time-decayed overall score
    memoryScore: number; // Previous, simpler score
    lastPracticed: Date;
    nextReviewDate: Date;
    totalAttempts: number;
    studyPlan?: StudyPlan;
    scheduleId?: string;
};

export type Concept = {
    id: string;
    text: string;
    retentionScore?: number; // Time-decayed score for this concept
    status: 'strong' | 'weak' | 'neutral';
    familiar?: boolean; // User-marked familiarity
    aiGenerated?: boolean;
};

export type QuizQuestion = {
    id: string;
    conceptId: string;
    conceptName?: string;
    level?: 'basic' | 'advanced' | 'pitfall';
    question: string;
    type: 'mcq' | 'card' | 'short-answer';
    options?: string[];
    correctAnswer: string;
    explanation?: string;
    keywords?: string[];
    acceptableAnswers?: string[];
};

export type QuizResult = {
    topicId: string;
    score: number;
    correctCount: number;
    totalCount: number;
    weakConcepts: string[]; // ids of weak concepts
};
