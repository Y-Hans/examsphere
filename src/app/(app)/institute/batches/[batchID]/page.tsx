'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getBatchDetailsAction, enrollStudentAction } from '@/modules/institute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';

export default function BatchDetailsPage() {
  const params = useParams();
  const batchId = params.batchId as string;
  
  const [batch, setBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [studentEmail, setStudentEmail] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatch = async () => {
    setLoading(true);
    const res = await getBatchDetailsAction(batchId);
    if (res.success) setBatch(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchBatch();
  }, [batchId]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError(null);
    const formData = new FormData();
    formData.append('batchId', batchId);
    formData.append('studentEmail', studentEmail);
    
    const res = await enrollStudentAction(formData);
    if (res.success) {
      setStudentEmail('');
      fetchBatch();
    } else {
      setError(res.error?.message || 'Failed to enroll student');
    }
    setEnrolling(false);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  if (!batch) return <div className="text-center p-10 text-red-500">Batch not found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{batch.name}</h1>
          <p className="text-sm text-gray-500">{batch.description || 'No description provided'}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Enroll New Student</h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Label htmlFor="email">Student Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={studentEmail} 
              onChange={(e) => setStudentEmail(e.target.value)} 
              placeholder="student@example.com" 
            />
          </div>
          <Button onClick={handleEnroll} disabled={enrolling || !studentEmail}>
            {enrolling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />}
            Enroll
          </Button>
        </div>
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b">
          <h3 className="text-lg font-medium text-gray-900">Enrolled Students ({batch.enrollments.length})</h3>
        </div>
        <ul className="divide-y divide-gray-200">
          {batch.enrollments.length === 0 && <li className="p-4 text-center text-gray-400">No students enrolled yet.</li>}
          {batch.enrollments.map((enrollment: any) => (
            <li key={enrollment.userId} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{enrollment.user.email}</p>
                <p className="text-xs text-gray-500">Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}