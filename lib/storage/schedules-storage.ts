// localStorage-based storage for study schedules

import { StudySchedule, ScheduleSession, SessionResult } from '@/types/ai';

const SCHEDULES_KEY = 'learning-retention-schedules';

export const schedulesStorage = {
    /**
     * Get all schedules from localStorage.
     */
    getSchedules: (): StudySchedule[] => {
        if (typeof window === 'undefined') return [];
        const data = localStorage.getItem(SCHEDULES_KEY);
        if (!data) return [];
        try {
            return JSON.parse(data);
        } catch {
            return [];
        }
    },

    /**
     * Get schedule for a specific topic.
     */
    getScheduleForTopic: (topicId: string): StudySchedule | null => {
        const schedules = schedulesStorage.getSchedules();
        return schedules.find(s => s.topicId === topicId) || null;
    },

    /**
     * Get schedule by ID.
     */
    getScheduleById: (scheduleId: string): StudySchedule | null => {
        const schedules = schedulesStorage.getSchedules();
        return schedules.find(s => s.id === scheduleId) || null;
    },

    /**
     * Save a new schedule (replaces existing for same topic).
     */
    saveSchedule: (schedule: StudySchedule): void => {
        if (typeof window === 'undefined') return;
        const schedules = schedulesStorage.getSchedules();
        const filtered = schedules.filter(s => s.topicId !== schedule.topicId);
        filtered.push(schedule);
        localStorage.setItem(SCHEDULES_KEY, JSON.stringify(filtered));
    },

    /**
     * Get all sessions scheduled for today across all topics.
     */
    getTodaysSessions: (): { schedule: StudySchedule; session: ScheduleSession }[] => {
        const schedules = schedulesStorage.getSchedules();
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const results: { schedule: StudySchedule; session: ScheduleSession }[] = [];

        schedules.forEach(schedule => {
            schedule.sessions.forEach(session => {
                if (session.date === today && !session.completed) {
                    results.push({ schedule, session });
                }
            });
        });

        return results;
    },

    /**
     * Get upcoming sessions (next 7 days) across all topics.
     */
    getUpcomingSessions: (days: number = 7): { schedule: StudySchedule; session: ScheduleSession }[] => {
        const schedules = schedulesStorage.getSchedules();
        const today = new Date();
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + days);

        const todayStr = today.toISOString().split('T')[0];
        const futureStr = futureDate.toISOString().split('T')[0];

        const results: { schedule: StudySchedule; session: ScheduleSession }[] = [];

        schedules.forEach(schedule => {
            schedule.sessions.forEach(session => {
                if (session.date >= todayStr && session.date <= futureStr && !session.completed) {
                    results.push({ schedule, session });
                }
            });
        });

        return results.sort((a, b) => a.session.date.localeCompare(b.session.date));
    },

    /**
     * Mark a session as completed with results.
     */
    markSessionComplete: (
        scheduleId: string,
        sessionId: string,
        result: SessionResult
    ): void => {
        const schedules = schedulesStorage.getSchedules();
        const schedule = schedules.find(s => s.id === scheduleId);
        if (!schedule) return;

        const session = schedule.sessions.find(s => s.id === sessionId);
        if (!session) return;

        session.completed = true;
        session.result = result;

        if (typeof window !== 'undefined') {
            localStorage.setItem(SCHEDULES_KEY, JSON.stringify(schedules));
        }
    },

    /**
     * Get progress stats for a schedule.
     */
    getScheduleProgress: (scheduleId: string): { completed: number; total: number; percentage: number } => {
        const schedule = schedulesStorage.getScheduleById(scheduleId);
        if (!schedule) return { completed: 0, total: 0, percentage: 0 };

        const total = schedule.sessions.length;
        const completed = schedule.sessions.filter(s => s.completed).length;
        return {
            completed,
            total,
            percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    },

    /**
     * Delete schedule for a topic.
     */
    deleteSchedule: (topicId: string): void => {
        if (typeof window === 'undefined') return;
        const schedules = schedulesStorage.getSchedules();
        const filtered = schedules.filter(s => s.topicId !== topicId);
        localStorage.setItem(SCHEDULES_KEY, JSON.stringify(filtered));
    },
};
