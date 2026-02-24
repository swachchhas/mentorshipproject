// Schedule calculator — maps user preferences to session parameters

/**
 * Calculate questions per session based on daily time commitment.
 * Assumes ~30 seconds per MCQ, ~60 seconds per short-answer.
 * Average: ~45 seconds per question.
 */
export function calculateQuestionsPerSession(dailyMinutes: number): number {
    const questionsMap: Record<number, number> = {
        5: 3,
        10: 5,
        15: 8,
        30: 15,
        60: 30,
    };

    return questionsMap[dailyMinutes] || Math.max(3, Math.round(dailyMinutes / 2));
}

/**
 * Calculate how many review sessions each concept should have
 * based on timeframe and number of concepts.
 */
export function calculateSessionsPerConcept(
    timeframeDays: number,
    conceptCount: number,
    dailyMinutes: number
): number {
    // Total available sessions = timeframeDays (one per day max)
    // Distribute across concepts with spaced repetition
    const totalSessions = timeframeDays;
    const sessionsPerConcept = Math.floor(totalSessions / conceptCount);

    // Cap at 7 sessions per concept (the spaced repetition optimal)
    return Math.min(7, Math.max(3, sessionsPerConcept));
}

/**
 * Map timeframe string to number of days.
 */
export function timeframeToDays(timeframe: string): number {
    const mapping: Record<string, number> = {
        '1 week': 7,
        '2 weeks': 14,
        '3 weeks': 21,
        '1 month': 30,
        '3 months': 90,
    };

    return mapping[timeframe] || 21; // Default 3 weeks
}

/**
 * Format a date as YYYY-MM-DD string.
 */
export function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Add days to a date and return new Date.
 */
export function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
