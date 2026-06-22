import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentStatsProps {
  stats: {
    totalAttempted: number;
    totalCorrect: number;
    accuracy: number;
    avgTimePerQuestion: number;
  };
}

export function StudentStats({ stats }: StudentStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Attempted</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAttempted}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Total Correct</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.totalCorrect}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">{stats.accuracy.toFixed(1)}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-500">Avg Time / Question</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgTimePerQuestion.toFixed(1)}s</div>
        </CardContent>
      </Card>
    </div>
  );
}