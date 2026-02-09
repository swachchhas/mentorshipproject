'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic, QuizQuestion, QuizResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, ArrowRight, Home as HomeIcon, Brain, Trophy, Plus, Trash2 } from 'lucide-react';
import { loadQuiz } from '@/lib/quiz-generator';

type Phase = 'concepts' | 'quiz' | 'result';

export default function LearnPage() {
    const params = useParams();
    const router = useRouter();
    const topicId = params.topicId as string;

    const [topic, setTopic] = useState<Topic | null>(null);
    const [phase, setPhase] = useState<Phase>('concepts');
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

    // Concepts Selection State
    const [newConceptText, setNewConceptText] = useState('');

    // Quiz State
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [showFeedback, setShowFeedback] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);
    const [weakConcepts, setWeakConcepts] = useState<Set<string>>(new Set());
    const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

    useEffect(() => {
        const storedTopics = storage.getTopics();
        const foundTopic = storedTopics.find(t => t.id === topicId);

        if (foundTopic) {
            setTopic(foundTopic);
            const loadedQuiz = loadQuiz(
                foundTopic.name,
                foundTopic.concepts,
                selectedConceptId ?? undefined
            );
            setQuizQuestions(loadedQuiz);

            // Reset state
            setCurrentQuestionIndex(0);
            setScore(0);
            setAnswers({});
            setShowFeedback(false);
            setCorrectCount(0);
            setWeakConcepts(new Set());
            setPhase('concepts');
        } else {
            router.push('/');
        }
    }, [topicId, router, selectedConceptId]);

    const handleConceptToggle = (conceptId: string, checked: boolean) => {
        if (!topic) return;
        storage.updateConceptFamiliarity(topic.id, conceptId, checked);

        // Update local state
        setTopic({
            ...topic,
            concepts: topic.concepts.map(c =>
                c.id === conceptId ? { ...c, familiar: checked } : c
            )
        });
    };

    const handleAddConcept = () => {
        if (!topic || !newConceptText.trim()) return;

        const newConcept = storage.addCustomConcept(topic.id, newConceptText.trim());
        if (newConcept) {
            setTopic({
                ...topic,
                concepts: [...topic.concepts, newConcept]
            });
            setNewConceptText('');
        }
    };

    const handleDeleteConcept = (conceptId: string) => {
        if (!topic) return;
        // Simple confirm for MVP
        if (confirm("Delete this concept?")) {
            storage.deleteConcept(topic.id, conceptId);
            setTopic({
                ...topic,
                concepts: topic.concepts.filter(c => c.id !== conceptId)
            });
        }
    };

    const handleStartQuiz = () => {
        if (!quizQuestions.length) {
            alert("No questions available for this topic.");
            return;
        }
        setPhase('quiz');
    };

    const handleAnswer = (answer: string) => {
        const currentQuestion = quizQuestions[currentQuestionIndex];
        if (!currentQuestion) return;

        const isCorrect = currentQuestion.type === 'mcq'
            ? answer === currentQuestion.correctAnswer
            : answer === 'correct';

        if (isCorrect) {
            setScore(prev => prev + 10);
            setCorrectCount(prev => prev + 1);
        } else {
            setWeakConcepts(prev => {
                const next = new Set(prev);
                next.add(currentQuestion.conceptId);
                return next;
            });
        }

        setAnswers(prev => ({ ...prev, [currentQuestion.id]: answer }));

        if (currentQuestion.type === 'mcq') {
            setShowFeedback(true);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            // Immediate transition, no loading
            setCurrentQuestionIndex(prev => prev + 1);
            setShowFeedback(false);
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        if (!topic) return;

        const finalScore = Math.round((correctCount / quizQuestions.length) * 100);

        const result: QuizResult = {
            topicId: topic.id,
            score: finalScore,
            correctCount,
            totalCount: quizQuestions.length,
            weakConcepts: Array.from(weakConcepts)
        };

        storage.updateTopicAfterQuiz(topic.id, result);
        setPhase('result');
        const storedTopics = storage.getTopics();
        const updatedTopic = storedTopics.find(t => t.id === topicId);
        if (updatedTopic) setTopic(updatedTopic);
    };

    if (!topic) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
    );

    // --- VIEW: CONCEPTS SELECTION ---
    if (phase === 'concepts') {
        return (
            <div className="min-h-screen bg-background dot-grid">
                <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-6">
                    <div className="space-y-2 animate-fade-in">
                        <h1 className="text-2xl lg:text-3xl font-bold">
                            What concepts are you familiar with?
                        </h1>
                        <p className="text-muted-foreground">
                            Select the concepts you already know about <span className="text-primary font-medium">{topic.name}</span>
                        </p>
                    </div>

                    {/* Concept Checkboxes */}
                    <Card className="border animate-slide-up delay-100">
                        <CardContent className="p-6 space-y-4">
                            {topic.concepts.map((concept) => (
                                <div key={concept.id} className="group flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors">
                                    <Checkbox
                                        id={concept.id}
                                        checked={concept.familiar || false}
                                        onCheckedChange={(checked) => handleConceptToggle(concept.id, checked as boolean)}
                                        className="mt-0.5"
                                    />
                                    <label
                                        htmlFor={concept.id}
                                        className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer pt-0.5"
                                    >
                                        {concept.text}
                                        {concept.status !== 'neutral' && (
                                            <Badge variant="outline" className={`ml-2 ${concept.status === 'strong' ? 'text-green-600 border-green-300' : 'text-red-600 border-red-300'}`}>
                                                {concept.status}
                                            </Badge>
                                        )}
                                    </label>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteConcept(concept.id);
                                        }}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-muted-foreground hover:text-destructive"
                                        title="Delete concept"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Add Custom Concept */}
                    <Card className="border animate-slide-up delay-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base">Add More Concepts</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Know other concepts not listed? Add them here.
                            </p>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="e.g., List comprehension, Lambda functions..."
                                    value={newConceptText}
                                    onChange={(e) => setNewConceptText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddConcept()}
                                    className="flex-1"
                                />
                                <Button
                                    onClick={handleAddConcept}
                                    disabled={!newConceptText.trim()}
                                    size="icon"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="pt-4 animate-slide-up delay-300">
                        <Button size="lg" className="h-12 px-8" onClick={handleStartQuiz}>
                            Start Quiz
                            <ArrowRight className="ml-2 w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: QUIZ ---
    if (phase === 'quiz') {
        const question = quizQuestions[currentQuestionIndex];
        if (!question) return <div className="p-8 text-center">No quiz questions found.</div>;

        return (
            <div className="min-h-screen bg-background dot-grid">
                <div className="max-w-2xl mx-auto p-6 lg:p-10 space-y-6 min-h-screen flex flex-col justify-center">
                    {/* Simplified "Tic-Tac-Toe" Style Progress */}
                    <div className="space-y-2 animate-fade-in">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                        </div>
                        <div className="flex gap-1 h-3">
                            {quizQuestions.map((q, idx) => {
                                let bgClass = "bg-muted"; // Default future
                                if (idx < currentQuestionIndex) {
                                    // Past question
                                    const answer = answers[q.id];
                                    const isCorrect = q.type === 'mcq'
                                        ? answer === q.correctAnswer
                                        : answer === 'correct';
                                    bgClass = isCorrect ? "bg-green-500" : "bg-red-500";
                                } else if (idx === currentQuestionIndex) {
                                    // Current
                                    bgClass = "bg-primary animate-pulse";
                                }

                                return (
                                    <div key={idx} className={`flex-1 rounded-full transition-all duration-300 ${bgClass}`} />
                                );
                            })}
                        </div>
                    </div>

                    {/* Question Card */}
                    <Card className="border shadow-lg" key={currentQuestionIndex}>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {question.type === 'mcq' && (
                                <div className="grid gap-2">
                                    {question.options?.map((option, i) => {
                                        const isCorrect = option === question.correctAnswer;
                                        const isSelected = answers[question.id] === option;

                                        let buttonClass = "w-full justify-start text-left h-auto py-4 px-4 text-sm border-2 transition-all";
                                        let badgeClass = "mr-3 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0";

                                        if (showFeedback) {
                                            if (isCorrect) {
                                                buttonClass += " bg-emerald-500 text-white border-emerald-600 shadow-md";
                                                badgeClass += " bg-white text-emerald-600";
                                            } else if (isSelected) {
                                                buttonClass += " bg-red-100 border-red-300 text-red-900";
                                                badgeClass += " bg-red-200 text-red-700";
                                            } else {
                                                buttonClass += " border-muted bg-muted/20 opacity-60";
                                                badgeClass += " bg-muted text-muted-foreground";
                                            }
                                        } else {
                                            buttonClass += " hover:border-primary hover:bg-primary/5 bg-background";
                                            badgeClass += " bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground";
                                        }

                                        return (
                                            <Button
                                                key={i}
                                                variant="ghost"
                                                className={buttonClass}
                                                onClick={() => !showFeedback && handleAnswer(option)}
                                                disabled={showFeedback}
                                            >
                                                <span className={badgeClass}>
                                                    {String.fromCharCode(65 + i)}
                                                </span>
                                                <span className="font-medium leading-snug break-words text-wrap flex-1">
                                                    {option}
                                                </span>
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}

                            {question.type === 'card' && (
                                <div className="space-y-4">
                                    {!showFeedback ? (
                                        <Button className="w-full h-12 text-base" variant="secondary" onClick={() => setShowFeedback(true)}>
                                            Show Answer
                                        </Button>
                                    ) : (
                                        <div className="bg-muted/50 p-6 rounded-xl border animate-in fade-in zoom-in-95">
                                            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 font-semibold">Answer:</p>
                                            <p className="text-lg font-medium mb-6">{question.correctAnswer}</p>

                                            {!answers[question.id] && (
                                                <div className="flex gap-3">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-red-200 hover:bg-red-50 hover:text-red-600 h-12"
                                                        onClick={() => handleAnswer('incorrect')}
                                                    >
                                                        I forgot
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 border-green-200 hover:bg-green-50 hover:text-green-600 h-12"
                                                        onClick={() => handleAnswer('correct')}
                                                    >
                                                        I remembered
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>

                        {((showFeedback && question.type === 'mcq') || (showFeedback && answers[question.id] && question.type === 'card')) && (
                            <CardFooter className="bg-muted/30 flex justify-between items-center p-4 border-t rounded-b-xl">
                                <div className="flex items-center gap-2">
                                    {(question.type === 'mcq' ? answers[question.id] === question.correctAnswer : answers[question.id] === 'correct')
                                        ? <><CheckCircle2 className="text-green-600 w-5 h-5" /> <span className="font-semibold text-green-600">Correct!</span></>
                                        : <><XCircle className="text-red-600 w-5 h-5" /> <span className="font-semibold text-red-600">Incorrect</span></>
                                    }
                                </div>
                                <Button size="default" onClick={nextQuestion} className="font-semibold px-6">
                                    {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    // --- VIEW: RESULT ---
    const finalPercentage = Math.round((correctCount / quizQuestions.length) * 100);
    const isExcellent = finalPercentage >= 80;

    return (
        <div className="min-h-screen bg-background dot-grid">
            <div className="max-w-md mx-auto p-6 lg:p-10 min-h-screen flex flex-col justify-center text-center space-y-6">
                <div className="flex justify-center animate-fade-in">
                    <div className={`p-4 rounded-2xl ${isExcellent ? 'bg-primary/10' : 'bg-muted'}`}>
                        {isExcellent ? (
                            <Trophy className="w-12 h-12 text-primary" />
                        ) : (
                            <Brain className="w-12 h-12 text-muted-foreground" />
                        )}
                    </div>
                </div>

                <div className="space-y-2 animate-slide-up delay-100">
                    <h1 className="text-3xl font-bold">Session Complete</h1>
                    <p className="text-muted-foreground">
                        {isExcellent ? "Excellent work. You demonstrated strong retention of these concepts." : "Good practice. Regular review strengthens long-term memory."}
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4 animate-slide-up delay-200">
                    <Card className="border">
                        <CardContent className="pt-6 pb-4">
                            <div className="text-4xl font-bold text-primary">{finalPercentage}%</div>
                            <p className="text-xs text-muted-foreground mt-1">Quiz Score</p>
                        </CardContent>
                    </Card>
                    <Card className="border">
                        <CardContent className="pt-6 pb-4">
                            <div className="text-4xl font-bold">{topic.memoryScore}%</div>
                            <p className="text-xs text-muted-foreground mt-1">Memory Score</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex flex-col gap-2 animate-slide-up delay-300">
                    <Button size="lg" className="h-12" onClick={() => router.push('/')}>
                        <HomeIcon className="mr-2 w-4 h-4" /> Return Home
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/cockpit')}>
                        View Cockpit
                    </Button>
                </div>
            </div>
        </div>
    );
}
