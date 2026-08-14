'use client';

import { useRouter } from 'next/navigation';
import { Users, Bell, BarChart3 } from 'lucide-react';

interface QuickActionsProps {
  pendingVerificationCount?: number;
}

export function QuickActions({ pendingVerificationCount = 0 }: QuickActionsProps) {
  const router = useRouter();

  const actions = [
    {
      label: 'Verify Teachers',
      description: `${pendingVerificationCount} pending`,
      icon: Users,
      onClick: () => router.push('/admin/teachers?status=pending'),
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      label: 'Broadcast Notification',
      description: 'Send to all teachers',
      icon: Bell,
      onClick: () => {
        // TODO: Open notification modal
      },
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
      borderColor: 'border-amber-200',
    },
    {
      label: 'View Analytics',
      description: 'Platform insights',
      icon: BarChart3,
      onClick: () => router.push('/admin/analytics'),
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      borderColor: 'border-green-200',
    },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <h3 className="text-base sm:text-lg font-semibold text-[#043658] mb-3 sm:mb-4">
        Quick Actions
      </h3>
      
      <div className="space-y-2 sm:space-y-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`w-full flex items-center gap-2.5 sm:gap-3 rounded-lg border ${action.borderColor} ${action.bgColor} p-3 sm:p-4 text-left transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#FFC107]/50`}
            >
              <div className={`flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center bg-white`}>
                <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${action.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {action.label}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {action.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
