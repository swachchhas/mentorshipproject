import { useState, useEffect } from 'react';
import { QuizAttempt } from '@/lib/storage/quiz-history-storage';
import { Topic, Concept } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar, Clock, Filter, Brain, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { questionsStorage } from '@/lib/storage/questions-storage';

interface QuizHistoryModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    topic: Topic | null;
    history: QuizAttempt[];
    onRetakeQuiz: (attemptId: string) => void;
}

export function QuizHistoryModal({ open, onOpenChange, topic, history, onRetakeQuiz }: QuizHistoryModalProps) {
    const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
    const [filterConcept, setFilterConcept] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [questionsMap, setQuestionsMap] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open && topic) {
            const storedQuestions = questionsStorage.getQuestionsForTopic(topic.id);
            const map: Record<string, string> = {};
            storedQuestions.forEach(q => {
                map[q.id] = q.question;
            });
            setQuestionsMap(map);
        }
    }, [open, topic]);

    if (!topic) return null;

    const selectedAttempt = history.find(h => h.id === selectedAttemptId);

    const filteredHistory = history.filter(h => {
        if (filterType !== 'all' && h.type !== filterType) return false;
        if (filterConcept !== 'all') {
            return h.targetConceptId === filterConcept || h.conceptBreakdown.some(cb => cb.conceptId === filterConcept);
        }
        return true;
    });

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-600 dark:text-green-400 border-green-200 bg-green-500/10";
        if (score >= 60) return "text-yellow-600 dark:text-yellow-400 border-yellow-200 bg-yellow-500/10";
        return "text-red-600 dark:text-red-400 border-red-200 bg-red-500/10";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 overflow-hidden">
                {!selectedAttempt ? (
                    // ListView
                    <>
                        <div className="p-6 pb-2 border-b">
                            <DialogHeader>
                                <DialogTitle className="text-xl flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-primary" />
                                    Quiz History: {topic.name}
                                </DialogTitle>
                                <DialogDescription>
                                    Review your past quiz performances and concept mastery.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="flex items-center gap-3 mt-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Filters:</span>
                                </div>
                                <Select value={filterType} onValueChange={setFilterType}>
                                    <SelectTrigger className="w-[140px] h-8 text-xs">
                                        <SelectValue placeholder="Quiz Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Types</SelectItem>
                                        <SelectItem value="topic">Topic Quizzes</SelectItem>
                                        <SelectItem value="concept">Concept Quizzes</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={filterConcept} onValueChange={setFilterConcept}>
                                    <SelectTrigger className="w-[180px] h-8 text-xs">
                                        <SelectValue placeholder="Filter by Concept" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Concepts</SelectItem>
                                        {topic.concepts.map(c => (
                                            <SelectItem key={c.id} value={c.id}>{c.text}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            {filteredHistory.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                    <Brain className="w-12 h-12 mb-4 opacity-20" />
                                    <p>No quiz history found for these filters.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredHistory.map(attempt => (
                                        <div
                                            key={attempt.id}
                                            className="border rounded-xl p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                                            onClick={() => setSelectedAttemptId(attempt.id)}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold text-base">
                                                            {format(new Date(attempt.completedAt), 'MMM d, yyyy - h:mm a')}
                                                        </span>
                                                        <Badge variant="secondary" className="text-[10px] uppercase">
                                                            {attempt.type} quiz
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                        <span className="flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                            {attempt.correctCount}/{attempt.totalCount} correct
                                                        </span>
                                                        {attempt.durationSeconds && (
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3" />
                                                                {Math.floor(attempt.durationSeconds / 60)}m {attempt.durationSeconds % 60}s
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className={`text-xl font-bold px-3 py-1 rounded-lg border ${getScoreColor(attempt.score)}`}>
                                                    {attempt.score}%
                                                </div>
                                            </div>

                                            {/* Concept mini-breakdown */}
                                            {attempt.conceptBreakdown.length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                                                    {attempt.conceptBreakdown.slice(0, 3).map(cb => (
                                                        <div key={cb.conceptId} className="flex items-center gap-1.5 text-xs bg-background border px-2 py-1 rounded-md shadow-sm">
                                                            <span className="truncate max-w-[120px]" title={cb.conceptName || 'Concept'}>
                                                                {cb.conceptName || 'Concept'}
                                                            </span>
                                                            <span className={`font-semibold ${cb.score >= 70 ? 'text-green-600' : 'text-red-500'}`}>
                                                                {cb.score}%
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {attempt.conceptBreakdown.length > 3 && (
                                                        <span className="text-xs text-muted-foreground self-center px-1">
                                                            +{attempt.conceptBreakdown.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </>
                ) : (
                    // Detail View
                    <div className="flex flex-col h-full bg-muted/20">
                        <div className="p-4 border-b bg-background flex items-center justify-between sticky top-0 z-10">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedAttemptId(null)} className="gap-2">
                                <ArrowLeft className="w-4 h-4" /> Back to List
                            </Button>
                            <Button size="sm" onClick={() => {
                                onRetakeQuiz(selectedAttempt.id);
                                onOpenChange(false);
                            }}>
                                Retake Quiz
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-6">
                            <div className="max-w-3xl mx-auto space-y-8">
                                {/* Header Stats */}
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-bold mb-1">
                                            {format(new Date(selectedAttempt.completedAt), 'MMMM d, yyyy')}
                                        </h3>
                                        <div className="flex gap-3 text-sm text-muted-foreground">
                                            <Badge variant="outline">{selectedAttempt.type.toUpperCase()}</Badge>
                                            {selectedAttempt.durationSeconds && <span>{Math.floor(selectedAttempt.durationSeconds / 60)}m {selectedAttempt.durationSeconds % 60}s</span>}
                                        </div>
                                    </div>
                                    <div className={`text-4xl font-bold px-4 py-2 rounded-xl border ${getScoreColor(selectedAttempt.score)}`}>
                                        {selectedAttempt.score}%
                                    </div>
                                </div>

                                {/* Concept Breakdown */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg flex items-center gap-2">
                                        <Brain className="w-5 h-5 text-primary" /> Concept Performance
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {selectedAttempt.conceptBreakdown.map((cb) => (
                                            <div key={cb.conceptId} className="bg-background border rounded-lg p-3 flex justify-between items-center shadow-sm">
                                                <div className="truncate pr-4 flex-1">
                                                    <p className="font-medium text-sm truncate" title={cb.conceptName}>{cb.conceptName || 'Unknown Concept'}</p>
                                                    <p className="text-xs text-muted-foreground">{cb.correctCount} of {cb.totalCount} correct</p>
                                                </div>
                                                <Badge variant="outline" className={`shrink-0 ${getScoreColor(cb.score)}`}>
                                                    {cb.score}%
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Questions Review */}
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg border-b pb-2">Questions Review</h4>
                                    <div className="space-y-4">
                                        {selectedAttempt.questions.map((q, i) => (
                                            <div key={q.questionId} className={`p-4 rounded-xl border ${q.isCorrect ? 'bg-green-50/50 border-green-100 dark:bg-green-950/10 dark:border-green-900/30' : 'bg-red-50/50 border-red-100 dark:bg-red-950/10 dark:border-red-900/30'}`}>
                                                <div className="flex gap-3">
                                                    <div className="mt-0.5 shrink-0">
                                                        {q.isCorrect ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
                                                    </div>
                                                    <div className="space-y-3 flex-1">
                                                        <div>
                                                            <div className="flex gap-2 mb-2">
                                                                <Badge variant="secondary" className="text-[10px]">Q{i + 1}</Badge>
                                                                {q.conceptName && <Badge variant="outline" className="text-[10px] truncate max-w-[150px] bg-background">{q.conceptName}</Badge>}
                                                            </div>
                                                            <p className="text-sm font-medium">{questionsMap[q.questionId] || q.questionId.split('-').slice(4).join('-') || 'Question details unavailable.'}</p>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-2 text-sm pt-2">
                                                            <div className="bg-background/80 p-2 rounded border">
                                                                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Your Answer</span>
                                                                <span className={q.isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}>
                                                                    {q.userAnswer === '__correct__' ? 'Marked Correct' : (q.userAnswer || 'No answer provided')}
                                                                </span>
                                                            </div>
                                                            {!q.isCorrect && (
                                                                <div className="bg-background/80 p-2 rounded border border-green-200">
                                                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Correct Answer</span>
                                                                    <span className="text-foreground">{q.correctAnswer}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
