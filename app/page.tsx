'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';
import { Topic } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, BookOpen, Brain, Clock, Sparkles, Search, PlayCircle, Trash2, PlusCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Home() {
  const router = useRouter();
  const [topicName, setTopicName] = useState('');
  const [dueTopics, setDueTopics] = useState<Topic[]>([]);
  const [recentTopics, setRecentTopics] = useState<Topic[]>([]);
  const [duplicateTopic, setDuplicateTopic] = useState<Topic | null>(null);

  useEffect(() => {
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
    const normalizedName = topicName.trim().toLowerCase();
    if (!normalizedName) return;

    const allTopics = storage.getTopics();
    const existingTopic = allTopics.find(t => t.name.toLowerCase() === normalizedName);

    if (existingTopic) {
      setDuplicateTopic(existingTopic);
      return;
    }

    const newTopic = storage.createTopic(topicName);
    router.push(`/learn/${newTopic.id}`);
  };

  const handleContinueTopic = () => {
    if (duplicateTopic) {
      router.push(`/learn/${duplicateTopic.id}`);
      setDuplicateTopic(null);
    }
  };

  const handleAddConcepts = () => {
    if (duplicateTopic) {
      // Navigate to the same place but explicitly for adding concepts
      // The current UI on /learn/[id] allows adding concepts by default
      router.push(`/learn/${duplicateTopic.id}`);
      setDuplicateTopic(null);
    }
  };

  const handleStartFresh = () => {
    if (duplicateTopic) {
      storage.deleteTopic(duplicateTopic.id);
      const newTopic = storage.createTopic(topicName);
      router.push(`/learn/${newTopic.id}`);
      setDuplicateTopic(null);
    }
  };

  return (
    <div className="min-h-screen bg-background dot-grid">
      <div className="p-6 lg:p-10 max-w-5xl mx-auto space-y-10">

        {/* Hero Section */}
        <div className="pt-8 lg:pt-16 animate-fade-in">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            <div className="flex-1 space-y-6">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-medium uppercase tracking-wider">Active Recall Engine</span>
              </div>
              <h1 className="text-3xl lg:text-5xl font-bold text-foreground leading-tight max-w-2xl">
                What do you want to{' '}
                <span className="text-gradient">learn</span>{' '}
                today?
              </h1>
              <p className="text-muted-foreground text-lg max-w-lg">
                Enter any topic. We'll quiz you to build lasting memory.
              </p>
            </div>
          </div>
        </div>

        {/* AI Search Input */}
        <div className="animate-slide-up delay-100 relative">
          <div className="ai-input flex gap-3 p-2 bg-card border rounded-xl shadow-sm z-10 relative">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="e.g., Photosynthesis, React Hooks, World War II..."
                className="border-0 shadow-none focus-visible:ring-0 text-base h-12 bg-transparent"
                value={topicName}
                onChange={(e) => {
                  setTopicName(e.target.value);
                  if (duplicateTopic) setDuplicateTopic(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleStartLearning()}
              />
            </div>
            <Button
              size="lg"
              className="h-12 px-6 text-sm font-semibold"
              onClick={handleStartLearning}
              disabled={!topicName.trim()}
            >
              Start Learning
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Duplicate Topic Handling Dialog */}
        <AlertDialog open={!!duplicateTopic} onOpenChange={(open) => !open && setDuplicateTopic(null)}>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>Topic Already Exists</AlertDialogTitle>
              <AlertDialogDescription>
                You have already started studying <span className="font-semibold text-foreground">"{duplicateTopic?.name}"</span>.
                <br />
                Current Memory Score: <span className="font-semibold text-primary">{duplicateTopic?.memoryScore}%</span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-3 py-4">
              <Button
                onClick={handleContinueTopic}
                className="w-full justify-start text-left h-auto py-3 px-4"
                variant="outline"
              >
                <PlayCircle className="w-5 h-5 mr-3 text-primary" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Continue Existing</span>
                  <span className="text-xs text-muted-foreground font-normal">Resume where you left off</span>
                </div>
              </Button>

              <Button
                onClick={handleAddConcepts}
                className="w-full justify-start text-left h-auto py-3 px-4"
                variant="outline"
              >
                <PlusCircle className="w-5 h-5 mr-3 text-blue-500" />
                <div className="flex flex-col items-start">
                  <span className="font-semibold">Add Concepts</span>
                  <span className="text-xs text-muted-foreground font-normal">Expand knowledge base & quiz later</span>
                </div>
              </Button>

              <Button
                onClick={handleStartFresh}
                className="w-full justify-start text-left h-auto py-3 px-4 border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
                variant="outline"
              >
                <Trash2 className="w-5 h-5 mr-3 text-destructive" />
                <div className="flex flex-col items-start text-destructive">
                  <span className="font-semibold">Start Fresh</span>
                  <span className="text-xs text-destructive/70 font-normal">Delete progress & restart</span>
                </div>
              </Button>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDuplicateTopic(null)}>Cancel</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>


        {/* Quick Actions Grid */}
        <div className="grid lg:grid-cols-2 gap-6 animate-slide-up delay-200">

          {/* Due for Review */}
          <Card className="border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-destructive" />
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Due for Review</span>
                {dueTopics.length > 0 && (
                  <span className="ml-auto text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full font-medium">
                    {dueTopics.length}
                  </span>
                )}
              </div>

              {dueTopics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Brain className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">All caught up. Excellent work.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {dueTopics.slice(0, 3).map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => router.push(`/learn/${topic.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">{topic.concepts.length} concepts</p>
                      </div>
                      <BookOpen className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Topics */}
          <Card className="border bg-card">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent Topics</span>
              </div>

              {recentTopics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Start your first topic above.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentTopics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => router.push(`/learn/${topic.id}`)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors text-left group"
                    >
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{topic.name}</p>
                        <p className="text-xs text-muted-foreground">Score: {topic.memoryScore}%</p>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${topic.memoryScore >= 80 ? 'bg-green-500' :
                        topic.memoryScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
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
