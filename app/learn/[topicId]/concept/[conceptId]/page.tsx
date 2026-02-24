'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic, Concept } from '@/types';
import { Button } from '@/components/ui/button';
import { Brain, ArrowLeft } from 'lucide-react';

export default function ConceptQuizPage() {
    const params = useParams();
    const router = useRouter();
    const topicId = params.topicId as string;
    const conceptId = params.conceptId as string;

    const [topic, setTopic] = useState<Topic | null>(null);
    const [concept, setConcept] = useState<Concept | null>(null);

    useEffect(() => {
        const storedTopics = storage.getTopics();
        const foundTopic = storedTopics.find(t => t.id === topicId);

        if (foundTopic) {
            setTopic(foundTopic);
            const foundConcept = foundTopic.concepts.find(c => c.id === conceptId);
            if (foundConcept) {
                setConcept(foundConcept);
            } else {
                router.push(`/cockpit`);
            }
        } else {
            router.push('/');
        }
    }, [topicId, conceptId, router]);

    if (!topic || !concept) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
                <Brain className="w-5 h-5 animate-bounce" /> Loading Concept...
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-background dot-grid flex flex-col items-center justify-center p-6">
            <div className="max-w-md w-fulltext-center space-y-6">
                <div>
                    <Button variant="ghost" className="mb-4" onClick={() => router.back()}>
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold mb-2">Deep Dive: {concept.text}</h1>
                    <p className="text-muted-foreground mb-8">
                        You are about to start a deep dive quiz focused strictly on <strong>{concept.text}</strong> from the topic <strong>{topic.name}</strong>.
                    </p>
                </div>

                <div className="bg-muted/50 border rounded-xl p-6 mb-8 text-center">
                    <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="font-medium">Ready to test your mastery?</p>
                </div>

                <Button
                    size="lg"
                    className="w-full h-14 text-lg"
                    // To do a concept quiz, we just route to the standard learn page but pass a query param or 
                    // we could have the learn page handle it. Let's pass a query param.
                    onClick={() => router.push(`/learn/${topic.id}?conceptId=${concept.id}`)}
                >
                    Start Concept Quiz
                </Button>
            </div>
        </div>
    );
}
