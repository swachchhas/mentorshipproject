import { QuizAttempt } from '@/lib/storage/quiz-history-storage';
import { Topic, Concept } from '@/types';

/**
 * Calculates a time-decayed score based on past attempts.
 * The most recent attempts carry the most weight. Over time, the score
 * decays according to an exponential decay formula.
 * 
 * Formula: decayed_score = base_score * e^(-elapsed_days / half_life_days)
 */

interface DecayConfig {
    halfLifeDays: number;
}

const LEVEL_CONFIGS: Record<string, DecayConfig> = {
    beginner: { halfLifeDays: 3 },      // Forgets quickly
    intermediate: { halfLifeDays: 7 },  // Retains moderately
    expert: { halfLifeDays: 14 }        // Retains longer
};

export const retentionCalculator = {

    /**
     * Calculates the time-decayed score for a specific concept based on its history.
     */
    calculateConceptScore: (conceptId: string, history: QuizAttempt[], topicLevel: string = 'beginner'): number => {
        const config = LEVEL_CONFIGS[topicLevel] || LEVEL_CONFIGS.beginner;
        const now = new Date().getTime();

        // Get all attempts that include this concept
        const conceptAttempts = history.filter(h =>
            h.conceptBreakdown.some(cb => cb.conceptId === conceptId)
        );

        if (conceptAttempts.length === 0) return 0;

        let totalWeightedScore = 0;
        let totalWeight = 0;

        conceptAttempts.forEach(attempt => {
            const conceptData = attempt.conceptBreakdown.find(cb => cb.conceptId === conceptId);
            if (!conceptData) return;

            const attemptDate = new Date(attempt.completedAt).getTime();
            const daysElapsed = (now - attemptDate) / (1000 * 60 * 60 * 24);

            // Calculate weight based on exponential decay
            // Math.exp(-lambda * t) where lambda = ln(2) / halfLife
            const lambda = Math.LN2 / config.halfLifeDays;
            const weight = Math.exp(-lambda * daysElapsed);

            totalWeightedScore += conceptData.score * weight;
            totalWeight += weight;
        });

        if (totalWeight === 0) return 0;

        return Math.round(totalWeightedScore / totalWeight);
    },

    /**
     * Calculates the overall time-decayed score for a Topic.
     * It is an average of the time-decayed scores of all its concepts.
     */
    calculateTopicScore: (topic: Topic, history: QuizAttempt[]): number => {
        if (topic.concepts.length === 0 || history.length === 0) return 0;

        let totalScore = 0;
        let conceptsWithScore = 0;

        topic.concepts.forEach(concept => {
            const conceptScore = retentionCalculator.calculateConceptScore(concept.id, history, topic.level);
            // Only include concepts that have been tested at least once
            const hasHistory = history.some(h => h.conceptBreakdown.some(cb => cb.conceptId === concept.id));
            if (hasHistory) {
                totalScore += conceptScore;
                conceptsWithScore++;
            }
        });

        if (conceptsWithScore === 0) return 0;

        return Math.round(totalScore / conceptsWithScore);
    }
};
