'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen, Brain, Clock, Sparkles, Search, Plus } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [topicName, setTopicName] = useState('');
  const [dueTopics, setDueTopics] = useState<Topic[]>([]);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);

  useEffect(() => {
    // Basic data fetching
    const allTopics = storage.getTopics();
    const now = new Date();
    const due = allTopics.filter(t => new Date(t.nextReviewDate) <= now);
    const recent = allTopics
      .sort((a, b) => new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime())
      .slice(0, 4);

    setDueTopics(due);
    setRecentTopics(recent);
  }, []);

  const handleStartLearning = () => {
    // If user types here, we can pass it to the add-topic page? 
    // Or just redirect to /add-topic and let them type there.
    // For now, let's just redirect to the new flow.
    router.push('/add-topic');
  };

  return (
    <div className="min-h-screen bg-background dot-grid relative">

      {/* Profile/Settings Placeholder (Top Right) */}
      <div className="absolute top-6 right-6">
        <Button variant="ghost" size="icon" className="rounded-full h-10 w-10 bg-background/50 hover:bg-muted">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
            U
          </div>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 space-y-12 max-w-4xl mx-auto">

        {/* Hero / Main Prompt */}
        <div className="text-center space-y-6 animate-fade-in max-w-2xl">
          <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground">
            What did you <span className="text-primary">learn</span> today?
          </h1>
          <p className="text-xl text-muted-foreground font-light">
            Capture it now. Remember it forever.
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full max-w-md animate-slide-up delay-100">
          <Button
            onClick={handleStartLearning}
            size="lg"
            className="w-full h-16 text-xl rounded-full shadow-lg hover:shadow-xl transition-all group"
          >
            <Plus className="mr-2 h-6 w-6 group-hover:rotate-90 transition-transform" />
            Add a new topic
          </Button>

          {/* Alternative: If we want the input field style from the mockup request, kept simple for now as per "Button" instruction in plan, but can be input-like */}
        </div>

        {/* Dashboard Widgets (Below fold or lower hierarchy) */}
        <div className="grid md:grid-cols-2 gap-6 w-full animate-slide-up delay-200 opacity-0 fill-mode-forwards" style={{ animationFillMode: 'forwards' }}>
          {/* Recent Activity */}
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-xs font-semibold pl-1">
                <Clock className="w-3 h-3" /> Recent Activity
              </div>
              {recentTopics.length === 0 ? (
                <div className="p-6 rounded-2xl bg-card border border-dashed text-center text-muted-foreground">
                  <p>No activity yet.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {recentTopics.slice(0, 3).map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => router.push(`/learn/${topic.id}`)}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border hover:border-primary/50 transition-colors text-left group"
                    >
                      <span className="font-medium group-hover:text-primary transition-colors">{topic.name}</span>
                      <div className={`w-2 h-2 rounded-full ${topic.memoryScore >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Due for Review */}
          <Card className="border-none shadow-none bg-transparent">
            <CardContent className="p-0 space-y-4">
              <div className="flex items-center gap-2 text-muted-foreground uppercase tracking-widest text-xs font-semibold pl-1">
                <Brain className="w-3 h-3" /> Due for Review
              </div>
              {dueTopics.length === 0 ? (
                <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 text-center">
                  <video className="w-full h-full object-cover hidden" /> {/* Placeholder */}
                  <p className="text-primary font-medium">All caught up!</p>
                  <p className="text-sm text-muted-foreground">Great job. Go learn something new.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {dueTopics.slice(0, 3).map(topic => (
                    <button
                      key={topic.id}
                      onClick={() => router.push(`/learn/${topic.id}`)}
                      className="flex items-center justify-between p-4 rounded-xl bg-card border border-l-4 border-l-primary hover:bg-accent transition-colors text-left"
                    >
                      <span className="font-medium">{topic.name}</span>
                      <span className="text-xs px-2 py-1 bg-background rounded-full border">Review Now</span>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
