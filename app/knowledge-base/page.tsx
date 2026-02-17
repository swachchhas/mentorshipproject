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

// Tag system
const AVAILABLE_TAGS = ["Coding", "Science", "Theory", "Practice", "History", "Math"];

const TAG_COLORS: Record<string, string> = {
    "Coding": "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900",
    "Science": "bg-green-100 text-green-700 border-green-200 hover:bg-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-900",
    "Theory": "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900",
    "Practice": "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800 dark:hover:bg-orange-900",
    "History": "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800 dark:hover:bg-amber-900",
    "Math": "bg-red-100 text-red-700 border-red-200 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-900",
    "General": "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
};

// Deterministic tag assignment
const getDummyTags = (topicName: string) => {
    const len = topicName.length;
    const tags: string[] = [];
    if (len % 2 === 0) tags.push("Theory");
    else tags.push("Practice");

    const lower = topicName.toLowerCase();
    if (lower.includes("react") || lower.includes("code") || lower.includes("python") || lower.includes("javascript")) tags.push("Coding");
    if (lower.includes("world") || lower.includes("war")) tags.push("History");
    if (lower.includes("photosynthesis") || lower.includes("biology") || lower.includes("chemistry")) tags.push("Science");
    if (lower.includes("math") || lower.includes("calculus") || lower.includes("algebra")) tags.push("Math");

    if (tags.length === 0) tags.push("General");
    return Array.from(new Set(tags));
};

// Deterministic stats from concept id
const getDummyConceptStats = (conceptId: string) => {
    const seed = conceptId.charCodeAt(0) + conceptId.charCodeAt(conceptId.length - 1);
    return {
        timesReviewed: 5 + (seed % 15),
        accuracy: 40 + (seed % 60),
        lastQuiz: new Date(Date.now() - (seed % 10) * 24 * 60 * 60 * 1000).toLocaleDateString(),
    };
};

type SortOption = 'recency' | 'weak-first' | 'strong-first' | 'alphabetical';

type EnrichedConcept = Concept & {
    topicId: string;
    topicName: string;
    tags: string[];
    stats: { timesReviewed: number; accuracy: number; lastQuiz: string };
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

    useEffect(() => {
        setTopics(storage.getTopics());
    }, []);

    // Flatten all concepts with topic metadata
    const allConcepts: EnrichedConcept[] = useMemo(() => {
        return topics.flatMap(topic => {
            const tags = getDummyTags(topic.name);
            return topic.concepts.map(c => ({
                ...c,
                topicId: topic.id,
                topicName: topic.name,
                tags,
                stats: getDummyConceptStats(c.id),
            }));
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
        if (accuracy >= 80) return `Well-understood. Encountered in ${timesReviewed} quiz sessions with ${accuracy}% accuracy.`;
        if (accuracy >= 60) return `Needs reinforcement. ${accuracy}% accuracy across ${timesReviewed} sessions — consider reviewing key definitions.`;
        return `Struggling area. Only ${accuracy}% accuracy over ${timesReviewed} sessions. Recommend revisiting fundamentals.`;
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
                                    {AVAILABLE_TAGS.map(tag => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className={`cursor-pointer transition-all border text-xs ${selectedTags.includes(tag) ? "ring-2 ring-primary ring-offset-1" : "opacity-70 hover:opacity-100"} ${TAG_COLORS[tag] || TAG_COLORS["General"]}`}
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
                                                    <span>{concept.stats.lastQuiz}</span>
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
                                                        router.push(`/learn/${concept.topicId}`);
                                                    }}
                                                >
                                                    Quiz Again
                                                    <ArrowRight className="ml-1 w-3 h-3" />
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
                <Dialog open={!!selectedConcept} onOpenChange={(open) => !open && setSelectedConcept(null)}>
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
                                        <span className="font-medium">{selectedConcept.stats.lastQuiz}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm border-b pb-2">
                                        <span className="text-muted-foreground flex items-center gap-2">
                                            <Tag className="w-4 h-4" /> Status
                                        </span>
                                        {getStatusBadge(selectedConcept.status)}
                                    </div>
                                </div>

                                {/* AI Insight */}
                                <div className="bg-primary/5 dark:bg-primary/10 p-4 rounded-lg border border-primary/10">
                                    <p className="text-xs text-primary font-semibold mb-1 uppercase">AI Insight</p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {getAIInsight(selectedConcept)}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    <Button
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedConcept(null);
                                            router.push(`/learn/${selectedConcept.topicId}`);
                                        }}
                                    >
                                        Quiz Again
                                        <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                    <Button variant="outline" onClick={() => setSelectedConcept(null)}>
                                        Close
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
