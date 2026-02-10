'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Brain, Target, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'welcome' | 'motivation' | 'commitment' | 'explanation' | 'completion';

const motivations = [
    { id: 'exam', label: 'Exam Prep', icon: '📚' },
    { id: 'career', label: 'Career Growth', icon: '💼' },
    { id: 'hobby', label: 'Personal Interest', icon: '🎨' },
    { id: 'other', label: 'Other', icon: '✨' }
];

const commitmentOptions = [
    { value: 5, label: '5 min/day' },
    { value: 10, label: '10 min/day' },
    { value: 15, label: '15 min/day' },
    { value: 30, label: '30 min/day' }
];

const affirmations: Record<string, string> = {
    exam: "High stakes, higher focus.",
    career: "Investing in yourself pays off.",
    hobby: "Passion is the best teacher.",
    other: "A unique path to mastery.",
    5: "That adds up.",
    10: "A logical daily habit.",
    15: "Building real momentum.",
    30: "Ambitious. We like it."
};

export default function OnboardingPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState<Step>('welcome');
    const [direction, setDirection] = useState(0);

    const [selectedMotivation, setSelectedMotivation] = useState<string | null>(null);
    const [selectedCommitment, setSelectedCommitment] = useState<number | null>(null);
    const [showAffirmation, setShowAffirmation] = useState<string | null>(null);

    const nextStep = (next: Step) => {
        setDirection(1);
        setCurrentStep(next);
        setShowAffirmation(null);
    };

    const handleMotivationSelect = (id: string) => {
        setSelectedMotivation(id);
        setShowAffirmation(affirmations[id]);
        setTimeout(() => nextStep('commitment'), 1200);
    };

    const handleCommitmentSelect = (value: number) => {
        setSelectedCommitment(value);
        setShowAffirmation(affirmations[value]);
        setTimeout(() => nextStep('explanation'), 1200);
    };

    const handleComplete = () => {
        localStorage.setItem('learning_loop_onboarding_completed', 'true');
        router.push('/');
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
            case 'welcome':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Brain className="w-8 h-8 text-primary" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                                You bring the learning.<br />We help it stick.
                            </h1>
                            <p className="text-xl text-muted-foreground font-light max-w-md mx-auto">
                                Science-backed spaced repetition to turn what you learn into lasting memory.
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className="w-full max-w-xs h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                            onClick={() => nextStep('motivation')}
                        >
                            Get Started <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                );

            case 'motivation':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Target className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                What brings you here?
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                This helps us tailor your experience.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            {motivations.map((motivation) => (
                                <button
                                    key={motivation.id}
                                    onClick={() => handleMotivationSelect(motivation.id)}
                                    className={cn(
                                        "group relative p-6 rounded-2xl border-2 transition-all duration-300",
                                        "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]",
                                        "bg-gradient-to-br from-background to-muted/20",
                                        selectedMotivation === motivation.id && "border-primary bg-primary/5"
                                    )}
                                >
                                    <div className="text-4xl mb-3">{motivation.icon}</div>
                                    <div className="text-base font-medium">{motivation.label}</div>
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

            case 'commitment':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Clock className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                How much time can you commit?
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                Even small, consistent effort compounds over time.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                            {commitmentOptions.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleCommitmentSelect(option.value)}
                                    className={cn(
                                        "group relative p-6 rounded-2xl border-2 transition-all duration-300",
                                        "hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]",
                                        "bg-gradient-to-br from-background to-muted/20",
                                        selectedCommitment === option.value && "border-primary bg-primary/5"
                                    )}
                                >
                                    <div className="text-2xl font-bold mb-2">{option.value}</div>
                                    <div className="text-sm text-muted-foreground">minutes daily</div>
                                </button>
                            ))}
                        </div>
                        {selectedCommitment && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-2"
                            >
                                <div className="text-primary font-medium">{showAffirmation}</div>
                                <div className="text-sm text-muted-foreground">
                                    That's <span className="font-semibold text-foreground">{selectedCommitment * 365}</span> minutes of learning this year.
                                </div>
                            </motion.div>
                        )}
                    </div>
                );

            case 'explanation':
                return (
                    <div className="flex flex-col items-center text-center space-y-12 max-w-xl mx-auto">
                        <div className="space-y-6">
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                                How it works
                            </h2>
                            <p className="text-xl text-muted-foreground font-light">
                                We use spaced repetition to strengthen your memory at optimal intervals.
                            </p>
                        </div>
                        <div className="w-full max-w-md space-y-6">
                            {[
                                { day: 'Day 1', label: 'Learn something new', delay: 0 },
                                { day: 'Day 3', label: 'First review', delay: 200 },
                                { day: 'Day 7', label: 'Second review', delay: 400 },
                                { day: 'Day 21', label: 'Long-term retention', delay: 600 }
                            ].map((item, index) => (
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
                                        <div className="font-medium">{item.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        <Button
                            size="lg"
                            className="w-full max-w-xs h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                            onClick={() => nextStep('completion')}
                        >
                            Continue <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
                    </div>
                );

            case 'completion':
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
                            <p className="text-xl text-muted-foreground font-light max-w-md mx-auto">
                                Ready to start building lasting knowledge?
                            </p>
                        </div>
                        <Button
                            size="lg"
                            className="w-full max-w-xs h-14 text-lg rounded-full shadow-sm hover:shadow-md transition-all"
                            onClick={handleComplete}
                        >
                            Start Learning <ArrowRight className="ml-2 w-5 h-5" />
                        </Button>
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
                <div className="flex justify-center gap-2 mt-16">
                    {['welcome', 'motivation', 'commitment', 'explanation', 'completion'].map((step, index) => {
                        const stepIndex = ['welcome', 'motivation', 'commitment', 'explanation', 'completion'].indexOf(step);
                        const currentIndex = ['welcome', 'motivation', 'commitment', 'explanation', 'completion'].indexOf(currentStep);

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
            </div>
        </div>
    );
}
