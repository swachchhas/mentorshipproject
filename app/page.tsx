'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Brain, Clock, Plus, Calendar, BookOpen } from 'lucide-react';
import { schedulesStorage } from '@/lib/storage/schedules-storage';
import { questionsStorage } from '@/lib/storage/questions-storage';
import { ScheduleSession, StudySchedule } from '@/types/ai';

interface DueSession {
  topic: Topic;
  schedule: StudySchedule;
  session: ScheduleSession;
  questionCount: number;
}

export default function Home() {
  const router = useRouter();
  const [dueSessions, setDueSessions] = useState<DueSession[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<DueSession[]>([]);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);

  useEffect(() => {
    const allTopics = storage.getTopics();

    // Get today's due sessions from real schedules
    const todaysSessions = schedulesStorage.getTodaysSessions();
    const formattedDue: DueSession[] = todaysSessions
      .map(({ schedule, session }) => {
        const topic = allTopics.find(t => t.id === schedule.topicId);
        if (!topic) return null;
        const questionCount = questionsStorage.getQuestionsForSession(
          topic.id,
          session.conceptIds,
          session.questionCount
        ).length;
        return { topic, schedule, session, questionCount };
      })
      .filter((s): s is DueSession => s !== null);

    // Get upcoming sessions (next 7 days, excluding today)
    const upcoming = schedulesStorage.getUpcomingSessions(7);
    const formattedUpcoming: DueSession[] = upcoming
      .filter(({ session }) => {
        const today = new Date().toISOString().split('T')[0];
        return session.date !== today;
      })
      .slice(0, 4)
      .map(({ schedule, session }) => {
        const topic = allTopics.find(t => t.id === schedule.topicId);
        if (!topic) return null;
        return { topic, schedule, session, questionCount: session.questionCount };
      })
      .filter((s): s is DueSession => s !== null);

    // Also add topics with old-style nextReviewDate (backward compat)
    const now = new Date();
    const oldStyleDue = allTopics.filter(t => {
      if (!t.nextReviewDate) return false;
      // Skip if already has a schedule-based session
      if (todaysSessions.some(s => s.schedule.topicId === t.id)) return false;
      return new Date(t.nextReviewDate) <= now;
    });

    const oldStyleSessions: DueSession[] = oldStyleDue.map(topic => ({
      topic,
      schedule: { id: '', topicId: topic.id, sessions: [], createdAt: '' },
      session: {
        id: 'legacy-' + topic.id,
        date: new Date().toISOString().split('T')[0],
        conceptIds: topic.concepts.map(c => c.id),
        type: 'mixed-review' as const,
        questionCount: 5,
        estimatedMinutes: 10,
        completed: false,
        result: null,
      },
      questionCount: 5,
    }));

    setDueSessions([...formattedDue, ...oldStyleSessions]);
    setUpcomingSessions(formattedUpcoming);

    const recent = allTopics
      .sort((a, b) => new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime())
      .slice(0, 4);
    setRecentTopics(recent);
  }, []);

  const handleStartLearning = () => {
    router.push('/add-topic');
  };

  const getConceptNames = (topic: Topic, conceptIds: string[]): string => {
    return conceptIds
      .map(id => topic.concepts.find(c => c.id === id)?.text || 'Unknown')
      .slice(0, 2)
      .join(', ') + (conceptIds.length > 2 ? ` +${conceptIds.length - 2}` : '');
  };

  return (
    <div className="min-h-screen bg-background dot-grid relative">
      {/* Profile/Settings */}
      <div className="absolute top-6 right-6">
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-background/50 hover:bg-muted">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            U
          </div>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 space-y-12 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center space-y-6 animate-fade-in max-w-2xl">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
            What did you <span className="text-primary">learn</span> today?
          </h1>
          <p className="text-xl text-muted-foreground font-light">
            Capture it now. Remember it forever.
          </p>
        </div>

        {/* Add Topic Button */}
        <div className="w-full max-w-md animate-slide-up delay-100">
          <Button
            onClick={handleStartLearning}
            size="lg"
            className="w-full h-16 text-xl rounded-full shadow-lg hover:shadow-xl transition-all group"
          >
            <Plus className="mr-2 h-6 w-6 group-hover:rotate-90 transition-transform" />
            Add a new topic
          </Button>
        </div>

        {/* Dashboard Widgets */}
        <div className="grid md:grid-cols-2 gap-6 w-full animate-slide-up delay-200 opacity-0 fill-mode-forwards" style={{ animationFillMode: 'forwards' }}>
          {/* Due for Review — Real schedule-based */}
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-xs font-semibold pl-1">
                <Brain className="w-3 h-3" /> Due for Review ({dueSessions.length})
              </div>
              {dueSessions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                  <p className="text-primary font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">Great job. Go learn something new.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {dueSessions.slice(0, 3).map(({ topic, session }) => (
                    <button
                      key={session.id}
                      onClick={() => router.push(`/learn/${topic.id}?session=${session.id}`)}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-l-4 border-l-primary hover:bg-accent transition-colors text-left group"
                    >
                      <div className="space-y-1">
                        <span className="font-medium group-hover:text-primary transition-colors">{topic.name}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <BookOpen className="w-3 h-3" />
                          <span>{getConceptNames(topic, session.conceptIds)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{session.questionCount} questions</span>
                          {topic.totalAttempts > 0 ? (
                            <span className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${topic.memoryScore >= 80 ? 'bg-green-500' : topic.memoryScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                              Memory: {topic.memoryScore}%
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                              Not Started
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-full font-medium">
                        Start Review
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upcoming & Recent */}
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-6">
              {/* Upcoming Sessions */}
              {upcomingSessions.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-xs font-semibold pl-1">
                    <Calendar className="w-3 h-3" /> Upcoming
                  </div>
                  <div className="grid gap-3">
                    {upcomingSessions.slice(0, 3).map(({ topic, session }) => {
                      const sessionDate = new Date(session.date + 'T00:00:00');
                      const dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      return (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-card border text-left"
                        >
                          <div className="space-y-1">
                            <span className="font-medium">{topic.name}</span>
                            <div className="text-xs text-muted-foreground">{session.questionCount} questions</div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-muted rounded-full">{dayName}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-xs font-semibold pl-1">
                  <Clock className="w-3 h-3" /> Recent Activity
                </div>
                {recentTopics.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-card border border-dashed text-center text-muted-foreground">
                    <p>No activity yet.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {recentTopics.slice(0, 3).map(topic => (
                      <button
                        key={topic.id}
                        onClick={() => router.push(`/learn/${topic.id}`)}
                        className="flex items-center justify-between p-4 rounded-xl bg-card border hover:border-primary/50 transition-colors text-left group"
                      >
                        <span className="font-medium group-hover:text-primary transition-colors">{topic.name}</span>
                        <div className="flex items-center gap-2">
                          {topic.totalAttempts === 0 ? (
                            <span className="text-xs text-muted-foreground font-medium">—</span>
                          ) : (
                            <span className="text-xs font-bold">{topic.memoryScore}%</span>
                          )}
                          <div className={`w-2 h-2 rounded-full ${topic.totalAttempts === 0 ? 'bg-muted-foreground/30' : topic.memoryScore >= 80 ? 'bg-green-500' : topic.memoryScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
