'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Clock, AlertCircle, Target, BookOpen, ArrowRight, Calendar, Sparkles, X } from 'lucide-react';
import { schedulesStorage } from '@/lib/storage/schedules-storage';
import { quizHistoryStorage, QuizAttempt } from '@/lib/storage/quiz-history-storage';
import { QuizHistoryModal } from '@/components/quiz-history-modal';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
    TooltipProvider,
} from "@/components/ui/tooltip";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { questionsStorage } from "@/lib/storage/questions-storage";

export default function CockpitPage() {
    const router = useRouter();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [scheduleProgress, setScheduleProgress] = useState<Record<string, { completed: number; total: number; percentage: number }>>({});
    const [stats, setStats] = useState({
        totalTopics: 0,
        averageMemory: 0,
        dueCount: 0,
        totalAttempts: 0,
        totalSessions: 0,
        completedSessions: 0
    });
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [selectedTopicHistory, setSelectedTopicHistory] = useState<QuizAttempt[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    useEffect(() => {
        const allTopics = storage.getTopics();
        const now = new Date();

        // Count due sessions from real schedules
        const todaysSessions = schedulesStorage.getTodaysSessions();
        const oldStyleDue = allTopics.filter(t => {
            if (!t.nextReviewDate) return false;
            if (todaysSessions.some(s => s.schedule.topicId === t.id)) return false;
            return new Date(t.nextReviewDate) <= now;
        });
        const dueCount = todaysSessions.length + oldStyleDue.length;

        const totalMemory = allTopics.reduce((acc, t) => acc + t.memoryScore, 0);
        const totalAttempts = allTopics.reduce((acc, t) => acc + t.totalAttempts, 0);

        // Get schedule progress for each topic
        const progress: Record<string, { completed: number; total: number; percentage: number }> = {};
        let totalSess = 0;
        let completedSess = 0;
        allTopics.forEach(t => {
            if (t.scheduleId) {
                const p = schedulesStorage.getScheduleProgress(t.scheduleId);
                progress[t.id] = p;
                totalSess += p.total;
                completedSess += p.completed;
            }
        });
        setScheduleProgress(progress);

        setTopics(allTopics);
        setStats({
            totalTopics: allTopics.length,
            averageMemory: allTopics.length > 0 ? Math.round(totalMemory / allTopics.length) : 0,
            dueCount,
            totalAttempts,
            totalSessions: totalSess,
            completedSessions: completedSess
        });
    }, []);

    useEffect(() => {
        if (selectedTopic) {
            setSelectedTopicHistory(quizHistoryStorage.getHistoryForTopic(selectedTopic.id));
        } else {
            setSelectedTopicHistory([]);
        }
    }, [selectedTopic]);

    const getScoreColor = (score: number) => {
        if (score === 0) return "text-muted-foreground";
        if (score >= 70) return "text-green-600 dark:text-green-400";
        if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
        return "text-red-600 dark:text-red-400";
    };

    const getScoreBg = (score: number) => {
        if (score === 0) return "bg-muted/30 border-muted";
        if (score >= 70) return "bg-green-500/10 border-green-500/20";
        if (score >= 40) return "bg-yellow-500/10 border-yellow-500/20";
        return "bg-red-500/10 border-red-500/20";
    };

    const getScoreDot = (score: number) => {
        if (score === 0) return "bg-muted-foreground/30";
        if (score >= 70) return "bg-green-500";
        if (score >= 40) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getScoreLabel = (score: number, topic?: Topic) => {
        if (score === 0 && topic && topic.totalAttempts === 0) return "Not started";
        if (score >= 70) return "Strong";
        if (score >= 40) return "Average";
        return "Weak";
    };

    const getRelativeTime = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - new Date(date).getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return '1 day ago';
        return `${diffDays} days ago`;
    };

    const handleRegenerateTopicQuestions = async () => {
        if (!selectedTopic) return;
        setIsRegenerating(true);
        try {
            for (const concept of selectedTopic.concepts) {
                const response = await fetch('/api/ai/generate-quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: selectedTopic.name,
                        topicId: selectedTopic.id,
                        concept: concept.text,
                        conceptId: concept.id,
                        level: selectedTopic.level || 'beginner',
                        count: 5
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.questions) {
                        questionsStorage.deleteQuestionsForConcept(selectedTopic.id, concept.id);
                        questionsStorage.saveQuestions(data.questions);
                    }
                }
            }
            // Navigate to the topic quiz after regenerating
            router.push(`/learn/${selectedTopic.id}`);
        } catch (error) {
            console.error('Failed to regenerate questions:', error);
            alert('Failed to generate new questions. Please try again.');
        } finally {
            setIsRegenerating(false);
            setShowRegenerateDialog(false);
        }
    };

    return (
        <div className="min-h-screen bg-background dot-grid">
            <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        Cockpit
                    </h1>
                    <p className="text-muted-foreground mt-1">Your learning progress at a glance</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-slide-up delay-100">
                    <Card className="border">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalTopics}</p>
                                    <p className="text-xs text-muted-foreground">Topics</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Brain className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className={`text-2xl font-bold ${getScoreColor(stats.averageMemory)}`}>
                                        {stats.averageMemory}%
                                    </p>
                                    <p className="text-xs text-muted-foreground">Avg. Memory</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${stats.dueCount > 0 ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                                    <Clock className={`w-4 h-4 ${stats.dueCount > 0 ? 'text-destructive' : 'text-primary'}`} />
                                </div>
                                <div>
                                    <p className={`text-2xl font-bold ${stats.dueCount > 0 ? 'text-destructive' : ''}`}>
                                        {stats.dueCount}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Due</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Target className="w-4 h-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stats.totalAttempts}</p>
                                    <p className="text-xs text-muted-foreground">Sessions</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Priority Review — full width */}
                <div className="animate-slide-up delay-200">
                    <Card className="border">
                        <CardContent className="p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <AlertCircle className="w-4 h-4 text-destructive" />
                                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Priority Review</span>
                            </div>

                            {stats.dueCount === 0 ? (
                                <div className="text-center py-10 text-muted-foreground">
                                    <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">All caught up!</p>
                                    <p className="text-sm">Great job retaining your knowledge.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {topics
                                        .filter(t => new Date(t.nextReviewDate) <= new Date())
                                        .slice(0, 5)
                                        .map(topic => (
                                            <div
                                                key={topic.id}
                                                className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors group"
                                            >
                                                <div>
                                                    <p className="font-medium">{topic.name}</p>
                                                    <p className="text-xs text-destructive">Review overdue</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => router.push(`/learn/${topic.id}`)}
                                                >
                                                    Review
                                                    <ArrowRight className="ml-1 w-3 h-3" />
                                                </Button>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Active Topics */}
                <div className="animate-slide-up delay-300">
                    <div className="flex items-center gap-2 mb-4">
                        <BookOpen className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Active Topics</span>
                    </div>

                    {topics.length === 0 ? (
                        <Card className="border">
                            <CardContent className="p-5">
                                <div className="text-center py-10 text-muted-foreground">
                                    <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                    <p className="font-medium">No topics yet</p>
                                    <p className="text-sm">Go learn something new to see it here!</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {topics
                                .sort((a, b) => new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime())
                                .slice(0, 6)
                                .map(topic => (
                                    <Card
                                        key={topic.id}
                                        className={`border transition-all hover:shadow-md cursor-pointer group ${getScoreBg(topic.memoryScore)}`}
                                        onClick={() => setSelectedTopic(topic)}
                                    >
                                        <CardContent className="p-5 space-y-4">
                                            {/* Topic header */}
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                                                        {topic.name}
                                                    </h3>
                                                    {topic.level && (
                                                        <Badge
                                                            variant="secondary"
                                                            className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0 ${topic.level === 'beginner' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                topic.level === 'intermediate' ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-300' :
                                                                    'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300'
                                                                }`}
                                                        >
                                                            {topic.level}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${getScoreDot(topic.memoryScore)}`} />
                                                    <span className={`text-xl font-bold ${getScoreColor(topic.memoryScore)}`}>
                                                        {topic.memoryScore === 0 && topic.totalAttempts === 0 ? '—' : `${topic.memoryScore}%`}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Meta */}
                                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                                <p>{topic.concepts.length} concepts</p>
                                                <p>Last practiced {getRelativeTime(topic.lastPracticed)}</p>
                                                {scheduleProgress[topic.id] && (
                                                    <div className="flex items-center gap-1.5">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            {scheduleProgress[topic.id].completed}/{scheduleProgress[topic.id].total} sessions ({scheduleProgress[topic.id].percentage}%)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Score bar */}
                                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${topic.memoryScore >= 70 ? 'bg-green-500' : topic.memoryScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${topic.memoryScore}%` }}
                                                />
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between">
                                                <Badge variant="outline" className={`text-xs ${getScoreColor(topic.memoryScore)}`}>
                                                    {getScoreLabel(topic.memoryScore, topic)}
                                                </Badge>
                                                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    View Details <ArrowRight className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Topic Overview Modal */}
            <Dialog open={!!selectedTopic && !showRegenerateDialog && !showHistory} onOpenChange={(open) => !open && setSelectedTopic(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl">
                            {selectedTopic?.name}
                        </DialogTitle>
                        <DialogDescription>
                            Topic Overview and Study Plan
                        </DialogDescription>
                    </DialogHeader>

                    {selectedTopic && (
                        <div className="space-y-6 py-4">
                            {/* Meta Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Overall Stats</p>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={getScoreColor(selectedTopic.memoryScore)}>
                                            {getScoreLabel(selectedTopic.memoryScore, selectedTopic)}
                                        </Badge>
                                        <span className="text-sm font-medium">{selectedTopic.memoryScore}%</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Activity</p>
                                    <p className="text-sm">
                                        {selectedTopic.totalAttempts} attempts
                                    </p>
                                </div>
                            </div>

                            {/* Concept Breakdown */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 border-b pb-2">
                                    <Brain className="w-4 h-4 text-primary" />
                                    <p className="text-sm font-semibold">Concept Performance</p>
                                </div>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                    {selectedTopic.concepts.map((c) => {
                                        // Calculate concept specific score from history
                                        let conceptAttempts = 0;
                                        let conceptScoreSum = 0;

                                        selectedTopicHistory.forEach(history => {
                                            const conceptStats = history.conceptBreakdown.find(cb => cb.conceptId === c.id);
                                            if (conceptStats && conceptStats.totalCount > 0) {
                                                conceptAttempts++;
                                                conceptScoreSum += conceptStats.score;
                                            }
                                        });

                                        const avgScore = conceptAttempts > 0 ? Math.round(conceptScoreSum / conceptAttempts) : 0;

                                        return (
                                            <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                                                <span className="font-medium truncate mr-2" title={c.text}>{c.text}</span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-xs text-muted-foreground">{conceptAttempts} tries</span>
                                                    <Badge variant="outline" className={`w-12 justify-center ${getScoreColor(avgScore)}`}>
                                                        {avgScore}%
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {selectedTopic.concepts.length === 0 && (
                                        <span className="text-sm text-muted-foreground italic">No specific concepts tracked yet.</span>
                                    )}
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="pt-4 flex flex-col gap-2 border-t">
                                {selectedTopicHistory.length === 0 ? (
                                    <Button
                                        className="w-full gap-2"
                                        onClick={() => router.push(`/learn/${selectedTopic.id}`)}
                                    >
                                        Take Topic Quiz <ArrowRight className="w-4 h-4" />
                                    </Button>
                                ) : (
                                    <div className="flex gap-2 items-center">
                                        <Button
                                            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => router.push(`/learn/${selectedTopic.id}`)}
                                        >
                                            ♻️ Redo Quiz (same questions)
                                        </Button>

                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        disabled={isRegenerating}
                                                        onClick={() => setShowRegenerateDialog(true)}
                                                        className="shrink-0 h-10 w-10 text-xl hover:bg-muted"
                                                    >
                                                        {isRegenerating ? <span className="animate-spin text-sm">⏳</span> : "🎲"}
                                                    </Button>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>Regenerate questions and start new quiz</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                )}

                                <Button
                                    variant="outline"
                                    className="w-full gap-2"
                                    disabled={selectedTopicHistory.length === 0}
                                    onClick={() => setShowHistory(true)}
                                >
                                    <Calendar className="w-4 h-4" /> View Quiz History
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Regenerate Questions?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will generate new questions for each concept in this topic using AI.
                            Your current questions and performance history will be saved.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isRegenerating}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleRegenerateTopicQuestions();
                            }}
                            disabled={isRegenerating}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                            {isRegenerating ? 'Generating...' : 'Generate & Start Quiz'} 🎲
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Quiz History Modal */}
            <QuizHistoryModal
                open={showHistory}
                onOpenChange={setShowHistory}
                topic={selectedTopic}
                history={selectedTopicHistory}
                onRetakeQuiz={(attemptId) => {
                    // Start a new session with exact same parameters
                    // (Implementation detail for Phase 7)
                    router.push(`/learn/${selectedTopic?.id}`);
                }}
            />
        </div>
    );
}
