import { NextRequest, NextResponse } from 'next/server';
import { StudySchedule, ScheduleSession } from '@/types/ai';
import { calculateSessionIntervals, getSessionType } from '@/lib/utils/spaced-repetition';
import { calculateQuestionsPerSession, calculateSessionsPerConcept, formatDate, addDays } from '@/lib/utils/schedule-calculator';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topicId, concepts, timeframeDays, dailyMinutes } = body;

        if (!topicId || !concepts || !timeframeDays || !dailyMinutes) {
            return NextResponse.json(
                { schedule: null, success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Calculate session parameters
        const questionsPerSession = calculateQuestionsPerSession(dailyMinutes);
        const sessionsPerConcept = calculateSessionsPerConcept(
            timeframeDays,
            concepts.length,
            dailyMinutes
        );

        // Generate intervals using spaced repetition
        const intervals = calculateSessionIntervals(timeframeDays, sessionsPerConcept);

        const startDate = new Date();
        const sessions: ScheduleSession[] = [];
        let sessionCounter = 0;

        // Create sessions for each concept at spaced intervals
        concepts.forEach((concept: { id: string; name: string }, conceptIndex: number) => {
            intervals.forEach((dayOffset, intervalIndex) => {
                // Stagger concepts so they don't all fall on the same day
                const staggerDays = conceptIndex;
                const actualDayOffset = Math.min(dayOffset + staggerDays, timeframeDays);
                const sessionDate = addDays(startDate, actualDayOffset);

                // Check if a session already exists on this date (for interleaving)
                const dateStr = formatDate(sessionDate);
                const existingSession = sessions.find(s => s.date === dateStr);

                if (existingSession) {
                    // Add concept to existing session (interleave)
                    if (!existingSession.conceptIds.includes(concept.id)) {
                        existingSession.conceptIds.push(concept.id);
                        existingSession.type = 'mixed-review';
                        // Slightly increase question count for multi-concept sessions
                        existingSession.questionCount = Math.min(
                            questionsPerSession + 2,
                            existingSession.questionCount + 2
                        );
                    }
                } else {
                    // Create new session
                    sessionCounter++;
                    sessions.push({
                        id: `session-${topicId}-${sessionCounter}-${Date.now()}`,
                        date: dateStr,
                        conceptIds: [concept.id],
                        type: getSessionType(intervalIndex, intervals.length),
                        questionCount: questionsPerSession,
                        estimatedMinutes: dailyMinutes,
                        completed: false,
                        result: null,
                    });
                }
            });
        });

        // Sort sessions by date
        sessions.sort((a, b) => a.date.localeCompare(b.date));

        const schedule: StudySchedule = {
            id: `schedule-${topicId}-${Date.now()}`,
            topicId,
            sessions,
            createdAt: new Date().toISOString(),
        };

        console.log(
            '[generate-schedule] Created schedule with',
            sessions.length,
            'sessions over',
            timeframeDays,
            'days'
        );

        return NextResponse.json({
            schedule,
            success: true,
        });
    } catch (error) {
        console.error('[generate-schedule] Error:', error);
        return NextResponse.json(
            { schedule: null, success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
