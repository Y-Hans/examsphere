'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getDoubtDetailsAction, resolveDoubtAction } from '@/modules/doubt';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MathText } from '@/components/ui/katex';
import { Loader2 } from 'lucide-react';

export default function DoubtDetailPage() {
  const params = useParams();
  const router = useRouter();
  const doubtId = params.doubtId as string;
  
  const [doubt, setDoubt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDoubt() {
      const res = await getDoubtDetailsAction(doubtId);
      if (res.success) setDoubt(res.data);
      setLoading(false);
    }
    fetchDoubt();
  }, [doubtId]);

  const handleResolve = async () => {
    if (!response.trim()) return;
    setSubmitting(true);
    const formData = new FormData();
    formData.append('doubtId', doubtId);
    formData.append('body', response);
    
    const res = await resolveDoubtAction(formData);
    if (res.success) {
      router.push('/teacher/doubts');
    } else {
      alert(res.error?.message || 'Failed to submit response');
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!doubt) return <div className="text-center p-10 text-red-500">Doubt not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-bold text-gray-900 mb-2">{doubt.title}</h1>
        <p className="text-sm text-gray-500 mb-4">By {doubt.user.email} | Status: {doubt.status}</p>
        <div className="prose max-w-none text-gray-800 mb-4">
          <MathText text={doubt.body} />
        </div>
        
        {doubt.question && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-2">Referenced Question:</p>
            <div className="prose prose-sm max-w-none">
              <MathText text={doubt.question.versions[0]?.statement || 'Question text unavailable'} />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Conversation</h2>
        <div className="space-y-4 mb-6">
          {doubt.responses.map((r: any) => (
            <div key={r.id} className={`flex ${r.authorId === doubt.userId ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${r.authorId === doubt.userId ? 'bg-gray-100' : 'bg-indigo-50 border border-indigo-200'}`}>
                <p className="text-xs text-gray-500 mb-1">{r.author.email}</p>
                <div className="prose prose-sm max-w-none">
                  <MathText text={r.body} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {doubt.status === 'OPEN' && (
          <div className="space-y-3">
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Type your response here... (Use $...$ for LaTeX math)"
              rows={5}
            />
            <Button onClick={handleResolve} disabled={submitting || !response.trim()} className="bg-emerald-600 hover:bg-emerald-700">
              {submitting ? 'Submitting...' : 'Resolve Doubt'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}