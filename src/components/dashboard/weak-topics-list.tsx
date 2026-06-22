import { Progress } from '@/components/ui/progress';

interface WeakTopicsListProps {
  topics: Array<{ id: string; topic: string; score: number }>;
}

export function WeakTopicsList({ topics }: WeakTopicsListProps) {
  if (!topics || topics.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400">No weak topics identified. Keep practicing!</div>;
  }

  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div key={topic.id}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
            <span className="text-sm text-gray-500">{topic.score.toFixed(0)}% Weak</span>
          </div>
          <Progress value={topic.score} className="h-2" indicatorColor="bg-red-500" />
        </div>
      ))}
    </div>
  );
}