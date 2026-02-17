'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, BookOpen, FileText, Video, Users, Globe, Lightbulb, CheckCircle2, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
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
import { Topic, Concept } from '@/types';

type Step = 'capture' | 'level' | 'familiarity' | 'confidence' | 'source' | 'confirmation' | 'exit';

// Mock Data for Concepts by Level
const mockConcepts: Record<string, { beginner: string[], intermediate: string[], expert: string[] }> = {
    "Python": {
        beginner: ["Variables", "Loops", "Conditionals", "Functions", "Lists", "Dictionaries"],
        intermediate: ["Classes", "Methods", "List Comprehension", "Error Handling", "File I/O", "Modules"],
        expert: ["Decorators", "Generators", "Metaclasses", "Async/Await", "Multithreading", "Context Managers"]
    },
    "React": {
        beginner: ["Components", "Props", "State", "JSX", "Event Handling", "Lists & Keys"],
        intermediate: ["Hooks (useState, useEffect)", "Context API", "Refs", "Custom Hooks", "Form Handling", "Memoization"],
        expert: ["Suspense", "Concurrent Mode", "Server Components", "Performance Optimization", "Portals", "Error Boundaries"]
    },
    "JavaScript": {
        beginner: ["Variables", "Data Types", "Operators", "Functions", "Arrays", "Objects"],
        intermediate: ["Closures", "Promises", "Async/Await", "DOM Manipulation", "Event Listeners", "ES6+ Features"],
        expert: ["Event Loop", "Prototypes", "Modules", "Web Workers", "Memory Management", "V8 Engine Internals"]
    }
};

const getConceptsForLevel = (topic: string, level: 'beginner' | 'intermediate' | 'expert') => {
    // Try to find exact match
    const exactMatch = Object.keys(mockConcepts).find(k => k.toLowerCase() === topic.toLowerCase());
    if (exactMatch) {
        return mockConcepts[exactMatch][level];
    }
    // Default generic concepts if topic not found
    return [
        `Basic ${topic} Concepts`,
        `Core Principles`,
        `Introductory Terminology`,
        `Foundational Skills`
    ];
};

const confidenceLevels = [
    { value: 1, label: 'Just heard of it', emoji: '🌱' },
    { value: 2, label: 'Getting familiar', emoji: '🌿' },
    { value: 3, label: 'Pretty confident', emoji: '🌳' },
    { value: 4, label: 'Could teach it', emoji: '🎓' }
];

const sources = [
    { id: 'book', label: 'Book', icon: BookOpen },
    { id: 'article', label: 'Article', icon: FileText },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'course', label: 'Course', icon: Users },
    { id: 'web', label: 'Web', icon: Globe },
    { id: 'other', label: 'Other', icon: Lightbulb }
];

const confidenceAffirmations: Record<number, string> = {
    1: "A honest starting point.",
    2: "The gears are turning.",
    3: "A logical understanding.",
    4: "Mastery in progress."
};

export default function AddTopicPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('capture');
    const [direction, setDirection] = useState(0);

    const [concept, setConcept] = useState('');
    const [level, setLevel] = useState<'beginner' | 'intermediate' | 'expert' | null>(null);
    const [confidence, setConfidence] = useState<number | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [showAffirmation, setShowAffirmation] = useState<string | null>(null);
    const [duplicateTopic, setDuplicateTopic] = useState<Topic | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [createdTopicId, setCreatedTopicId] = useState<string | null>(null);

    // Familiarity Step State
    const [subConcepts, setSubConcepts] = useState<{ id: string; name: string; checked: boolean }[]>([]);
    const [newConceptInput, setNewConceptInput] = useState('');

    const nextStep = (next: Step) => {
        setDirection(1);
        setCurrentStep(next);
        setShowAffirmation(null);
    };

    const handleInitialContinue = () => {
        if (!concept.trim()) return;

        const existingTopics = storage.getTopics();
        const duplicate = existingTopics.find(t => t.name.toLowerCase() === concept.trim().toLowerCase());

        if (duplicate) {
            setDuplicateTopic(duplicate);
            setShowDuplicateDialog(true);
        } else {
            // Proceed to Level Selection
            nextStep('level');
        }
    };

    const handleLevelSelect = (selectedLevel: 'beginner' | 'intermediate' | 'expert') => {
        setLevel(selectedLevel);

        // Generate sub-concepts based on level
        const concepts = getConceptsForLevel(concept.trim(), selectedLevel);
        const formattedConcepts = concepts.map((c, i) => ({
            id: i.toString(),
            name: c,
            checked: false
        }));

        setSubConcepts(formattedConcepts);
        nextStep('familiarity');
    };

    const handleAddSubConcept = () => {
        if (!newConceptInput.trim()) return;
        const newId = Math.random().toString(36).substr(2, 9);
        setSubConcepts([...subConcepts, { id: newId, name: newConceptInput.trim(), checked: false }]);
        setNewConceptInput('');
    };

    const toggleSubConcept = (id: string) => {
        setSubConcepts(subConcepts.map(c =>
            c.id === id ? { ...c, checked: !c.checked } : c
        ));
    };

    const handleContinueExisting = () => {
        if (duplicateTopic) {
            router.push(`/learn/${duplicateTopic.id}`);
        }
    };

    const handleAddConcepts = () => {
        if (!duplicateTopic) return;

        const topicLevel = duplicateTopic.level || 'beginner';
        setLevel(topicLevel);

        // 1. Get standard concepts for the level
        const standardConceptsStrings = getConceptsForLevel(duplicateTopic.name, topicLevel);

        // 2. Get existing concept texts for easier lookup
        const existingConceptTexts = new Set(duplicateTopic.concepts.map(c => c.text.toLowerCase()));

        // 3. Build subConcepts
        // Start with standard concepts
        const combinedSubConcepts: { id: string; name: string; checked: boolean }[] = standardConceptsStrings.map((text, index) => ({
            id: `std-${index}`,
            name: text,
            checked: existingConceptTexts.has(text.toLowerCase())
        }));

        // Add any existing concepts that were NOT in the standard list (custom ones)
        // We want to preserve them and show them as checked
        duplicateTopic.concepts.forEach(c => {
            const isStandard = standardConceptsStrings.some(s => s.toLowerCase() === c.text.toLowerCase());
            if (!isStandard) {
                combinedSubConcepts.push({
                    id: c.id,
                    name: c.text,
                    checked: true // It exists, so it's "checked" in the list
                });
            }
        });

        setSubConcepts(combinedSubConcepts);
        setShowDuplicateDialog(false);
        // Skip 'level' selection, go straight to concepts
        nextStep('familiarity');
    };

    const handleStartFresh = () => {
        if (duplicateTopic) {
            storage.deleteTopic(duplicateTopic.id);
            setDuplicateTopic(null);
            setShowDuplicateDialog(false);
            // Reset relevant state
            setLevel(null);
            setSubConcepts([]);
            setConfidence(null);
            setSource(null);
            setCreatedTopicId(null);
            // Go to Level selection correctly
            nextStep('level');
        }
    };

    const handleConfidenceSelect = (value: number) => {
        setConfidence(value);
        setShowAffirmation(confidenceAffirmations[value]);
        setTimeout(() => nextStep('source'), 1200);
    };

    const handleSourceSelect = (id: string) => {
        setSource(id);
        setTimeout(() => nextStep('confirmation'), 800);
    };

    const submitTopic = () => {
        if (concept && confidence !== null && level) {
            // Determine if we are updating an existing topic or creating a new one
            if (duplicateTopic) {
                // UPDATE existing topic
                const updatedTopic = { ...duplicateTopic };

                // Map the subConcepts state back to Topic concepts
                // If it was an existing concept, we update it. If new, we create it.
                updatedTopic.concepts = subConcepts.map(sc => {
                    // Try to find existing concept by ID (if it was preserved) or Text
                    const existing = duplicateTopic.concepts.find(c =>
                        c.id === sc.id || c.text.toLowerCase() === sc.name.toLowerCase()
                    );

                    if (existing) {
                        return { ...existing, familiar: sc.checked };
                    }

                    // New concept
                    return {
                        id: crypto.randomUUID(),
                        text: sc.name,
                        status: 'neutral',
                        familiar: sc.checked
                    } as Concept;
                });

                // Update memory score (simple average with new confidence)
                // confidence is 1-4. memoryScore is 0-100.
                const newConfidenceScore = confidence * 25;
                updatedTopic.memoryScore = Math.round((updatedTopic.memoryScore + newConfidenceScore) / 2);
                updatedTopic.level = level; // Ensure level is consistent

                storage.saveTopic(updatedTopic);
                setCreatedTopicId(updatedTopic.id);

            } else {
                // CREATE new topic
                const initialConcepts = subConcepts.map(sc => ({
                    id: sc.id,
                    text: sc.name,
                    status: 'neutral' as const,
                    familiar: sc.checked
                }));

                const newTopic = storage.createTopic(concept, level);
                newTopic.memoryScore = confidence * 25;
                // Overwrite concepts with user selection
                if (initialConcepts.length > 0) {
                    newTopic.concepts = initialConcepts;
                }

                storage.saveTopic(newTopic);
                setCreatedTopicId(newTopic.id);
            }
        }
        nextStep('exit');
    };

    const handleStartQuiz = () => {
        if (createdTopicId) {
            router.push(`/learn/${createdTopicId}`);
        } else {
            router.push('/');
        }
    };


    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0
        }),
        center: {
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 300 : -300,
            opacity: 0
        })
    };

    const renderStep = () => {
        switch (currentStep) {
            case 'capture':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Lightbulb className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                What did you just learn?
                            </h1>
                            <p className="text-xl text-muted-foreground font-light">
                                Short phrases work best. You can expand later.
                            </p>
                        </div>
                        <div className="w-full max-w-md space-y-6">
                            <Input
                                autoFocus
                                value={concept}
                                onChange={(e) => setConcept(e.target.value)}
                                placeholder="e.g., Closures in JavaScript"
                                className="w-full h-16 text-xl px-6 rounded-2xl border-2 focus-visible:ring-offset-2 bg-gradient-to-br from-background to-muted/10"
                                onKeyDown={(e) => e.key === 'Enter' && concept.trim() && handleInitialContinue()}
                            />
                            <Button
                                size="lg"
                                disabled={!concept.trim()}
                                className="w-full h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                                onClick={handleInitialContinue}
                            >
                                Continue <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                );

            case 'level':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Rate yourself in <span className="text-primary">{concept}</span>
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                We'll tailor the content to your expertise.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl">
                            {[
                                { id: 'beginner', label: 'Beginner', desc: 'Just starting out', classes: 'from-green-500/10 to-green-500/5' },
                                { id: 'intermediate', label: 'Intermediate', desc: 'Comfortable with basics', classes: 'from-blue-500/10 to-blue-500/5' },
                                { id: 'expert', label: 'Expert', desc: 'Deep understanding', classes: 'from-purple-500/10 to-purple-500/5' }
                            ].map((lvl) => {
                                const levelConcepts = getConceptsForLevel(concept.trim(), lvl.id as any);
                                const previewText = levelConcepts.slice(0, 3).join(', ') + (levelConcepts.length > 3 ? '...' : '');

                                return (
                                    <button
                                        key={lvl.id}
                                        onClick={() => handleLevelSelect(lvl.id as any)}
                                        className={cn(
                                            "group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden",
                                            "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]",
                                            `bg-gradient-to-br ${lvl.classes}`
                                        )}
                                    >
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="space-y-2">
                                                <div>
                                                    <div className="text-xl font-bold">{lvl.label}</div>
                                                    <div className="text-sm text-muted-foreground font-medium">{lvl.desc}</div>
                                                </div>
                                                <div className="text-xs text-muted-foreground/80 mt-4 bg-background/50 px-3 py-2 rounded-lg block">
                                                    <span className="font-semibold block mb-1">Includes:</span>
                                                    <ul className="list-disc list-inside space-y-0.5">
                                                        {levelConcepts.slice(0, 4).map((c, i) => (
                                                            <li key={i} className="truncate">{c}</li>
                                                        ))}
                                                        {levelConcepts.length > 4 && <li>+{levelConcepts.length - 4} more</li>}
                                                    </ul>
                                                </div>
                                            </div>
                                            <div className="w-10 h-10 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ArrowRight className="w-5 h-5 text-primary" />
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                );

            case 'familiarity':
                return (
                    <div className="flex flex-col items-center text-center space-y-8 max-w-xl mx-auto w-full">
                        {/* Selected Level Header */}
                        <div className={cn(
                            "w-full p-6 rounded-2xl border-2 bg-gradient-to-br text-left relative overflow-hidden",
                            level === 'beginner' ? 'from-green-500/10 to-green-500/5' :
                                level === 'intermediate' ? 'from-blue-500/10 to-blue-500/5' :
                                    'from-purple-500/10 to-purple-500/5'
                        )}>
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <div className="text-xl font-bold capitalize">{level}</div>
                                    <div className="text-sm text-muted-foreground">Concepts to review</div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs hover:bg-background/50"
                                    onClick={() => setCurrentStep('level')}
                                >
                                    Change Level
                                </Button>
                            </div>
                        </div>

                        <div className="w-full space-y-6 animate-fade-in-up">
                            <div className="space-y-4 text-left">
                                <h3 className="text-lg font-semibold px-1">Select topics to focus on:</h3>
                                <div className="bg-card/50 border rounded-3xl p-2 shadow-sm backdrop-blur-sm">
                                    {subConcepts.map((subConcept) => (
                                        <div
                                            key={subConcept.id}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all hover:bg-accent/50",
                                                subConcept.checked && "bg-primary/5"
                                            )}
                                            onClick={() => toggleSubConcept(subConcept.id)}
                                        >
                                            <div className={cn(
                                                "w-6 h-6 rounded border-2 transition-all flex items-center justify-center flex-shrink-0",
                                                subConcept.checked ? "bg-primary border-primary" : "border-muted-foreground/30"
                                            )}>
                                                {subConcept.checked && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                                            </div>
                                            <span className={cn(
                                                "text-base transition-colors",
                                                subConcept.checked ? "text-foreground font-medium" : "text-muted-foreground"
                                            )}>
                                                {subConcept.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>


                            <div className="bg-card/50 border rounded-3xl p-8 text-left space-y-6 shadow-sm backdrop-blur-sm">
                                <h3 className="text-xl font-semibold">Add More Concepts</h3>
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Know other concepts not listed? Add them here.</p>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newConceptInput}
                                            onChange={(e) => setNewConceptInput(e.target.value)}
                                            placeholder="e.g., List comprehension, Lambda functions..."
                                            className="h-12 rounded-xl bg-background border-muted-foreground/20"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubConcept()}
                                        />
                                        <Button
                                            className="h-12 w-12 rounded-xl"
                                            onClick={handleAddSubConcept}
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Button
                            size="lg"
                            className="w-full max-w-xs h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                            onClick={() => nextStep('confidence')}
                        >
                            Next <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                );

            case 'confidence':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Lightbulb className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                How well do you know it?
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                Be honest. This helps us schedule your reviews.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            {confidenceLevels.map((level) => (
                                <button
                                    key={level.value}
                                    onClick={() => handleConfidenceSelect(level.value)}
                                    className={cn(
                                        "group relative p-6 rounded-2xl border-2 transition-all duration-300",
                                        "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]",
                                        "bg-gradient-to-br from-background to-muted/20",
                                        confidence === level.value && "border-primary bg-primary/5"
                                    )}
                                >
                                    <div className="text-4xl mb-3">{level.emoji}</div>
                                    <div className="text-sm font-medium">{level.label}</div>
                                </button>
                            ))}
                        </div>
                        {showAffirmation && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-primary font-medium"
                            >
                                {showAffirmation}
                            </motion.div>
                        )}
                    </div>
                );

            case 'source':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Lightbulb className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Where did you learn this?
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                Optional, but helps track your learning sources.
                            </p>
                        </div>
                        <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                            {sources.map((src) => {
                                const Icon = src.icon;
                                return (
                                    <button
                                        key={src.id}
                                        onClick={() => handleSourceSelect(src.id)}
                                        className={cn(
                                            "group relative p-6 rounded-2xl border-2 transition-all duration-300",
                                            "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]",
                                            "bg-gradient-to-br from-background to-muted/20",
                                            source === src.id && "border-primary bg-primary/5"
                                        )}
                                    >
                                        <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                                        <div className="text-xs font-medium">{src.label}</div>
                                    </button>
                                );
                            })}
                        </div>
                        <Button
                            variant="ghost"
                            size="lg"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => nextStep('confirmation')}
                        >
                            Skip this step
                        </Button>
                    </div>
                );

            case 'confirmation':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Lightbulb className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                You'll review this on:
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                Spaced repetition optimizes retention.
                            </p>
                        </div>
                        <div className="w-full max-w-md space-y-4">
                            {[
                                { day: 'Day 3', delay: 0 },
                                { day: 'Day 7', delay: 200 },
                                { day: 'Day 21', delay: 400 }
                            ].map((item) => (
                                <motion.div
                                    key={item.day}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: item.delay / 1000 }}
                                    className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border-l-4 border-primary/50"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-sm font-bold text-primary">{item.day}</span>
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium">{concept}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <Button
                            size="lg"
                            className="w-full max-w-xs h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                            onClick={submitTopic}
                        >
                            Save & Continue <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                );

            case 'exit':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-500/5 flex items-center justify-center"
                            >
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            </motion.div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Topic saved!
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                We'll remind you when it's time to review.
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 w-full max-w-xs">
                            <Button
                                size="lg"
                                className="w-full max-w-xs h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                                onClick={handleStartQuiz}
                            >
                                Start Quiz <ArrowRight className="ml-2 w-5 h-5" />
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full max-w-xs h-14 text-lg rounded-full"
                                onClick={() => router.push('/')}
                            >
                                Back to Dashboard
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background pointer-events-none" />

            {/* Exit button */}
            <div className="absolute top-6 right-6 z-50">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 rounded-full bg-background/80 hover:bg-muted backdrop-blur-sm border"
                    onClick={() => router.push('/')}
                >
                    <X className="h-5 w-5 text-muted-foreground" />
                </Button>
            </div>

            <div className="w-full max-w-4xl px-6 relative z-10">
                <AnimatePresence mode='wait' custom={direction}>
                    <motion.div
                        key={currentStep}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                    >
                        {renderStep()}
                    </motion.div>
                </AnimatePresence>

                {/* Progress Indicators */}
                {currentStep !== 'exit' && (
                    <div className="flex justify-center gap-2 mt-16">
                        {['capture', 'familiarity' /* level merged visually */, 'confidence', 'source', 'confirmation'].map((step, index) => {
                            const stepIndex = ['capture', 'familiarity', 'confidence', 'source', 'confirmation'].indexOf(step);
                            let normalizedCurrentStep = currentStep;
                            if (currentStep === 'level') normalizedCurrentStep = 'familiarity';

                            const currentIndex = ['capture', 'familiarity', 'confidence', 'source', 'confirmation'].indexOf(normalizedCurrentStep);

                            return (
                                <div
                                    key={step}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-500 ease-out",
                                        stepIndex <= currentIndex
                                            ? "w-8 bg-primary"
                                            : "w-1 bg-muted-foreground/20"
                                    )}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <AlertDialogContent className="rounded-[2rem] border-0 bg-background/95 backdrop-blur-xl shadow-2xl max-w-md p-8">
                    <AlertDialogHeader className="space-y-4">
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-2">
                            <Lightbulb className="w-8 h-8 text-amber-500" />
                        </div>
                        <AlertDialogTitle className="text-2xl font-bold text-center">Topic already exists</AlertDialogTitle>
                        <AlertDialogDescription className="text-center text-lg text-muted-foreground">
                            "<span className="text-foreground font-semibold">{duplicateTopic?.name}</span>" is already in your learning loop.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-3 mt-8 space-y-2">
                        <Button
                            className="w-full rounded-xl h-14 text-lg font-medium shadow-lg hover:shadow-xl transition-all"
                            onClick={handleContinueExisting}
                        >
                            Continue Learning
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full rounded-xl h-14 text-lg font-medium bg-secondary/50 hover:bg-secondary/80"
                            onClick={handleAddConcepts}
                        >
                            Add New Concepts
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full rounded-xl h-12 text-base text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                            onClick={handleStartFresh}
                        >
                            Delete & Start Fresh
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
