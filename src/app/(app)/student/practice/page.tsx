'use client';

import { useState } from 'react';
import { startPracticeAction } from '@/modules/practice-engine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BookOpen, Target, AlertCircle, Zap } from 'lucide-react';

export default function PracticePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startPractice = async (type: string, limit: number = 10) => {
    setLoading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('type', type);
    formData.append('limit', limit.toString());
    
    const res = await startPracticeAction(formData);
    if (res.success && res.data) {
      // Store questions in sessionStorage and redirect to practice interface
      sessionStorage.setItem('practiceSession', JSON.stringify(res.data));
      window.location.href = `/student/practice/session/${res.data.session.id}`;
    } else {
      setError(res.error?.message || 'Failed to start practice');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Practice Hub</h1>
        <p className="text-gray-500 mt-1">Choose a practice mode to sharpen your skills</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => !loading && startPractice('WEAK_TOPIC')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Weak Topics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Focus on the topics you struggle with the most. Questions are picked from your weakest areas.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => !loading && startPractice('PYQ')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-indigo-500" />
              PYQ Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">Practice Previous Year Questions from JEE Main, JEE Advanced, and NEET.</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => !loading && startPractice('ADAPTIVE')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Adaptive Practice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">AI-driven adaptive practice that adjusts difficulty based on your performance in real-time.</p>
          </CardContent>
        </Card>
      </div>

      {loading && (
        <div className="flex justify-center p-10">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      )}
    </div>
  );
}
