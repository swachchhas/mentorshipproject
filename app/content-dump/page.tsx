'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic, Concept } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Library, Search, ChevronRight, BarChart3, Clock, Trash2, BookOpen, Tag, Info, Target, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Dummy tags for MVP demo
const AVAILABLE_TAGS = ["Coding", "Science", "Theory", "Practice", "History", "Math"];

// Tag Color Mapping
const TAG_COLORS: Record<string, string> = {
    "Coding": "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200",
    "Science": "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
    "Theory": "bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200",
    "Practice": "bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200",
    "History": "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200",
    "Math": "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
    "General": "bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200"
};

// Helper to assign random tags to topics (deterministic based on name length)
const getDummyTags = (topicName: string) => {
    const len = topicName.length;
    const tags = [];
    if (len % 2 === 0) tags.push("Theory");
    else tags.push("Practice");

    if (topicName.toLowerCase().includes("react") || topicName.toLowerCase().includes("code")) tags.push("Coding");
    if (topicName.toLowerCase().includes("world") || topicName.toLowerCase().includes("war")) tags.push("History");
    if (topicName.toLowerCase().includes("photosynthesis")) tags.push("Science");

    // Fallback
    if (tags.length === 0) tags.push("General");

    return Array.from(new Set(tags)); // Unique
}

// Dummy stats generator
const getDummyConceptStats = (conceptId: string) => {
    // Deterministic random based on ID
    const seed = conceptId.charCodeAt(0) + conceptId.charCodeAt(conceptId.length - 1);
    return {
        timesReviewed: 5 + (seed % 15),
        accuracy: 70 + (seed % 30),
        lastQuiz: new Date(Date.now() - (seed % 10) * 24 * 60 * 60 * 1000).toLocaleDateString(),
        masteryLevel: (seed % 3) // 0: Novice, 1: Competent, 2: Master
    };
};

export default function ContentDumpPage() {
    const router = useRouter();
    const [topics, setTopics] = useState<(Topic & { tags: string[] })[]>([]);
    const [search, setSearch] = useState('');
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

    useEffect(() => {
        const rawTopics = storage.getTopics();
        // Enrich with dummy tags
        const enriched = rawTopics.map(t => ({
            ...t,
            tags: getDummyTags(t.name)
        }));
        setTopics(enriched);
    }, []);

    const toggleTag = (tag: string) => {
        setSelectedTags(prev =>
            prev.includes(tag)
                ? prev.filter(t => t !== tag)
                : [...prev, tag]
        );
    };

    const filteredTopics = topics.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase());
        const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => t.tags.includes(tag));
        return matchesSearch && matchesTags;
    });

    const handleDelete = (id: string) => {
        storage.deleteTopic(id);
        const updated = storage.getTopics();
        setTopics(updated.map(t => ({ ...t, tags: getDummyTags(t.name) }))); // Re-enrich
        setSelectedTopic(null);
    };

    return (
        <div className="min-h-screen bg-background dot-grid">
            <div className="p-6 lg:p-10 max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="animate-fade-in">
                    <h1 className="text-2xl lg:text-3xl font-bold flex items-center gap-3">
                        <Library className="w-6 h-6 text-primary" />
                        Content Dump
                    </h1>
                    <p className="text-muted-foreground mt-1">Your complete learning history</p>
                </div>

                <div className="grid lg:grid-cols-12 gap-6 animate-slide-up delay-100">
                    {/* Left Panel: Search, Filter & Topic List */}
                    <div className="lg:col-span-4 flex flex-col gap-4">
                        {/* Search & Tags */}
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Filter topics..."
                                    className="pl-9 h-10 w-full"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_TAGS.map(tag => (
                                    <Badge
                                        key={tag}
                                        variant="outline"
                                        className={`cursor-pointer transition-all border ${selectedTags.includes(tag) ? "ring-2 ring-primary ring-offset-1" : "opacity-70 hover:opacity-100"} ${TAG_COLORS[tag] || TAG_COLORS["General"]}`}
                                        onClick={() => toggleTag(tag)}
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* List */}
                        <ScrollArea className="h-[calc(100vh-350px)] rounded-md border bg-card/50 p-2">
                            <div className="space-y-2">
                                {filteredTopics.map((topic) => (
                                    <div
                                        key={topic.id}
                                        onClick={() => setSelectedTopic(topic)}
                                        className={`
                                            group cursor-pointer rounded-lg border p-3 transition-all hover:shadow-sm
                                            ${selectedTopic?.id === topic.id
                                                ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/20'
                                                : 'bg-card hover:border-primary/30'
                                            }
                                        `}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-1.5 flex-1 min-w-0">
                                                <h3 className={`font-medium truncate ${selectedTopic?.id === topic.id ? 'text-primary' : ''}`}>
                                                    {topic.name}
                                                </h3>
                                                <div className="flex flex-wrap gap-1">
                                                    {topic.tags.map(tag => (
                                                        <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${TAG_COLORS[tag] || TAG_COLORS["General"]}`}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${selectedTopic?.id === topic.id ? 'translate-x-1 text-primary' : 'opacity-0 group-hover:opacity-50'}`} />
                                        </div>
                                    </div>
                                ))}
                                {filteredTopics.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center">
                                        <Search className="w-8 h-8 mb-2 opacity-20" />
                                        <span>No topics found.</span>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right Panel: Detail View */}
                    <div className="lg:col-span-8">
                        {selectedTopic ? (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="border">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h2 className="text-2xl font-bold mb-2">{selectedTopic.name}</h2>
                                                <div className="flex gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-4 h-4" />
                                                        {new Date(selectedTopic.lastPracticed).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <BarChart3 className="w-4 h-4" />
                                                        {selectedTopic.totalAttempts} attempts
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-bold text-primary">{selectedTopic.memoryScore}%</div>
                                                <div className="text-xs text-muted-foreground">Retention</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button onClick={() => router.push(`/learn/${selectedTopic.id}`)}>
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                Take Quiz
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="outline" size="icon">
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will delete <span className="font-semibold text-foreground">"{selectedTopic.name}"</span> and all quiz history. This cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            onClick={() => handleDelete(selectedTopic.id)}
                                                        >
                                                            Delete
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Concepts List */}
                                <Card className="border">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base">Concepts ({selectedTopic.concepts.length})</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        {selectedTopic.concepts.map((concept) => (
                                            <div
                                                key={concept.id}
                                                onClick={() => setSelectedConcept(concept)}
                                                className="group p-3 rounded-lg bg-muted/50 flex items-center justify-between cursor-pointer hover:bg-muted transition-colors"
                                            >
                                                <span className="text-sm font-medium group-hover:text-primary transition-colors">{concept.text}</span>
                                                <div className="flex items-center gap-2">
                                                    <Info className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <Badge variant="outline" className={
                                                        concept.status === 'strong' ? 'text-green-600 border-green-300' :
                                                            concept.status === 'weak' ? 'text-red-600 border-red-300' : ''
                                                    }>
                                                        {concept.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="h-[calc(100vh-200px)] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                                <Library className="w-12 h-12 mb-4 opacity-30" />
                                <p className="font-medium">Select a topic to view details</p>
                                <p className="text-sm">Browse your learning history or filter by tags.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Concept Details Dialog */}
                <Dialog open={!!selectedConcept} onOpenChange={(open) => !open && setSelectedConcept(null)}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                Concept Details
                            </DialogTitle>
                            <DialogDescription>
                                Detailed analytics for <span className="font-semibold text-foreground">"{selectedConcept?.text}"</span>
                            </DialogDescription>
                        </DialogHeader>

                        {selectedConcept && (() => {
                            const stats = getDummyConceptStats(selectedConcept.id);
                            return (
                                <div className="py-4 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Reviewed</p>
                                            <p className="text-2xl font-bold">{stats.timesReviewed} <span className="text-sm font-normal text-muted-foreground">times</span></p>
                                        </div>
                                        <div className="p-4 rounded-xl bg-muted/50 border space-y-1">
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Accuracy</p>
                                            <p className={`text-2xl font-bold ${stats.accuracy >= 80 ? 'text-green-600' : stats.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                {stats.accuracy}%
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-sm border-b pb-2">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Calendar className="w-4 h-4" /> Last Quiz
                                            </span>
                                            <span className="font-medium">{stats.lastQuiz}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm border-b pb-2">
                                            <span className="text-muted-foreground flex items-center gap-2">
                                                <Tag className="w-4 h-4" /> Status
                                            </span>
                                            <Badge variant={selectedConcept.status === 'strong' ? 'default' : selectedConcept.status === 'weak' ? 'destructive' : 'secondary'}>
                                                {selectedConcept.status.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                                        <p className="text-xs text-primary font-semibold mb-1 uppercase">AI Insight</p>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            This concept seems {stats.accuracy > 75 ? "well-understood" : "to need more practice"}.
                                            User has encountered this in {stats.timesReviewed} separate quiz sessions.
                                            {stats.accuracy < 60 && " Recommend reviewing core definitions before next quiz."}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="flex justify-end">
                            <Button onClick={() => setSelectedConcept(null)}>Close</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
