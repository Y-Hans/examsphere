import { getDashboardDataAction } from '@/modules/analytics';
import { StudentStats } from '@/components/dashboard/student-stats';
import { SubjectPerformanceChart } from '@/components/dashboard/subject-performance-chart';
import { WeakTopicsList } from '@/components/dashboard/weak-topics-list';
import { RecentTestsList } from '@/components/dashboard/recent-tests-list';

export default async function StudentDashboardPage() {
  const { data: dashboardData } = await getDashboardDataAction({});

  if (!dashboardData) {
    return <div className="text-center py-10">Failed to load dashboard data. Please try again.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <StudentStats stats={dashboardData.overall} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Subject Performance</h2>
          <SubjectPerformanceChart data={dashboardData.subjects} />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Weak Topics</h2>
          <WeakTopicsList topics={dashboardData.weakTopics} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Tests</h2>
        <RecentTestsList tests={dashboardData.recentTests} />
      </div>
    </div>
  );
}