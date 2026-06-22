'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Trophy, Clock, Target } from 'lucide-react';
import Link from 'next/link';

export default function TestResultPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResult() {
      const res = await fetch(`/api/v1/test-sessions/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        setResult(data);
      }
      setLoading(false);
    }
    fetchResult();
  }, [sessionId]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!result) return <div className="text-center p-10 text-red-500">Result not found.</div>;

  const totalMarks = result.template.totalMarks;
  const score = result.totalScore || 0;
  const percentage = (score / parseFloat(totalMarks)) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Test Result</h1>
        <p className="text-gray-500 mt-2">{result.template.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-indigo-600">{score.toFixed(2)}</div>
            <div className="text-sm text-gray-500">out of {parseFloat(totalMarks).toFixed(2)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Target className="h-4 w-4" /> Percentage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{percentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Clock className="h-4 w-4" /> Time Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-700">
              {Math.floor((result.timeSpentSec || 0) / 60)}m
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Section-wise Performance</h2>
        {result.template.sections.map((section: any) => {
          const sectionResponses = result.responses.filter((r: any) => r.sectionId === section.id);
          const correct = sectionResponses.filter((r: any) => r.isCorrect).length;
          const total = sectionResponses.length;
          
          return (
            <div key={section.id} className="mb-4 last:mb-0">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">{section.name}</span>
                <span className="text-sm text-gray-500">{correct}/{total} correct</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-indigo-600 h-2 rounded-full"
                  style={{ width: `${total > 0 ? (correct / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4">
        <Link href="/student/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
        <Link href="/student/practice">
          <Button className="bg-indigo-600 hover:bg-indigo-700">Practice Weak Topics</Button>
        </Link>
      </div>
    </div>
  );
}
