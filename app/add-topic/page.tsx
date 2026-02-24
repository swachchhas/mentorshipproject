'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, BookOpen, FileText, Video, Users, Globe, Lightbulb, CheckCircle2, Sparkles, Plus, Loader2, Clock, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { storage } from '@/lib/storage';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Topic, Concept } from '@/types';
import { schedulesStorage } from '@/lib/storage/schedules-storage';
import { questionsStorage } from '@/lib/storage/questions-storage';
import { timeframeToDays } from '@/lib/utils/schedule-calculator';

type Step = 'capture' | 'level' | 'timeframe' | 'commitment' | 'source' | 'confirmation' | 'generating' | 'exit';


const sources = [
    { id: 'book', label: 'Book', icon: BookOpen },
    { id: 'article', label: 'Article', icon: FileText },
    { id: 'video', label: 'Video', icon: Video },
    { id: 'course', label: 'Course', icon: Users },
    { id: 'web', label: 'Web', icon: Globe },
    { id: 'other', label: 'Other', icon: Lightbulb }
];

const timeframeOptions = [
    { value: '1 week', label: '1 Week', desc: 'Intensive, daily practice' },
    { value: '2 weeks', label: '2 Weeks', desc: 'Focused learning' },
    { value: '3 weeks', label: '3 Weeks', desc: 'Balanced pace' },
    { value: '1 month', label: '1 Month', desc: 'Relaxed, thorough' },
    { value: '3 months', label: '3 Months', desc: 'Long-term mastery' },
];

const commitmentOptions = [
    { value: 5, label: '5 min', desc: 'Quick reviews, 2-3 questions' },
    { value: 10, label: '10 min', desc: 'Standard session, 5-7 questions' },
    { value: 15, label: '15 min', desc: 'Focused session, 8-10 questions' },
    { value: 30, label: '30 min', desc: 'Deep practice, 15-20 questions' },
    { value: 60, label: '1 hour', desc: 'Intensive study, 30+ questions' },
];

export default function AddTopicPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('capture');
    const [direction, setDirection] = useState(0);

    const [concept, setConcept] = useState('');
    const [level, setLevel] = useState<'beginner' | 'intermediate' | 'expert' | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [duplicateTopic, setDuplicateTopic] = useState<Topic | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [createdTopicId, setCreatedTopicId] = useState<string | null>(null);

    // Familiarity Step State
    const [subConcepts, setSubConcepts] = useState<{ id: string; name: string; checked: boolean }[]>([]);
    const [newConceptInput, setNewConceptInput] = useState('');
    const [isLoadingConcepts, setIsLoadingConcepts] = useState(false);

    // Level concept previews — fetched for all 3 levels on topic entry
    const [levelPreviews, setLevelPreviews] = useState<Record<string, string[]>>({});
    const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);

    // Study Planning State
    const [selectedTimeframe, setSelectedTimeframe] = useState<string | null>(null);
    const [dailyCommitment, setDailyCommitment] = useState<number | null>(null);

    // Generation State
    const [generationStatus, setGenerationStatus] = useState('');
    const [generationProgress, setGenerationProgress] = useState(0);

    const nextStep = (next: Step) => {
        setDirection(1);
        setCurrentStep(next);
    };

    const handleInitialContinue = async () => {
        if (!concept.trim()) return;

        const existingTopics = storage.getTopics();
        const duplicate = existingTopics.find(t => t.name.toLowerCase() === concept.trim().toLowerCase());

        if (duplicate) {
            setDuplicateTopic(duplicate);
            setShowDuplicateDialog(true);
        } else {
            nextStep('level');
            // Pre-fetch concepts for all 3 levels in parallel
            setIsLoadingPreviews(true);
            const levels: ('beginner' | 'intermediate' | 'expert')[] = ['beginner', 'intermediate', 'expert'];
            const results: Record<string, string[]> = {};

            await Promise.all(levels.map(async (lvl) => {
                try {
                    const response = await fetch('/api/ai/generate-concepts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ topic: concept.trim(), level: lvl }),
                    });
                    const data = await response.json();
                    if (data.success && data.concepts.length > 0) {
                        results[lvl] = data.concepts;
                    }
                } catch {
                    // silent — fallback text stays
                }
            }));

            setLevelPreviews(results);
            setIsLoadingPreviews(false);
        }
    };

    // Replace the previous handleLevelSelect with an accordion-style toggle
    const toggleLevelSelect = (selectedLevel: 'beginner' | 'intermediate' | 'expert') => {
        if (level === selectedLevel) {
            setLevel(null); // Collapse if clicking the already open one
        } else {
            setLevel(selectedLevel);
        }

        // When a level is expanded, make sure it has the concepts populated
        const previewConcepts = levelPreviews[selectedLevel];
        if (previewConcepts && previewConcepts.length > 0) {
            const formattedConcepts = previewConcepts.map((c: string, i: number) => ({
                id: `ai-${i}`,
                name: c,
                checked: false // Check by default, mimicking refinement spec (now unchecked)
            }));
            setSubConcepts(formattedConcepts);
        } else if (!isLoadingPreviews) {
            // Fallback if pre-fetch failed for this level
            setSubConcepts([
                { id: 'fallback-0', name: `Core ${concept} principles`, checked: false },
                { id: 'fallback-1', name: `${concept} fundamentals`, checked: false },
                { id: 'fallback-2', name: `Applied ${concept}`, checked: false },
                { id: 'fallback-3', name: `${concept} best practices`, checked: false },
            ]);
        }
    };

    const handleContinueFromLevel = () => {
        if (!level) return;
        nextStep('timeframe');
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
        setShowDuplicateDialog(false);
        toggleLevelSelect(topicLevel);
    };

    const handleStartFresh = () => {
        if (duplicateTopic) {
            storage.deleteTopic(duplicateTopic.id);
            schedulesStorage.deleteSchedule(duplicateTopic.id);
            questionsStorage.deleteQuestionsForTopic(duplicateTopic.id);
            setDuplicateTopic(null);
            setShowDuplicateDialog(false);
            setLevel(null);
            setSubConcepts([]);
            setSource(null);
            setCreatedTopicId(null);
            setSelectedTimeframe(null);
            setDailyCommitment(null);
            nextStep('level');
        }
    };

    const handleTimeframeSelect = (value: string) => {
        setSelectedTimeframe(value);
        setTimeout(() => nextStep('commitment'), 600);
    };

    const handleCommitmentSelect = (value: number) => {
        setDailyCommitment(value);
        setTimeout(() => nextStep('source'), 600);
    };

    const handleSourceSelect = (id: string) => {
        setSource(id);
        setTimeout(() => nextStep('confirmation'), 800);
    };

    // Main submit — create topic, then generate schedule + quiz in background
    const submitTopic = async () => {
        if (!concept || !level || !selectedTimeframe || !dailyCommitment) return;

        nextStep('generating');
        setGenerationStatus('Creating your study plan...');
        setGenerationProgress(10);

        const selectedConcepts = subConcepts.filter(sc => sc.checked);
        if (selectedConcepts.length === 0) {
            // If none selected, use all
            subConcepts.forEach(sc => sc.checked = true);
        }
        const conceptsToUse = subConcepts.filter(sc => sc.checked).length > 0
            ? subConcepts.filter(sc => sc.checked)
            : subConcepts;

        // Create the topic
        const initialConcepts: Concept[] = conceptsToUse.map(sc => ({
            id: sc.id,
            text: sc.name,
            status: 'neutral' as const,
            familiar: sc.checked,
            aiGenerated: sc.id.startsWith('ai-'),
        }));

        const timeframeDays = timeframeToDays(selectedTimeframe);
        const newTopic = storage.createTopic(concept, level);
        newTopic.memoryScore = 0; // Starts at 0, only updated after quizzes
        newTopic.concepts = initialConcepts;
        newTopic.studyPlan = {
            selectedTimeframe,
            timeframeDays,
            dailyMinutes: dailyCommitment,
            targetDate: new Date(Date.now() + timeframeDays * 24 * 60 * 60 * 1000).toISOString(),
            questionsPerSession: 5, // Will be calculated
        };
        storage.saveTopic(newTopic);
        setCreatedTopicId(newTopic.id);
        setGenerationProgress(25);

        // Generate schedule
        try {
            setGenerationStatus('Generating study schedule...');
            const scheduleResponse = await fetch('/api/ai/generate-schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topicId: newTopic.id,
                    concepts: initialConcepts.map(c => ({ id: c.id, name: c.text })),
                    timeframeDays,
                    dailyMinutes: dailyCommitment,
                }),
            });
            const scheduleData = await scheduleResponse.json();

            if (scheduleData.success && scheduleData.schedule) {
                schedulesStorage.saveSchedule(scheduleData.schedule);
                newTopic.scheduleId = scheduleData.schedule.id;
                newTopic.studyPlan!.questionsPerSession = scheduleData.schedule.sessions[0]?.questionCount || 5;
                storage.saveTopic(newTopic);
            }
        } catch (e) {
            console.error('Schedule generation failed:', e);
        }
        setGenerationProgress(50);

        // Generate quiz questions for each concept
        setGenerationStatus('Generating quiz questions...');
        const conceptsForQuiz = initialConcepts;
        for (let i = 0; i < conceptsForQuiz.length; i++) {
            const c = conceptsForQuiz[i];
            const progress = 50 + Math.round(((i + 1) / conceptsForQuiz.length) * 45);
            setGenerationStatus(`Generating questions for "${c.text}"... (${i + 1}/${conceptsForQuiz.length})`);

            try {
                const quizResponse = await fetch('/api/ai/generate-quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: concept,
                        concept: c.text,
                        conceptId: c.id,
                        topicId: newTopic.id,
                        level,
                        count: 10,
                    }),
                });
                const quizData = await quizResponse.json();

                if (quizData.success && quizData.questions.length > 0) {
                    questionsStorage.saveQuestions(quizData.questions);
                }
            } catch (e) {
                console.error(`Quiz generation failed for ${c.text}:`, e);
            }
            setGenerationProgress(progress);
        }

        setGenerationProgress(100);
        setGenerationStatus('All done!');

        // Short delay to show completion before transitioning
        setTimeout(() => nextStep('exit'), 800);
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
                                {isLoadingPreviews ? 'AI is generating concepts for each level...' : 'Pick a level to see its concepts.'}
                            </p>
                        </div>

                        <div className="flex flex-col gap-4 w-full max-w-4xl">
                            {[
                                { id: 'beginner', label: 'Beginner', desc: '"I\'m new to this topic"', classes: 'from-green-500/10 to-green-500/5' },
                                { id: 'intermediate', label: 'Intermediate', desc: '"I know the basics"', classes: 'from-blue-500/10 to-blue-500/5' },
                                { id: 'expert', label: 'Expert', desc: '"I\'m experienced with this topic"', classes: 'from-purple-500/10 to-purple-500/5' }
                            ].map((lvl) => {
                                const isExpanded = level === lvl.id;

                                return (
                                    <div key={lvl.id} className="w-full">
                                        <button
                                            onClick={() => toggleLevelSelect(lvl.id as 'beginner' | 'intermediate' | 'expert')}
                                            disabled={isLoadingPreviews}
                                            className={cn(
                                                "w-full group relative p-6 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden flex items-center justify-between",
                                                "hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]",
                                                `bg-gradient-to-br ${lvl.classes}`,
                                                isExpanded && "border-primary bg-primary/5 shadow-md",
                                                isLoadingPreviews && "opacity-80 cursor-wait",
                                                !isExpanded && "rounded-b-2xl"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                                                    isExpanded ? "border-primary bg-primary" : "border-muted-foreground/30"
                                                )}>
                                                    {isExpanded && <div className="w-2.5 h-2.5 rounded-full bg-primary-foreground" />}
                                                </div>
                                                <div>
                                                    <div className="text-xl font-bold">{lvl.label}</div>
                                                    <div className="text-sm text-muted-foreground font-medium">{lvl.desc}</div>
                                                </div>
                                            </div>
                                            <div className="text-primary transition-transform duration-300">
                                                <svg
                                                    width="24"
                                                    height="24"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")}
                                                >
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </div>
                                        </button>

                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="p-6 border-2 border-t-0 border-primary rounded-b-2xl bg-card space-y-6">
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-between px-1">
                                                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Review Concepts</h3>
                                                                <span className="text-xs text-muted-foreground">{subConcepts.length} concepts</span>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                {isLoadingPreviews ? (
                                                                    <div className="col-span-full flex items-center gap-2 text-sm text-muted-foreground p-4">
                                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                                        <span>Generating concepts...</span>
                                                                    </div>
                                                                ) : subConcepts.length > 0 ? (
                                                                    subConcepts.map((subConcept) => (
                                                                        <div
                                                                            key={subConcept.id}
                                                                            className={cn(
                                                                                "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:bg-accent/50",
                                                                                subConcept.checked ? "border-primary/30 bg-primary/5" : "border-muted"
                                                                            )}
                                                                            onClick={() => toggleSubConcept(subConcept.id)}
                                                                        >
                                                                            <div className="mt-0.5 relative flex-shrink-0">
                                                                                <div className={cn(
                                                                                    "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                                                    subConcept.checked ? "bg-primary border-primary" : "border-input"
                                                                                )}>
                                                                                    {subConcept.checked && <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" />}
                                                                                </div>
                                                                            </div>
                                                                            <span className={cn(
                                                                                "text-sm leading-tight",
                                                                                subConcept.checked ? "text-foreground font-medium" : "text-muted-foreground"
                                                                            )}>
                                                                                {subConcept.name}
                                                                            </span>
                                                                        </div>
                                                                    ))
                                                                ) : (
                                                                    <div className="col-span-full text-sm text-muted-foreground p-4">
                                                                        No concepts matched.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Add Concept Field directly inside accordion */}
                                                        {subConcepts.length > 0 && !isLoadingPreviews && (
                                                            <div className="flex gap-2 max-w-md pt-2">
                                                                <Input
                                                                    value={newConceptInput}
                                                                    onChange={(e) => setNewConceptInput(e.target.value)}
                                                                    placeholder="Missing something? Add a concept..."
                                                                    className="h-10 text-sm rounded-lg"
                                                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubConcept()}
                                                                />
                                                                <Button
                                                                    size="sm"
                                                                    variant="secondary"
                                                                    className="h-10 px-4 rounded-lg"
                                                                    onClick={handleAddSubConcept}
                                                                >
                                                                    Add
                                                                </Button>
                                                            </div>
                                                        )}

                                                        <div className="pt-4 flex justify-end">
                                                            <Button
                                                                onClick={handleContinueFromLevel}
                                                                className="rounded-full px-8"
                                                            >
                                                                Continue <ArrowRight className="ml-2 w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );



            case 'timeframe':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Calendar className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                When do you want to master this?
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                We'll create a spaced repetition schedule to fit your timeline.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                            {timeframeOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleTimeframeSelect(option.value)}
                                    className={cn(
                                        "group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left",
                                        "hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]",
                                        "bg-gradient-to-br from-background to-muted/20",
                                        selectedTimeframe === option.value && "border-primary bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-bold">{option.label}</div>
                                            <div className="text-sm text-muted-foreground">{option.desc}</div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                );

            case 'commitment':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Clock className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Daily time commitment?
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                Even small consistent effort compounds over time.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-3 w-full max-w-md">
                            {commitmentOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleCommitmentSelect(option.value)}
                                    className={cn(
                                        "group relative p-5 rounded-2xl border-2 transition-all duration-300 text-left",
                                        "hover:border-primary/50 hover:shadow-lg hover:scale-[1.01]",
                                        "bg-gradient-to-br from-background to-muted/20",
                                        dailyCommitment === option.value && "border-primary bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="text-lg font-bold">{option.label}</div>
                                            <div className="text-sm text-muted-foreground">{option.desc}</div>
                                        </div>
                                        <ArrowRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                    </div>
                                </button>
                            ))}
                        </div>
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
                const selectedCount = subConcepts.filter(sc => sc.checked).length || subConcepts.length;
                const targetDate = selectedTimeframe ? new Date(Date.now() + timeframeToDays(selectedTimeframe) * 24 * 60 * 60 * 1000) : new Date();

                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                Your Learning Plan
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                AI will generate your personalized schedule and quiz questions.
                            </p>
                        </div>
                        <div className="w-full max-w-md space-y-4">
                            {[
                                { label: 'Topic', value: concept },
                                { label: 'Level', value: level ? level.charAt(0).toUpperCase() + level.slice(1) : '' },
                                { label: 'Concepts', value: `${selectedCount} selected` },
                                { label: 'Timeframe', value: selectedTimeframe || '' },
                                { label: 'Daily Commitment', value: `${dailyCommitment} minutes` },
                                { label: 'Target Date', value: targetDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
                            ].map((item, idx) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-muted/50 to-transparent border-l-4 border-primary/50"
                                >
                                    <span className="text-sm text-muted-foreground font-medium">{item.label}</span>
                                    <span className="font-semibold">{item.value}</span>
                                </motion.div>
                            ))}
                        </div>
                        <Button
                            size="lg"
                            className="w-full max-w-xs h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                            onClick={submitTopic}
                        >
                            Generate & Save <Sparkles className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                );

            case 'generating':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                                Building Your Learning System
                            </h2>
                            <p className="text-lg text-muted-foreground font-light">
                                {generationStatus}
                            </p>
                        </div>
                        <div className="w-full max-w-md space-y-3">
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
                                    initial={{ width: '0%' }}
                                    animate={{ width: `${generationProgress}%` }}
                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                />
                            </div>
                            <p className="text-sm text-muted-foreground">{generationProgress}% complete</p>
                        </div>
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
                                You're all set!
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                Your AI-powered study plan is ready. Start your first quiz now!
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

    const allSteps = ['capture', 'level', 'familiarity', 'timeframe', 'commitment', 'confidence', 'source', 'confirmation'];

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
                {!['exit', 'generating'].includes(currentStep) && (
                    <div className="flex justify-center gap-2 mt-16">
                        {['capture', 'level', 'timeframe', 'commitment', 'confidence', 'source', 'confirmation', 'generating', 'exit'].map((step, index) => {
                            const stepIndex = ['capture', 'level', 'timeframe', 'commitment', 'confidence', 'source', 'confirmation', 'generating', 'exit'].indexOf(step);
                            const currentIndex = ['capture', 'level', 'timeframe', 'commitment', 'confidence', 'source', 'confirmation', 'generating', 'exit'].indexOf(currentStep);

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
                            &quot;<span className="text-foreground font-semibold">{duplicateTopic?.name}</span>&quot; is already in Glauke.
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
