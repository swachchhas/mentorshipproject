'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, TrendingUp, Clock, AlertCircle, Target, BookOpen, ArrowRight } from 'lucide-react';

export default function CockpitPage() {
    const router = useRouter();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [stats, setStats] = useState({
        totalTopics: 0,
        averageMemory: 0,
        dueCount: 0,
        totalAttempts: 0
    });

    useEffect(() => {
        const allTopics = storage.getTopics();
        const now = new Date();

        const due = allTopics.filter(t => new Date(t.nextReviewDate) <= now);
        const totalMemory = allTopics.reduce((acc, t) => acc + t.memoryScore, 0);
        const totalAttempts = allTopics.reduce((acc, t) => acc + t.totalAttempts, 0);

        setTopics(allTopics);
        setStats({
            totalTopics: allTopics.length,
            averageMemory: allTopics.length > 0 ? Math.round(totalMemory / allTopics.length) : 0,
            dueCount: due.length,
            totalAttempts
        });
    }, []);

    const getScoreColor = (score: number) => {
        if (score >= 70) return "text-green-600 dark:text-green-400";
        if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
        return "text-red-600 dark:text-red-400";
    };

    const getScoreBg = (score: number) => {
        if (score >= 70) return "bg-green-500/10 border-green-500/20";
        if (score >= 40) return "bg-yellow-500/10 border-yellow-500/20";
        return "bg-red-500/10 border-red-500/20";
    };

    const getScoreDot = (score: number) => {
        if (score >= 70) return "bg-green-500";
        if (score >= 40) return "bg-yellow-500";
        return "bg-red-500";
    };

    const getScoreLabel = (score: number) => {
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
                                        onClick={() => router.push(`/learn/${topic.id}`)}
                                    >
                                        <CardContent className="p-5 space-y-4">
                                            {/* Topic header */}
                                            <div className="flex items-start justify-between">
                                                <h3 className="font-semibold text-base group-hover:text-primary transition-colors">
                                                    {topic.name}
                                                </h3>
                                                <div className="flex items-center gap-1.5">
                                                    <div className={`w-2 h-2 rounded-full ${getScoreDot(topic.memoryScore)}`} />
                                                    <span className={`text-xl font-bold ${getScoreColor(topic.memoryScore)}`}>
                                                        {topic.memoryScore}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Meta */}
                                            <div className="space-y-1.5 text-xs text-muted-foreground">
                                                <p>{topic.concepts.length} concepts</p>
                                                <p>Last practiced {getRelativeTime(topic.lastPracticed)}</p>
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
                                                    {getScoreLabel(topic.memoryScore)}
                                                </Badge>
                                                <span className="text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    Continue Learning <ArrowRight className="w-3 h-3" />
                                                </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
