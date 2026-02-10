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
import { Topic } from '@/types';

type Step = 'capture' | 'familiarity' | 'confidence' | 'source' | 'confirmation' | 'exit';

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
    const [confidence, setConfidence] = useState<number | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [showAffirmation, setShowAffirmation] = useState<string | null>(null);
    const [duplicateTopic, setDuplicateTopic] = useState<Topic | null>(null);
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

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
            // Generate initial sub-concepts based on the topic name
            // In a real app, this might call an AI or fetch from database
            const initial = [
                { id: '1', name: `Basic principles of ${concept.trim()}`, checked: false },
                { id: '2', name: `Advanced application of ${concept.trim()}`, checked: false },
                { id: '3', name: `Common pitfalls in ${concept.trim()}`, checked: false }
            ];
            setSubConcepts(initial);
            nextStep('familiarity');
        }
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

    const handleStartFresh = () => {
        if (duplicateTopic) {
            storage.deleteTopic(duplicateTopic.id);
            setDuplicateTopic(null);
            setShowDuplicateDialog(false);
            nextStep('confidence');
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
        if (concept && confidence !== null) {
            const newTopic = storage.createTopic(concept);
            newTopic.memoryScore = confidence * 25;
            storage.saveTopic(newTopic);
        }
        nextStep('exit');
    };

    const handleAddAnother = () => {
        setConcept('');
        setConfidence(null);
        setSource(null);
        setShowAffirmation(null);
        setDirection(-1);
        setCurrentStep('capture');
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

            case 'familiarity':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                What concepts are you familiar with?
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                Select the concepts you already know about <span className="text-primary font-medium">{concept}</span>
                            </p>
                        </div>

                        <div className="w-full space-y-8">
                            <div className="bg-card/50 border rounded-3xl p-6 text-left space-y-4 shadow-sm backdrop-blur-sm">
                                {subConcepts.map((subConcept) => (
                                    <div
                                        key={subConcept.id}
                                        className="flex items-center gap-4 group cursor-pointer"
                                        onClick={() => toggleSubConcept(subConcept.id)}
                                    >
                                        <div className={cn(
                                            "w-6 h-6 rounded border-2 transition-all flex items-center justify-center",
                                            subConcept.checked ? "bg-primary border-primary" : "border-muted-foreground/30 group-hover:border-primary/50"
                                        )}>
                                            {subConcept.checked && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                                        </div>
                                        <span className={cn(
                                            "text-lg transition-colors",
                                            subConcept.checked ? "text-foreground font-medium" : "text-muted-foreground"
                                        )}>
                                            {subConcept.name}
                                        </span>
                                    </div>
                                ))}
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
                                className="w-full h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                                onClick={handleAddAnother}
                            >
                                Add Another
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full h-14 text-lg rounded-full"
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
                        {['capture', 'familiarity', 'confidence', 'source', 'confirmation'].map((step, index) => {
                            const stepIndex = ['capture', 'familiarity', 'confidence', 'source', 'confirmation'].indexOf(step);
                            const currentIndex = ['capture', 'familiarity', 'confidence', 'source', 'confirmation'].indexOf(currentStep);

                            return (
                                <div
                                    key={step}
                                    className={cn(
                                        "h-1 rounded-full transition-all duration-500 ease-out",
                                        step === currentStep
                                            ? "w-8 bg-primary"
                                            : stepIndex < currentIndex
                                                ? "w-1 bg-primary/40"
                                                : "w-1 bg-muted-foreground/20"
                                    )}
                                />
                            );
                        })}
                    </div>
                )}
            </div>

            <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <AlertDialogContent className="rounded-3xl border-2">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold">Topic already exists</AlertDialogTitle>
                        <AlertDialogDescription className="text-lg">
                            "{duplicateTopic?.name}" is already in your learning loop. How would you like to proceed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="flex-col sm:flex-col gap-2">
                        <Button
                            className="w-full rounded-full h-12 text-base"
                            onClick={handleContinueExisting}
                        >
                            Continue Learning
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full rounded-full h-12 text-base"
                            onClick={handleContinueExisting} // For now, "Add Concepts" is same as "Continue Learning"
                        >
                            Add New Concepts
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full rounded-full h-12 text-base text-destructive hover:text-destructive hover:bg-destructive/5"
                            onClick={handleStartFresh}
                        >
                            Start Fresh (Delete Existing)
                        </Button>
                        <AlertDialogCancel className="w-full rounded-full h-12 text-base border-none underline">
                            Cancel
                        </AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
