'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic, Concept } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
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
import {
    Brain,
    Search,
    BookOpen,
    Tag,
    Target,
    Calendar,
    BarChart3,
    ArrowRight,
    SlidersHorizontal,
    ChevronDown,
} from 'lucide-react';

import { schedulesStorage } from '@/lib/storage/schedules-storage';
import { quizHistoryStorage, QuizAttempt } from '@/lib/storage/quiz-history-storage';
import { questionsStorage } from '@/lib/storage/questions-storage';

// ─── Dynamic Tag System ──────────────────────────────────────────────────────
const LEVEL_TAGS = ['Beginner', 'Intermediate', 'Expert'];
const LANGUAGE_TAGS = ['C++', 'Python', 'JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Node', 'Java', 'Rust', 'Go'];

// Generate a set of unique tags based on available topics
const getDynamicTags = (topics: Topic[]) => {
    const tags = new Set<string>();

    // Always include the levels
    LEVEL_TAGS.forEach(t => tags.add(t));

    topics.forEach(t => {
        // Add level tag
        if (t.level) {
            tags.add(t.level.charAt(0).toUpperCase() + t.level.slice(1));
        }

        // Add language/topic tag if it matches known ones
        const lowerName = t.name.toLowerCase();
        LANGUAGE_TAGS.forEach(lang => {
            if (lowerName.includes(lang.toLowerCase())) {
                tags.add(lang);
            }
        });

        // General categories
        if (lowerName.includes("science") || lowerName.includes("biology") || lowerName.includes("physics")) tags.add("Science");
        if (lowerName.includes("math") || lowerName.includes("calculus") || lowerName.includes("algebra")) tags.add("Math");
        if (lowerName.includes("history")) tags.add("History");
    });

    // Fallback if empty
    if (tags.size === 0) tags.add("General");

    return Array.from(tags).sort();
};

const getTagsForTopic = (t: Topic): string[] => {
    const tags: string[] = [];
    if (t.level) tags.push(t.level.charAt(0).toUpperCase() + t.level.slice(1));

    const lowerName = t.name.toLowerCase();
    LANGUAGE_TAGS.forEach(lang => {
        if (lowerName.includes(lang.toLowerCase())) {
            tags.push(lang);
        }
    });

    // Basic heuristics
    if (lowerName.includes("code") || tags.some(tag => LANGUAGE_TAGS.includes(tag))) tags.push("Coding");
    if (lowerName.includes("science") || lowerName.includes("biology")) tags.push("Science");
    if (lowerName.includes("history")) tags.push("History");
    if (lowerName.includes("math")) tags.push("Math");

    if (tags.length === 0) tags.push("General");

    return Array.from(new Set(tags));
};

const TAG_COLORS: Record<string, string> = {
    "Beginner": "bg-green-100 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
    "Intermediate": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
    "Expert": "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800",
    "Coding": "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    "Science": "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800",
    "Math": "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800",
    "General": "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700"
};

const getTagColor = (tag: string) => {
    return TAG_COLORS[tag] || TAG_COLORS["General"];
};

type SortOption = 'recency' | 'weak-first' | 'strong-first' | 'alphabetical';

type EnrichedConcept = Concept & {
    topicId: string;
    topicName: string;
    tags: string[];
    stats: { timesReviewed: number; accuracy: number; lastQuiz: string | null };
};

export default function KnowledgeBasePage() {
    const router = useRouter();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [search, setSearch] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTopicFilter, setSelectedTopicFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<SortOption>('recency');
    const [selectedConcept, setSelectedConcept] = useState<EnrichedConcept | null>(null);
    const [showFilters, setShowFilters] = useState(true);
    const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);

    useEffect(() => {
        setTopics(storage.getTopics());
    }, []);

    // Dynamic tags based on current topics
    const availableTags = useMemo(() => getDynamicTags(topics), [topics]);

    // Flatten all concepts with topic metadata and REAL stats
    const allConcepts: EnrichedConcept[] = useMemo(() => {
        const fullHistory = quizHistoryStorage.getAllHistory();

        return topics.flatMap(topic => {
            const tags = getTagsForTopic(topic);
            const topicHistory = fullHistory.filter(h => h.topicId === topic.id);

            return topic.concepts.map(c => {
                // Filter history that included this concept
                const conceptAttempts = topicHistory.filter(h =>
                    h.conceptBreakdown.some(cb => cb.conceptId === c.id)
                );

                const timesReviewed = conceptAttempts.length;

                // Use the saved retentionScore or calculate an average from history
                const accuracy = c.retentionScore ?? (timesReviewed > 0
                    ? Math.round(conceptAttempts.reduce((acc: number, curr) => {
                        const breakdown = curr.conceptBreakdown.find(cb => cb.conceptId === c.id);
                        return acc + (breakdown?.score || 0);
                    }, 0) / timesReviewed)
                    : 0);

                let lastQuizDateStr: string | null = null;
                if (timesReviewed > 0) {
                    const latest = conceptAttempts.sort((a, b) =>
                        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                    )[0];
                    lastQuizDateStr = latest.completedAt;
                }

                const lastQuiz = lastQuizDateStr
                    ? new Date(lastQuizDateStr).toLocaleDateString()
                    : null;

                return {
                    ...c,
                    topicId: topic.id,
                    topicName: topic.name,
                    tags,
                    stats: { timesReviewed, accuracy, lastQuiz },
                };
            });
        });
    }, [topics]);

    const totalConceptCount = allConcepts.length;

    // Tag counts
    const tagCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        allConcepts.forEach(c => {
            c.tags.forEach(tag => {
                counts[tag] = (counts[tag] || 0) + 1;
            });
        });
        return counts;
    }, [allConcepts]);

    // Filtering
    const filteredConcepts = useMemo(() => {
        let result = allConcepts;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.text.toLowerCase().includes(q) || c.topicName.toLowerCase().includes(q)
            );
        }

        if (selectedTags.length > 0) {
            result = result.filter(c => selectedTags.some(tag => c.tags.includes(tag)));
        }

        if (selectedTopicFilter !== 'all') {
            result = result.filter(c => c.topicId === selectedTopicFilter);
        }

        // Sorting
        switch (sortBy) {
            case 'weak-first':
                result = [...result].sort((a, b) => a.stats.accuracy - b.stats.accuracy);
                break;
            case 'strong-first':
                result = [...result].sort((a, b) => b.stats.accuracy - a.stats.accuracy);
                break;
            case 'alphabetical':
                result = [...result].sort((a, b) => a.text.localeCompare(b.text));
                break;
            case 'recency':
            default:
                // already in topic order which approximates recency
                break;
        }

        return result;
    }, [allConcepts, search, selectedTags, selectedTopicFilter, sortBy]);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
        );
    };

    const getStatusColor = (status: string) => {
        if (status === 'strong') return 'text-green-600 dark:text-green-400';
        if (status === 'weak') return 'text-red-600 dark:text-red-400';
        return 'text-yellow-600 dark:text-yellow-400';
    };

    const getStatusBadge = (status: string) => {
        if (status === 'strong') return <Badge variant="outline" className="text-green-600 border-green-300 dark:text-green-400 dark:border-green-700">Strong</Badge>;
        if (status === 'weak') return <Badge variant="outline" className="text-red-600 border-red-300 dark:text-red-400 dark:border-red-700">Weak</Badge>;
        return <Badge variant="outline" className="text-yellow-600 border-yellow-300 dark:text-yellow-400 dark:border-yellow-700">Average</Badge>;
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 80) return 'text-green-600 dark:text-green-400';
        if (accuracy >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getAIInsight = (concept: EnrichedConcept) => {
        const { accuracy, timesReviewed } = concept.stats;
        if (timesReviewed === 0) return `Not reviewed yet. Start a session to generate insights.`;
        if (accuracy >= 80) return `Well-understood. Encountered in ${timesReviewed} quiz session(s) with ${accuracy}% accuracy.`;
        if (accuracy >= 60) return `Needs reinforcement. ${accuracy}% accuracy across ${timesReviewed} session(s) — consider reviewing key definitions.`;
        return `Struggling area. Only ${accuracy}% accuracy over ${timesReviewed} session(s). Recommend revisiting fundamentals.`;
    };

    const handleRegenerateConceptQuestions = async () => {
        if (!selectedConcept) return;
        setIsRegenerating(true);
        try {
            const response = await fetch('/api/ai/generate-quiz', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: selectedConcept.topicName,
                    topicId: selectedConcept.topicId,
                    concept: selectedConcept.text,
                    conceptId: selectedConcept.id,
                    // Note: We might not have the level on the EnrichedConcept directly, fallback to beginner
                    level: topics.find(t => t.id === selectedConcept.topicId)?.level || 'beginner',
                    count: 10
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.questions) {
                    questionsStorage.deleteQuestionsForConcept(selectedConcept.topicId, selectedConcept.id);
                    questionsStorage.saveQuestions(data.questions);

                    // Redirect to concept quiz
                    const cid = selectedConcept.id;
                    const tid = selectedConcept.topicId;
                    setSelectedConcept(null);
                    setShowRegenerateDialog(false);
                    router.push(`/learn/${tid}?conceptId=${cid}`);
                }
            }
        } catch (error) {
            console.error('Failed to regenerate questions:', error);
            alert('Failed to generate new questions. Please try again.');
        } finally {
            setIsRegenerating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background dot-grid">
            <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                        <Brain className="w-6 h-6 text-primary" />
                        Knowledge Base
                    </h1>
                    <p className="text-muted-foreground mt-1">Your second brain — everything you&apos;ve learned</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 animate-slide-up delay-100">
                    {/* Left Sidebar — Filters */}
                    <div className={`lg:col-span-3 space-y-4 ${showFilters ? '' : 'hidden lg:block'}`}>
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search concepts..."
                                className="pl-9 h-10 w-full"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Tag Filters */}
                        <Card className="border">
                            <CardContent className="p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <Tag className="w-3 h-3" /> Filter by tag
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {availableTags.map(tag => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className={`cursor-pointer transition-all border text-xs ${selectedTags.includes(tag) ? "ring-2 ring-primary ring-offset-1" : "opacity-70 hover:opacity-100"} ${getTagColor(tag)}`}
                                            onClick={() => toggleTag(tag)}
                                        >
                                            {tag}
                                            {tagCounts[tag] ? (
                                                <span className="ml-1 opacity-60">({tagCounts[tag]})</span>
                                            ) : null}
                                        </Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Topic Filter */}
                        <Card className="border">
                            <CardContent className="p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <BookOpen className="w-3 h-3" /> Filter by topic
                                </p>
                                <div className="relative">
                                    <select
                                        value={selectedTopicFilter}
                                        onChange={(e) => setSelectedTopicFilter(e.target.value)}
                                        className="w-full h-9 px-3 pr-8 rounded-md border border-input bg-background text-sm appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="all">All Topics</option>
                                        {topics.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sort */}
                        <Card className="border">
                            <CardContent className="p-4 space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3 h-3" /> Sort by
                                </p>
                                <div className="space-y-1">
                                    {([
                                        ['recency', 'Most Recent'],
                                        ['weak-first', 'Weakest First'],
                                        ['strong-first', 'Strongest First'],
                                        ['alphabetical', 'Alphabetical'],
                                    ] as [SortOption, string][]).map(([value, label]) => (
                                        <button
                                            key={value}
                                            onClick={() => setSortBy(value)}
                                            className={`w-full text-left text-sm px-3 py-1.5 rounded-md transition-colors ${sortBy === value
                                                ? 'bg-primary text-primary-foreground font-medium'
                                                : 'hover:bg-accent text-muted-foreground'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Main Content — Concept Cards */}
                    <div className="lg:col-span-9 space-y-4">
                        {/* Mobile filter toggle */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="lg:hidden"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            {showFilters ? 'Hide Filters' : 'Show Filters'}
                        </Button>

                        {/* Overview bar */}
                        <div className="flex items-center justify-between px-1">
                            <p className="text-sm text-muted-foreground">
                                Showing <span className="font-semibold text-foreground">{filteredConcepts.length}</span>
                                {filteredConcepts.length !== totalConceptCount && ` of ${totalConceptCount}`} concepts
                                {selectedTopicFilter !== 'all' && ` from "${topics.find(t => t.id === selectedTopicFilter)?.name}"`}
                            </p>
                        </div>

                        {/* Concept Grid */}
                        {filteredConcepts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                                <Brain className="w-12 h-12 mb-4 opacity-30" />
                                <p className="font-medium">No concepts found</p>
                                <p className="text-sm">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {filteredConcepts.map((concept) => (
                                    <Card
                                        key={`${concept.topicId}-${concept.id}`}
                                        className="border hover:border-primary/40 transition-all group cursor-pointer hover:shadow-md"
                                        onClick={() => setSelectedConcept(concept)}
                                    >
                                        <CardContent className="p-5 space-y-4">
                                            {/* Header */}
                                            <div className="flex items-start justify-between">
                                                <div className="space-y-1 flex-1 min-w-0">
                                                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
                                                        {concept.text}
                                                    </h3>
                                                    <p className="text-xs text-muted-foreground">
                                                        from <span className="font-medium text-foreground/70">{concept.topicName}</span>
                                                    </p>
                                                </div>
                                                <span className={`text-lg font-bold ${getAccuracyColor(concept.stats.accuracy)}`}>
                                                    {concept.stats.accuracy}%
                                                </span>
                                            </div>

                                            {/* Stats row */}
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <BarChart3 className="w-3 h-3" />
                                                    <span>{concept.stats.timesReviewed}x reviewed</span>
                                                </div>
                                                <div className="flex items-center gap-1 text-muted-foreground">
                                                    <Calendar className="w-3 h-3" />
                                                    <span>{concept.stats.lastQuiz || 'No quizzes yet'}</span>
                                                </div>
                                                <div className="flex justify-end">
                                                    {getStatusBadge(concept.status)}
                                                </div>
                                            </div>

                                            {/* AI Insight */}
                                            <div className="bg-primary/5 dark:bg-primary/10 px-3 py-2 rounded-lg border border-primary/10">
                                                <p className="text-xs text-muted-foreground leading-relaxed">
                                                    <span className="text-primary font-semibold">AI Insight:</span>{' '}
                                                    {getAIInsight(concept)}
                                                </p>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedConcept(concept);
                                                    }}
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/learn/${concept.topicId}/concept/${concept.id}`);
                                                    }}
                                                >
                                                    Deep Dive
                                                    <Brain className="ml-1 w-3 h-3" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Concept Detail Modal */}
                <Dialog open={!!selectedConcept && !showRegenerateDialog} onOpenChange={(open) => !open && setSelectedConcept(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Concept Details
                            </DialogTitle>
                            <DialogDescription>
                                Detailed analytics for <span className="font-semibold text-foreground">&quot;{selectedConcept?.text}&quot;</span>
                            </DialogDescription>
                        </DialogHeader>

                        {selectedConcept && (
                            <div className="py-4 space-y-6">
                                {/* Parent topic */}
                                <p className="text-sm text-muted-foreground">
                                    From topic: <span className="font-medium text-foreground">{selectedConcept.topicName}</span>
                                </p>

                                {/* Stats grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reviewed</p>
                                        <p className="text-2xl font-bold">{selectedConcept.stats.timesReviewed} <span className="text-sm font-normal text-muted-foreground">times</span></p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Accuracy</p>
                                        <p className={`text-2xl font-bold ${getAccuracyColor(selectedConcept.stats.accuracy)}`}>
                                            {selectedConcept.stats.accuracy}%
                                        </p>
                                    </div>
                                </div>

                                {/* Detail rows */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-sm border-b pb-2">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Last Quiz
                                        </span>
                                        <span className="font-medium">{selectedConcept.stats.lastQuiz || 'Never'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b pb-2">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Tag className="w-4 h-4" /> Status
                                        </span>
                                        {getStatusBadge(selectedConcept.status)}
                                    </div>
                                </div>

                                {/* Performance History */}
                                {selectedConcept.stats.timesReviewed > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Recent Performance</p>
                                        <div className="flex gap-1 h-8 items-end">
                                            {quizHistoryStorage.getAllHistory()
                                                .filter(h => h.topicId === selectedConcept.topicId && h.conceptBreakdown.some(cb => cb.conceptId === selectedConcept.id))
                                                .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
                                                .slice(-10)
                                                .map((attempt, i) => {
                                                    const score = attempt.conceptBreakdown.find(cb => cb.conceptId === selectedConcept.id)?.score || 0;
                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`flex-1 rounded-sm transition-all hover:opacity-80`}
                                                            style={{
                                                                height: `${Math.max(15, score)}%`,
                                                                backgroundColor: score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444'
                                                            }}
                                                            title={`${new Date(attempt.completedAt).toLocaleDateString()}: ${score}%`}
                                                        />
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}

                                {/* AI Insight */}
                                <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/10">
                                    <p className="text-xs text-primary font-semibold mb-1 uppercase">AI Insight</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {getAIInsight(selectedConcept)}
                                    </p>
                                </div>

                                {/* Common Mistakes */}
                                {(() => {
                                    const conceptHistory = quizHistoryStorage.getAllHistory()
                                        .filter(h => h.topicId === selectedConcept.topicId && h.conceptBreakdown.some(cb => cb.conceptId === selectedConcept.id));

                                    const incorrectQuestions: Record<string, { text: string, count: number }> = {};
                                    conceptHistory.forEach(attempt => {
                                        attempt.questions.forEach(q => {
                                            if (q.conceptId === selectedConcept.id && !q.isCorrect) {
                                                if (!incorrectQuestions[q.questionId]) {
                                                    // Note: We'd need to fetch question text from questionsStorage
                                                    const fullQ = questionsStorage.getQuestions().find(fq => fq.id === q.questionId);
                                                    if (fullQ) {
                                                        incorrectQuestions[q.questionId] = { text: fullQ.question, count: 0 };
                                                    }
                                                }
                                                if (incorrectQuestions[q.questionId]) {
                                                    incorrectQuestions[q.questionId].count++;
                                                }
                                            }
                                        });
                                    });

                                    const topMistakes = Object.values(incorrectQuestions)
                                        .sort((a, b) => b.count - a.count)
                                        .slice(0, 2);

                                    if (topMistakes.length > 0) {
                                        return (
                                            <div className="space-y-3">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Common Bottlenecks</p>
                                                <div className="space-y-2">
                                                    {topMistakes.map((m, i) => (
                                                        <div key={i} className="text-xs p-3 rounded-lg border bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 flex gap-3">
                                                            <div className="shrink-0 w-5 h-5 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 font-bold">!</div>
                                                            <div className="space-y-1">
                                                                <p className="font-medium text-foreground">{m.text}</p>
                                                                <p className="text-red-600/70 font-medium">Missed {m.count} time{m.count > 1 ? 's' : ''}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <div className="flex-1 flex gap-2">
                                        <Button
                                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                            onClick={() => {
                                                const cid = selectedConcept.id;
                                                const tid = selectedConcept.topicId;
                                                setSelectedConcept(null);
                                                router.push(`/learn/${tid}?conceptId=${cid}`);
                                            }}
                                        >
                                            📝 Quiz This Concept
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
                                                    <p>Regenerate questions for this concept</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>
                                    <Button variant="outline" onClick={() => setSelectedConcept(null)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                <AlertDialog open={showRegenerateDialog} onOpenChange={setShowRegenerateDialog}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Regenerate Concept Questions?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will generate new questions specifically for <span className="font-semibold text-foreground">&quot;{selectedConcept?.text}&quot;</span>.
                                Your current questions and performance history will be saved.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isRegenerating}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleRegenerateConceptQuestions();
                                }}
                                disabled={isRegenerating}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                            >
                                {isRegenerating ? 'Generating...' : 'Generate & Start Quiz'} 🎲
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>
    );
}
