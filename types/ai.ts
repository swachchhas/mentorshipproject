// AI-related types for concept generation, quiz generation, scheduling

// === Concept Generation ===
export interface ConceptGenerationRequest {
    topic: string;
    level: 'beginner' | 'intermediate' | 'expert';
}

export interface ConceptGenerationResponse {
    concepts: string[];
    success: boolean;
    error?: string;
}

// === Quiz Generation ===
export interface QuizGenerationRequest {
    topic: string;
    concept: string;
    level: 'beginner' | 'intermediate' | 'expert';
    count?: number; // default 10
}

export interface QuizGenerationResponse {
    questions: AIGeneratedQuestion[];
    success: boolean;
    error?: string;
}

export interface AIGeneratedQuestion {
    id: string;
    topicId: string;
    conceptId: string;
    conceptName?: string;
    type: 'mcq' | 'short-answer';
    difficulty: 'beginner' | 'intermediate' | 'expert';
    question: string;
    options?: string[];          // MCQ only, exactly 4
    correctAnswer: string;
    explanation: string;
    keywords: string[];
    acceptableAnswers?: string[]; // short-answer only
    validationScore: number;
    aiGenerated: boolean;
    createdAt: string;
}

// === Schedule Generation ===
export interface ScheduleGenerationRequest {
    topicId: string;
    concepts: { id: string; name: string }[];
    timeframeDays: number;
    dailyMinutes: number;
}

export interface ScheduleGenerationResponse {
    schedule: StudySchedule;
    success: boolean;
    error?: string;
}

export interface StudySchedule {
    id: string;
    topicId: string;
    sessions: ScheduleSession[];
    createdAt: string;
}

export interface ScheduleSession {
    id: string;
    date: string;                // YYYY-MM-DD
    conceptIds: string[];
    type: 'initial' | 'reinforcement' | 'mixed-review' | 'final-review';
    questionCount: number;
    estimatedMinutes: number;
    completed: boolean;
    result: SessionResult | null;
}

export interface SessionResult {
    score: number;
    correctCount: number;
    totalCount: number;
    completedAt: string;
}

// === Validation ===
export interface ValidationResult {
    isValid: boolean;
    score: number;
    issues: string[];
    warnings: string[];
    flagForReview: boolean;
}

// === Study Plan (stored on Topic) ===
export interface StudyPlan {
    selectedTimeframe: string;     // "1 week", "2 weeks", etc.
    timeframeDays: number;
    dailyMinutes: number;
    targetDate: string;            // ISO date string
    questionsPerSession: number;
}
