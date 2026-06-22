'use client';

import { useState } from 'react';
import { createTestTemplateAction } from '@/modules/exam-engine';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateTestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [name, setName] = useState('');
  const [durationMin, setDurationMin] = useState(60);
  const [totalMarks, setTotalMarks] = useState(180);
  const [examId, setExamId] = useState('');
  const [sectionsJson, setSectionsJson] = useState(JSON.stringify([
    {
      subjectId: 'REPLACE_WITH_REAL_SUBJECT_ID',
      name: 'Physics',
      questionCount: 20,
      marksCorrect: 4,
      marksWrong: 1,
      orderNo: 1,
      questionIds: ['REPLACE_WITH_REAL_QUESTION_ID_1', 'REPLACE_WITH_REAL_QUESTION_ID_2']
    }
  ], null, 2));

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('name', name);
      formData.append('type', 'CUSTOM_TEST');
      formData.append('examId', examId);
      formData.append('durationMin', durationMin.toString());
      formData.append('totalMarks', totalMarks.toString());
      formData.append('sections', sectionsJson);

      const res = await createTestTemplateAction(formData);
      if (res.success) {
        alert('Test Template created successfully!');
        router.push('/teacher/dashboard');
      } else {
        setError(res.error?.message || 'Failed to create test');
      }
    } catch (err) {
      setError('Invalid JSON format in sections.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Create Test Template</h1>
      
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <div>
          <Label htmlFor="name">Test Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Weekly Mock Test 1" />
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="examId">Exam ID (UUID)</Label>
            <Input id="examId" value={examId} onChange={(e) => setExamId(e.target.value)} placeholder="Exam UUID" />
          </div>
          <div>
            <Label htmlFor="duration">Duration (min)</Label>
            <Input id="duration" type="number" value={durationMin} onChange={(e) => setDurationMin(parseInt(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="marks">Total Marks</Label>
            <Input id="marks" type="number" value={totalMarks} onChange={(e) => setTotalMarks(parseFloat(e.target.value))} />
          </div>
        </div>

        <div>
          <Label htmlFor="sections">Sections Configuration (JSON)</Label>
          <p className="text-xs text-gray-500 mb-2">Provide an array of section objects. You must supply real Subject and Question UUIDs from your Question Bank.</p>
          <Textarea 
            id="sections" 
            value={sectionsJson} 
            onChange={(e) => setSectionsJson(e.target.value)} 
            rows={12}
            className="font-mono text-xs"
          />
        </div>

        {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

        <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Create Template
        </Button>
      </div>
    </div>
  );
}