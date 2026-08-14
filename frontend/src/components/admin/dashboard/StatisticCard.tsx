'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatisticCardProps {
  label: string;
  value: number | string;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'warning' | 'danger';
}

export function StatisticCard({
  label,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: StatisticCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'danger':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-white border-slate-200';
    }
  };

  const getIconBgColor = () => {
    switch (variant) {
      case 'warning':
        return 'bg-amber-100';
      case 'danger':
        return 'bg-red-100';
      default:
        return 'bg-blue-100';
    }
  };

  const getIconColor = () => {
    switch (variant) {
      case 'warning':
        return 'text-amber-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className={`rounded-lg border ${getVariantStyles()} p-4 sm:p-6`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl sm:text-3xl font-bold text-[#043658] truncate">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'} whitespace-nowrap`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 truncate">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`flex-shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-lg flex items-center justify-center ${getIconBgColor()}`}>
            <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${getIconColor()}`} />
          </div>
        )}
      </div>
    </div>
  );
}
