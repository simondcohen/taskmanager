import React from 'react';
import { Task } from '../../types';

interface ChecklistProgressProps {
  tasks: Task[];
}

export function ChecklistProgress({ tasks }: ChecklistProgressProps) {
  const getProgressStats = () => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const total = tasks.length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'from-emerald-400 to-emerald-600';
    if (percentage >= 50) return 'from-amber-400 to-amber-600';
    return 'from-rose-400 to-rose-600';
  };

  const getTextColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-rose-600';
  };

  const progress = getProgressStats();

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-2xl border border-gray-200/60 shadow-lg shadow-gray-200/20 p-6">
        <div className="flex items-center justify-between gap-8">
          {/* Circular Progress */}
          <div className="relative">
            <svg className="w-32 h-32 -rotate-90 transform">
              {/* Background circle */}
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-gray-200"
              />
              {/* Progress circle with gradient */}
              <defs>
                <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`${getProgressColor(progress.percentage).split(' ')[0].replace('from-', 'text-')}`} />
                  <stop offset="100%" className={`${getProgressColor(progress.percentage).split(' ')[1].replace('to-', 'text-')}`} />
                </linearGradient>
              </defs>
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="url(#progress-gradient)"
                strokeWidth="12"
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                strokeDasharray={`${progress.percentage * 3.51858}, 351.858`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className={`text-4xl font-bold ${getTextColor(progress.percentage)} transition-colors duration-500`}>
                  {progress.percentage}%
                </span>
                <div className="text-xs text-gray-500 font-medium mt-1">Complete</div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1">
            <div className="space-y-3">
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-gray-900">{progress.completed}</span>
                  <span className="text-xl text-gray-400 font-medium">of {progress.total}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">habits completed today</div>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${getProgressColor(progress.percentage)} transition-all duration-700 ease-out rounded-full`}
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}