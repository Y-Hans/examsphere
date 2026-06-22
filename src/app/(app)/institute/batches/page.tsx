'use client';

import { useState, useEffect } from 'react';
import { getBatchesAction, createBatchAction } from '@/modules/institute';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function BatchesPage() {
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBatches = async () => {
    setLoading(true);
    const res = await getBatchesAction();
    if (res.success) setBatches(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreate = async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    
    const res = await createBatchAction(formData);
    if (res.success) {
      setName('');
      setDescription('');
      setShowCreate(false);
      fetchBatches();
    } else {
      alert(res.error?.message);
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Batches</h1>
        <Button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : 'Create Batch'}
        </Button>
      </div>

      {showCreate && (
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <Label htmlFor="name">Batch Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., JEE 2024 Morning Batch" />
          </div>
          <div>
            <Label htmlFor="desc">Description (Optional)</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button onClick={handleCreate} disabled={submitting || !name}>
            {submitting ? 'Saving...' : 'Save Batch'}
          </Button>
        </div>
      )}

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {batches.length === 0 && <li className="p-4 text-center text-gray-400">No batches found. Create one to get started.</li>}
          {batches.map((batch) => (
            <li key={batch.id}>
              <Link href={`/institute/batches/${batch.id}`} className="block hover:bg-gray-50 px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-indigo-600 truncate">{batch.name}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                      {batch._count.enrollments} Students
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex justify-between">
                  <p className="flex items-center text-sm text-gray-500">
                    Created on {new Date(batch.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}