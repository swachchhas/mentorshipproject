'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic, QuizQuestion, QuizResult } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, XCircle, ArrowRight, Home as HomeIcon, Brain, Trophy, Plus, Trash2 } from 'lucide-react';
import { loadQuiz } from '@/lib/quiz-generator';
import { quizHistoryStorage, QuizAttempt } from '@/lib/storage/quiz-history-storage';
import { retentionCalculator } from '@/lib/utils/retention-calculator';
import { questionsStorage } from '@/lib/storage/questions-storage';
import { schedulesStorage } from '@/lib/storage/schedules-storage';
import { AIGeneratedQuestion } from '@/types/ai';

type Phase = 'concepts' | 'quiz' | 'result';

export default function LearnPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const topicId = params.topicId as string;
    const sessionId = searchParams.get('session');

    const [topic, setTopic] = useState<Topic | null>(null);
    const [phase, setPhase] = useState<Phase>('quiz');
    const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);

    // Added tracking state
    const [quizStartTime, setQuizStartTime] = useState<number>(0);

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
    const [shortAnswer, setShortAnswer] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);

    useEffect(() => {
        const conceptIdFromQuery = searchParams.get('conceptId');
        if (conceptIdFromQuery) {
            setSelectedConceptId(conceptIdFromQuery);
        }
    }, [searchParams]);

    useEffect(() => {
        const storedTopics = storage.getTopics();
        const foundTopic = storedTopics.find(t => t.id === topicId);

        if (foundTopic) {
            setTopic(foundTopic);

            // Try to load AI-generated questions first
            let loadedQuestions: QuizQuestion[] = [];

            if (sessionId) {
                // Load questions for specific session
                const schedule = schedulesStorage.getScheduleForTopic(foundTopic.id);
                if (schedule) {
                    const session = schedule.sessions.find(s => s.id === sessionId);
                    if (session) {
                        const aiQuestions = questionsStorage.getQuestionsForSession(
                            foundTopic.id,
                            session.conceptIds,
                            session.questionCount
                        );
                        if (aiQuestions.length > 0) {
                            loadedQuestions = aiQuestions.map(aiQToQuizQ);
                        }
                    }
                }
            }

            if (loadedQuestions.length === 0) {
                // Try loading any AI-generated questions for this topic
                // If we have a selected concept, prioritize those
                const aiQuestions = selectedConceptId
                    ? questionsStorage.getQuestionsForConcept(foundTopic.id, selectedConceptId)
                    : questionsStorage.getQuestionsForTopic(foundTopic.id);

                if (aiQuestions.length > 0) {
                    // Shuffle and pick up to 10
                    const shuffled = [...aiQuestions].sort(() => Math.random() - 0.5);
                    loadedQuestions = shuffled.slice(0, 10).map(aiQToQuizQ);
                }
            }

            if (loadedQuestions.length === 0) {
                // Fallback to old quiz-data.json system
                loadedQuestions = loadQuiz(
                    foundTopic.name,
                    foundTopic.concepts,
                    selectedConceptId ?? undefined
                );
            }

            setQuizQuestions(loadedQuestions);

            // Reset state
            setCurrentQuestionIndex(0);
            setScore(0);
            setAnswers({});
            setShowFeedback(false);
            setCorrectCount(0);
            setWeakConcepts(new Set());
            setShortAnswer('');
            setPhase('quiz');
        } else {
            router.push('/');
        }
    }, [topicId, router, selectedConceptId, sessionId]);

    // Convert AIGeneratedQuestion to QuizQuestion format
    function aiQToQuizQ(q: AIGeneratedQuestion): QuizQuestion {
        return {
            id: q.id,
            conceptId: q.conceptId,
            conceptName: q.conceptName,
            level: q.difficulty === 'beginner' ? 'basic' : q.difficulty === 'expert' ? 'pitfall' : 'advanced',
            question: q.question,
            type: q.type === 'short-answer' ? 'short-answer' : 'mcq',
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            keywords: q.keywords,
            acceptableAnswers: q.acceptableAnswers,
        };
    }

    const handleConceptToggle = (conceptId: string, checked: boolean) => {
        if (!topic) return;
        storage.updateConceptFamiliarity(topic.id, conceptId, checked);
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
        setQuizStartTime(Date.now());
        setPhase('quiz');
    };

    const handleAnswer = (answer: string) => {
        const currentQuestion = quizQuestions[currentQuestionIndex];
        if (!currentQuestion) return;

        let isCorrect = false;

        if (currentQuestion.type === 'mcq') {
            isCorrect = answer === currentQuestion.correctAnswer;
        } else if (currentQuestion.type === 'short-answer') {
            // Keyword-based evaluation
            isCorrect = evaluateShortAnswer(answer, currentQuestion);
        } else if (currentQuestion.type === 'card') {
            isCorrect = answer === 'correct';
        }

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

        if (currentQuestion.type === 'mcq' || currentQuestion.type === 'short-answer') {
            setShowFeedback(true);
        }
    };

    const evaluateShortAnswer = (answer: string, question: QuizQuestion): boolean => {
        const lowerAnswer = answer.toLowerCase().trim();

        // Check against acceptable answers
        if (question.acceptableAnswers) {
            const match = question.acceptableAnswers.some(aa =>
                lowerAnswer.includes(aa.toLowerCase())
            );
            if (match) return true;
        }

        // Check against keywords (at least 50% match)
        if (question.keywords && question.keywords.length > 0) {
            const matchCount = question.keywords.filter(k =>
                lowerAnswer.includes(k.toLowerCase())
            ).length;
            return matchCount >= Math.ceil(question.keywords.length * 0.5);
        }

        // Simple check: does it contain key parts of the correct answer
        const correctWords = question.correctAnswer.toLowerCase().split(' ')
            .filter(w => w.length > 3);
        const matchCount = correctWords.filter(w => lowerAnswer.includes(w)).length;
        return matchCount >= Math.ceil(correctWords.length * 0.4);
    };

    const handleRegenerate = async () => {
        if (!topic) return;
        setIsRegenerating(true);
        try {
            // If we have a selected concept, only regenerate that
            const conceptsToGen = selectedConceptId
                ? topic.concepts.filter(c => c.id === selectedConceptId)
                : topic.concepts;

            for (const concept of conceptsToGen) {
                const response = await fetch('/api/ai/generate-quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        topic: topic.name,
                        topicId: topic.id,
                        concept: concept.text,
                        conceptId: concept.id,
                        level: topic.level,
                        count: 5
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.questions) {
                        questionsStorage.saveQuestions(data.questions);
                    }
                }
            }

            // Reload the page to pick up new questions
            window.location.reload();
        } catch (error) {
            console.error('Failed to regenerate questions:', error);
            alert('Failed to generate new questions. Please try again.');
        } finally {
            setIsRegenerating(false);
        }
    };

    const nextQuestion = () => {
        if (currentQuestionIndex < quizQuestions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setShowFeedback(false);
            setShortAnswer('');
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = () => {
        if (!topic) return;

        const finalScore = Math.round((correctCount / quizQuestions.length) * 100);

        // Build Concept Breakdown
        const conceptStats: Record<string, { correct: number, total: number, name?: string }> = {};

        const detailedQuestions = quizQuestions.map((q) => {
            let isCorrect = false;
            const ans = answers[q.id];

            if (q.type === 'mcq') isCorrect = ans === q.correctAnswer;
            else if (q.type === 'short-answer') isCorrect = evaluateShortAnswer(ans || '', q);
            else if (q.type === 'card') isCorrect = ans === 'correct';

            if (!conceptStats[q.conceptId]) {
                conceptStats[q.conceptId] = { correct: 0, total: 0, name: q.conceptName || topic.concepts.find(c => c.id === q.conceptId)?.text };
            }
            conceptStats[q.conceptId].total += 1;
            if (isCorrect) conceptStats[q.conceptId].correct += 1;

            return {
                questionId: q.id,
                conceptId: q.conceptId,
                conceptName: q.conceptName,
                isCorrect,
                userAnswer: ans || '',
                correctAnswer: q.correctAnswer
            };
        });

        const conceptBreakdown = Object.keys(conceptStats).map(conceptId => ({
            conceptId,
            conceptName: conceptStats[conceptId].name,
            totalCount: conceptStats[conceptId].total,
            correctCount: conceptStats[conceptId].correct,
            score: Math.round((conceptStats[conceptId].correct / conceptStats[conceptId].total) * 100)
        }));

        // Construct full Quiz Attempt history
        const attemptDurationSeconds = Math.round((Date.now() - quizStartTime) / 1000);

        const historyAttempt: QuizAttempt = {
            id: `attempt-${Date.now()}`,
            topicId: topic.id,
            sessionId: sessionId || undefined,
            type: selectedConceptId ? 'concept' : 'topic',
            targetConceptId: selectedConceptId || undefined,
            score: finalScore,
            correctCount,
            totalCount: quizQuestions.length,
            completedAt: new Date().toISOString(),
            durationSeconds: attemptDurationSeconds,
            questions: detailedQuestions,
            conceptBreakdown
        };

        // Save Attempt
        quizHistoryStorage.saveAttempt(historyAttempt);

        // Calculate new Retention Scores
        const updatedHistory = quizHistoryStorage.getHistoryForTopic(topic.id);
        const newRetentionScore = retentionCalculator.calculateTopicScore(topic, updatedHistory);

        // Update concepts with new retention scores
        const updatedConcepts = topic.concepts.map((c) => ({
            ...c,
            retentionScore: retentionCalculator.calculateConceptScore(c.id, updatedHistory, topic.level)
        }));

        const result: QuizResult = {
            topicId: topic.id,
            score: finalScore,
            correctCount,
            totalCount: quizQuestions.length,
            weakConcepts: Array.from(weakConcepts)
        };

        // We need to update the topic with the new concepts and retention score
        // Assuming storage.updateTopicAfterQuiz handles memoryScore, we'll update the topic directly first
        const topicToUpdate: Topic = { ...topic, concepts: updatedConcepts, retentionScore: newRetentionScore };
        // We might need to add a storage.updateTopic method, but let's see if updateTopicAfterQuiz is enough or if we should modify it.
        // For now, let's update it in storage directly.
        storage.updateTopic(topicToUpdate);

        // Then call the existing method for side effects like scheduling
        storage.updateTopicAfterQuiz(topic.id, result);

        // Mark session as completed if we have a sessionId
        if (sessionId) {
            const schedule = schedulesStorage.getScheduleForTopic(topic.id);
            if (schedule) {
                schedulesStorage.markSessionComplete(schedule.id, sessionId, {
                    score: finalScore,
                    correctCount,
                    totalCount: quizQuestions.length,
                    completedAt: new Date().toISOString(),
                });
            }
        }

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
                    {/* Progress */}
                    <div className="space-y-2 animate-fade-in">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-medium text-muted-foreground">Question {currentQuestionIndex + 1} of {quizQuestions.length}</span>
                        </div>
                        <div className="flex gap-1 h-3">
                            {quizQuestions.map((q, idx) => {
                                let bgClass = "bg-muted";
                                if (idx < currentQuestionIndex) {
                                    const answer = answers[q.id];
                                    let isCorrect = false;
                                    if (q.type === 'mcq') isCorrect = answer === q.correctAnswer;
                                    else if (q.type === 'short-answer') isCorrect = answer === '__correct__';
                                    else isCorrect = answer === 'correct';
                                    bgClass = isCorrect ? "bg-green-500" : "bg-red-500";
                                } else if (idx === currentQuestionIndex) {
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
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                                {question.conceptName && (
                                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
                                        💡 {question.conceptName}
                                    </Badge>
                                )}
                                {question.type === 'short-answer' && (
                                    <Badge variant="outline" className="text-xs">Short Answer</Badge>
                                )}
                                {question.type === 'mcq' && (
                                    <Badge variant="outline" className="text-xs">Multiple Choice</Badge>
                                )}
                                {question.type === 'card' && (
                                    <Badge variant="outline" className="text-xs">Recall</Badge>
                                )}
                            </div>
                            <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {/* MCQ Options */}
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

                            {/* Short Answer Input */}
                            {question.type === 'short-answer' && (
                                <div className="space-y-4">
                                    {!showFeedback ? (
                                        <>
                                            <Input
                                                value={shortAnswer}
                                                onChange={(e) => setShortAnswer(e.target.value)}
                                                placeholder="Type your answer..."
                                                className="h-14 text-base"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && shortAnswer.trim()) {
                                                        const isCorrect = evaluateShortAnswer(shortAnswer, question);
                                                        if (isCorrect) {
                                                            handleAnswer('__correct__');
                                                        } else {
                                                            handleAnswer(shortAnswer);
                                                        }
                                                    }
                                                }}
                                            />
                                            <Button
                                                className="w-full h-12"
                                                disabled={!shortAnswer.trim()}
                                                onClick={() => {
                                                    const isCorrect = evaluateShortAnswer(shortAnswer, question);
                                                    if (isCorrect) {
                                                        handleAnswer('__correct__');
                                                    } else {
                                                        handleAnswer(shortAnswer);
                                                    }
                                                }}
                                            >
                                                Submit Answer
                                            </Button>
                                        </>
                                    ) : (
                                        <div className="bg-muted/50 p-6 rounded-xl border animate-in fade-in zoom-in-95 space-y-3">
                                            <div>
                                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Your Answer:</p>
                                                <p className="text-sm">{answers[question.id] === '__correct__' ? shortAnswer : answers[question.id]}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-1">Correct Answer:</p>
                                                <p className="text-base font-medium">{question.correctAnswer}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Card type (recall) */}
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

                        {/* Feedback + Explanation Footer */}
                        {showFeedback && answers[question.id] && (
                            <CardFooter className="bg-muted/30 flex flex-col gap-3 p-4 border-t rounded-b-xl">
                                {question.explanation && (
                                    <div className="w-full text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                                        <span className="font-semibold">Explanation: </span>{question.explanation}
                                    </div>
                                )}
                                <div className="w-full flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            let isCorrect = false;
                                            if (question.type === 'mcq') isCorrect = answers[question.id] === question.correctAnswer;
                                            else if (question.type === 'short-answer') isCorrect = answers[question.id] === '__correct__';
                                            else isCorrect = answers[question.id] === 'correct';
                                            return isCorrect
                                                ? <><CheckCircle2 className="text-green-600 w-5 h-5" /> <span className="font-semibold text-green-600">Correct!</span></>
                                                : <><XCircle className="text-red-600 w-5 h-5" /> <span className="font-semibold text-red-600">Incorrect</span></>;
                                        })()}
                                    </div>
                                    <Button size="default" onClick={nextQuestion} className="font-semibold px-6">
                                        {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'Finish Quiz'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
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
                    <Button size="lg" className="h-12" onClick={() => {
                        setCurrentQuestionIndex(0);
                        setScore(0);
                        setAnswers({});
                        setShowFeedback(false);
                        setCorrectCount(0);
                        setWeakConcepts(new Set());
                        setShortAnswer('');
                        setPhase('quiz');
                    }}>
                        <Plus className="mr-2 w-4 h-4" /> Redo Last Quiz
                    </Button>
                    <Button size="lg" variant="outline" className="h-12" onClick={handleRegenerate} disabled={isRegenerating}>
                        <Brain className={`mr-2 w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
                        {isRegenerating ? 'Generating...' : 'New Questions'}
                    </Button>
                    <Button variant="ghost" className="h-12" onClick={() => router.push('/')}>
                        <HomeIcon className="mr-2 w-4 h-4" /> Return Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
