'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useExamStore } from '@/modules/exam-engine/stores/exam-store';
import { saveResponseAction, submitTestAction } from '@/modules/exam-engine';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MathText } from '@/components/ui/katex';
import { Loader2 } from 'lucide-react';

export default function ExamInterface() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const { session, responses, currentSectionIndex, currentQuestionIndex, timeRemaining, status, initExam, setCurrentQuestion, updateResponse, tick, submit } = useExamStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    async function fetchSession() {
      // In a real app, this would be a dedicated action to get the full session details
      // including sections and questions mapped out.
      // Assuming we fetch from a hypothetical getTestSessionDataAction
      const res = await fetch(`/api/v1/test-sessions/${sessionId}`);
      if (!res.ok) {
        setError('Failed to load test session');
        setLoading(false);
        return;
      }
      const data = await res.json();
      setSessionData(data);
      initExam(data.session, data.responses, data.template.durationMin);
      setLoading(false);
    }
    fetchSession();
  }, [sessionId, initExam]);

  // Timer effect
  useEffect(() => {
    if (status === 'IN_PROGRESS') {
      const timer = setInterval(() => {
        tick();
      }, 1000);
      return () => clearInterval(timer);
    }
    if (status === 'SUBMITTED' && !isSubmitting) {
      handleSubmit();
    }
  }, [status, tick, isSubmitting]);

  const currentSection = sessionData?.template.sections[currentSectionIndex];
  const currentResponse = responses.find(r => r.sectionId === currentSection?.id && responses.indexOf(r) === currentQuestionIndex);
  
  // Because responses aren't guaranteed to be in exact order matching questions array, we need a better way.
  // Let's assume the API returns questions in order, and we match by index for the current section.
  const currentQuestion = currentSection?.questions[currentQuestionIndex]?.question;
  const currentQuestionId = currentSection?.questions[currentQuestionIndex]?.questionId;
  
  const actualCurrentResponse = responses.find(r => r.questionId === currentQuestionId);

  const handleOptionSelect = (option: string) => {
    if (!currentQuestionId) return;
    const newStatus = actualCurrentResponse?.status === 'MARKED_REVIEW' ? 'ANSWERED_REVIEW' : 'ANSWERED';
    updateResponse(currentQuestionId, option, newStatus as any);
    
    // Persist to server (debounced in real app)
    saveResponseAction(new FormData().append('sessionId', sessionId) as any, currentQuestionId, currentSection.id, option, newStatus, 0);
  };

  const handleSaveAndNext = () => {
    if (!currentQuestionId) return;
    const status = actualCurrentResponse?.responseValue ? 'ANSWERED' : 'VISITED';
    updateResponse(currentQuestionId, actualCurrentResponse?.responseValue || '', status as any);
    
    // Move to next question
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestion(currentSectionIndex, currentQuestionIndex + 1);
    } else if (currentSectionIndex < sessionData.template.sections.length - 1) {
      setCurrentQuestion(currentSectionIndex + 1, 0);
    }
  };

  const handleMarkForReview = () => {
    if (!currentQuestionId) return;
    const newStatus = actualCurrentResponse?.responseValue ? 'ANSWERED_REVIEW' : 'MARKED_REVIEW';
    updateResponse(currentQuestionId, actualCurrentResponse?.responseValue || '', newStatus as any);
    handleSaveAndNext();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await submitTestAction(sessionId);
    router.push(`/student/test/result/${sessionId}`);
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>;
  if (error) return <div className="text-center text-red-500 mt-20">{error}</div>;
  if (!sessionData || !currentSection || !currentQuestion) return <div>No data found</div>;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
        <h1 className="text-lg font-semibold text-gray-800">{sessionData.template.name}</h1>
        <div className="flex items-center gap-4">
          <div className={`px-4 py-2 rounded-md font-mono font-bold ${timeRemaining < 300 ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-800'}`}>
            {formatTime(timeRemaining)}
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? 'Submitting...' : 'Submit Test'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content - Question */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <div className="flex justify-between items-center mb-6 pb-4 border-b">
              <span className="text-sm font-medium text-gray-500">
                Section: {currentSection.name} | Q: {currentQuestionIndex + 1}/{currentSection.questions.length}
              </span>
              <span className="text-sm text-gray-500">
                Marks: +{currentQuestion.versions[0].marksCorrect} / {currentQuestion.versions[0].marksWrong}
              </span>
            </div>
            
            <div className="prose max-w-none mb-8 text-lg">
              <MathText text={currentQuestion.versions[0].statement} />
            </div>

            <div className="space-y-3">
              {['A', 'B', 'C', 'D'].map((opt) => {
                const optionText = (currentQuestion.versions[0] as any)[`option${opt}`];
                if (!optionText) return null;
                
                const isSelected = actualCurrentResponse?.responseValue === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => handleOptionSelect(opt)}
                    className={`w-full text-left p-4 border-2 rounded-lg flex items-start gap-3 transition-colors ${
                      isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                      isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 text-gray-600'
                    }`}>
                      {opt}
                    </span>
                    <div className="flex-1">
                      <MathText text={optionText} />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={handleMarkForReview}>
                Mark for Review & Next
              </Button>
              <Button onClick={handleSaveAndNext} className="bg-indigo-600 hover:bg-indigo-700">
                Save & Next
              </Button>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Question Palette */}
        <aside className="w-72 bg-white border-l shadow-sm flex flex-col">
          <div className="p-4 border-b">
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1"><span className="w-4 h-4 bg-green-500 rounded"></span> Answered</div>
              <div className="flex items-center gap-1"><span className="w-4 h-4 bg-red-400 rounded"></span> Not Answered</div>
              <div className="flex items-center gap-1"><span className="w-4 h-4 bg-purple-400 rounded"></span> Marked</div>
              <div className="flex items-center gap-1"><span className="w-4 h-4 bg-gray-300 rounded"></span> Not Visited</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            <h3 className="text-sm font-semibold mb-2">{currentSection.name}</h3>
            <div className="grid grid-cols-5 gap-2">
              {currentSection.questions.map((q: any, index: number) => {
                const r = responses.find(resp => resp.questionId === q.questionId);
                let bgColor = 'bg-gray-200 text-gray-600';
                if (r?.status === 'ANSWERED' || r?.status === 'ANSWERED_REVIEW') bgColor = 'bg-green-500 text-white';
                else if (r?.status === 'MARKED_REVIEW') bgColor = 'bg-purple-400 text-white';
                else if (r?.status === 'VISITED') bgColor = 'bg-red-400 text-white';
                
                return (
                  <button
                    key={q.questionId}
                    onClick={() => setCurrentQuestion(currentSectionIndex, index)}
                    className={`w-9 h-9 rounded-md flex items-center justify-center text-sm font-medium ${bgColor}`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}