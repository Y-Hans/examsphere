'use client';

import { useState } from 'react';
import { registerUser } from '@/modules/identity/actions/auth.actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await registerUser(formData);

    if (result.success) {
      window.location.href = '/student/dashboard';
    } else {
      setError(result.error?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-500 mt-2">Start your JEE/NEET preparation journey</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" type="text" required placeholder="John Doe" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required placeholder="Min 8 characters" minLength={8} />
            <p className="text-xs text-gray-500 mt-1">At least 8 characters with 1 uppercase, 1 lowercase, and 1 number.</p>
          </div>
          <div>
            <Label htmlFor="examTarget">Target Exam</Label>
            <Select name="examTarget">
              <SelectTrigger>
                <SelectValue placeholder="Select your target exam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="JEE_MAIN">JEE Main</SelectItem>
                <SelectItem value="JEE_ADVANCED">JEE Advanced</SelectItem>
                <SelectItem value="NEET">NEET</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</div>}

          <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Account
          </Button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-indigo-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
