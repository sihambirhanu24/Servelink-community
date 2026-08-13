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
    <div className={`rounded-lg border ${getVariantStyles()} p-6`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wider text-slate-600">
            {label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-bold text-[#043658]">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {trend && (
              <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500">
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center ${getIconBgColor()}`}>
            <Icon className={`h-6 w-6 ${getIconColor()}`} />
          </div>
        )}
      </div>
    </div>
  );
}
