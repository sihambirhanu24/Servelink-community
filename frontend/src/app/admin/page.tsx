'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, AlertCircle, FileText, Building2 } from 'lucide-react';

import { useAdminDashboard } from '@/hooks/useAdminDashboard';
import AdminLayout from '@/components/admin/layout';
import { AdminWelcome } from '@/components/admin/dashboard/AdminWelcome';
import { StatisticCard } from '@/components/admin/dashboard/StatisticCard';
import { StatisticCardSkeleton } from '@/components/admin/dashboard/StatisticCardSkeleton';
import { PlatformActivityChart } from '@/components/admin/dashboard/PlatformActivityChart';
import { ChartSkeleton } from '@/components/admin/dashboard/ChartSkeleton';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import { RecentActivity } from '@/components/admin/dashboard/RecentActivity';
import { ActivitySkeleton } from '@/components/admin/dashboard/ActivitySkeleton';

// Get admin name from localStorage - avoid hydration mismatch
function useAdminName() {
  const [adminName, setAdminName] = useState<string>('ServeLink');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const adminData = localStorage.getItem('admin');
    if (adminData) {
      try {
        const { name } = JSON.parse(adminData);
        setAdminName(name?.split(' ')[0] || 'Admin');
      } catch {
        setAdminName('Admin');
      }
    }
  }, []);

  // Return default on server, update on client
  return mounted ? adminName : 'ServeLink';
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const adminName = useAdminName();
  const { data: dashboardData, isLoading, isError } = useAdminDashboard();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Build real activities from backend data
  const recentActivities = dashboardData?.recentActivity
    ? [
        // Recent registrations
        ...(dashboardData.recentActivity.registrations?.map((reg) => ({
          id: reg.id,
          type: 'registration' as const,
          title: 'New Teacher Registration',
          description: `${reg.firstName} ${reg.lastName} registered as a new teacher`,
          timestamp: reg.createdAt,
        })) || []),
        // Recent posts
        ...(dashboardData.recentActivity.posts?.map((post) => ({
          id: post.id,
          type: 'registration' as const,
          title: 'New Post',
          description: `${post.teacher?.firstName} ${post.teacher?.lastName} posted "${post.title}" in ${post.community?.name}`,
          timestamp: post.createdAt,
        })) || []),
        // Recent reports
        ...(dashboardData.recentActivity.reports?.map((report) => ({
          id: report.id,
          type: 'report' as const,
          title: 'Post Reported',
          description: `${report.reason} - "${report.post?.title}"`,
          timestamp: report.createdAt,
        })) || []),
      ]
    : [];

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Unable to load dashboard data.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Please try refreshing the page.
            </p>
          </div>
          <button
            onClick={() => router.refresh()}
            className="mt-4 rounded-lg bg-[#043658] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            Refresh
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <AdminWelcome adminName={adminName} />

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {mounted && isLoading ? (
            <>
              <StatisticCardSkeleton />
              <StatisticCardSkeleton />
              <StatisticCardSkeleton />
              <StatisticCardSkeleton />
            </>
          ) : (
            <>
              <StatisticCard
                label="Total Teachers"
                value={dashboardData?.statistics.teachers || 0}
                subtitle={`${dashboardData?.recentTeachers?.length || 0} added this month`}
                icon={Users}
                trend={{ value: 8.4, isPositive: true }}
              />
              <StatisticCard
                label="Pending Verification"
                value={dashboardData?.statistics.pendingVerification || 0}
                subtitle="Action required"
                icon={AlertCircle}
                variant="warning"
              />
              <StatisticCard
                label="Reported Posts"
                value={dashboardData?.statistics.reports || 0}
                subtitle="Awaiting review"
                icon={FileText}
                variant="danger"
              />
              <StatisticCard
                label="Active Communities"
                value={dashboardData?.statistics.communities || 0}
                subtitle="Across all levels"
                icon={Building2}
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Chart */}
          <div className="lg:col-span-2">
            {mounted && isLoading ? <ChartSkeleton /> : <PlatformActivityChart />}
          </div>

          {/* Right: Quick Actions */}
          <div className="space-y-6">
            <QuickActions
              pendingVerificationCount={dashboardData?.statistics.pendingVerification || 0}
            />

            {/* Recent Activity - using real backend data */}
            <RecentActivity
              activities={recentActivities}
              isLoading={isLoading}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
