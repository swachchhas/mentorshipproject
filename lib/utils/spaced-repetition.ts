// Spaced repetition algorithm for session scheduling

/**
 * Generate spaced repetition intervals based on timeframe.
 * Returns an array of day offsets from start date.
 * 
 * The algorithm uses expanding intervals following the Pimsleur/Leitner principle:
 * - Session 1: Day 0 (initial learning)
 * - Session 2: Day 1 (next day reinforcement)
 * - Session 3: Day 3 (short-term retention)
 * - Session 4: Day 7 (medium-term retention)
 * - Session 5: Day 14 (long-term retention)
 * - Session 6: Day 21 (mastery check)
 * - Session 7: Day 30 (final review)
 * 
 * Intervals are scaled proportionally to fit the user's timeframe.
 */
export function calculateSessionIntervals(
    timeframeDays: number,
    sessionsPerConcept: number
): number[] {
    // Base intervals (for a 30-day timeframe)
    const baseIntervals = [0, 1, 3, 7, 14, 21, 30];

    // Determine how many sessions we actually need
    const sessionCount = Math.min(sessionsPerConcept, baseIntervals.length);

    // Scale intervals to fit the timeframe
    const scaleFactor = timeframeDays / 30;

    const intervals = baseIntervals
        .slice(0, sessionCount)
        .map(day => Math.round(day * scaleFactor));

    // Ensure last interval doesn't exceed timeframe
    if (intervals.length > 0 && intervals[intervals.length - 1] > timeframeDays) {
        intervals[intervals.length - 1] = timeframeDays;
    }

    // Ensure all intervals are unique (can happen with short timeframes)
    const unique: number[] = [];
    intervals.forEach(interval => {
        if (unique.length === 0 || interval > unique[unique.length - 1]) {
            unique.push(interval);
        } else {
            unique.push(unique[unique.length - 1] + 1);
        }
    });

    return unique;
}

/**
 * Determine the session type based on its position in the sequence.
 */
export function getSessionType(
    sessionIndex: number,
    totalSessions: number
): 'initial' | 'reinforcement' | 'mixed-review' | 'final-review' {
    if (sessionIndex === 0) return 'initial';
    if (sessionIndex === 1) return 'reinforcement';
    if (sessionIndex === totalSessions - 1) return 'final-review';
    return 'mixed-review';
}

/**
 * Calculate next review date based on quiz performance.
 * Used after a completed session to adjust future scheduling.
 */
export function calculateNextReview(
    score: number,
    currentIntervalDays: number
): number {
    // High score → longer interval (confidence)
    // Low score → shorter interval (needs more review)
    if (score >= 90) return Math.round(currentIntervalDays * 2.5);
    if (score >= 80) return Math.round(currentIntervalDays * 2.0);
    if (score >= 70) return Math.round(currentIntervalDays * 1.5);
    if (score >= 60) return currentIntervalDays;
    return Math.max(1, Math.round(currentIntervalDays * 0.5));
}
