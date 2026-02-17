export type Topic = {
    id: string;
    name: string;
    concepts: Concept[];
    level: 'beginner' | 'intermediate' | 'expert';
    memoryScore: number; // 0-100
    lastPracticed: Date;
    nextReviewDate: Date;
    totalAttempts: number;
};

export type Concept = {
    id: string;
    text: string;
    status: 'strong' | 'weak' | 'neutral';
    familiar?: boolean; // User-marked familiarity
};

export type QuizQuestion = {
    id: string;
    conceptId: string;
    level?: 'basic' | 'advanced' | 'pitfall';
    question: string;
    type: 'mcq' | 'card';
    options?: string[];
    correctAnswer: string;
    explanation?: string;
};

export type QuizResult = {
    topicId: string;
    score: number;
    correctCount: number;
    totalCount: number;
    weakConcepts: string[]; // ids of weak concepts
};
