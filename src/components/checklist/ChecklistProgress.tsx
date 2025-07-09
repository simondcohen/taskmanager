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
    if (percentage === 100) return 'text-emerald-600';
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 60) return 'text-yellow-500';
    if (percentage >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const progress = getProgressStats();

  return (
    <div className="flex items-center gap-8">
      {/* Circular Progress */}
      <div className="relative">
        <svg className="w-24 h-24 -rotate-90 transform">
          {/* Background circle */}
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-gray-200"
          />
          {/* Progress circle */}
          <circle
            cx="48"
            cy="48"
            r="42"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            className={`${getProgressColor(progress.percentage)} transition-all duration-700 ease-out`}
            strokeDasharray={`${progress.percentage * 2.639}, 263.9`}
            strokeDashoffset="0"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <span className={`text-2xl font-semibold ${getProgressColor(progress.percentage)}`}>
              {progress.percentage}%
            </span>
            <div className="text-xs text-gray-500">complete</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-gray-900">{progress.completed}</span>
          <span className="text-lg text-gray-500">of {progress.total}</span>
        </div>
        <div className="text-sm text-gray-600 mt-1">habits completed today</div>
        
        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden mt-3">
          <div
            className={`h-full transition-all duration-700 ease-out ${
              progress.percentage === 100 ? 'bg-emerald-600' :
              progress.percentage >= 80 ? 'bg-emerald-500' :
              progress.percentage >= 60 ? 'bg-yellow-500' :
              progress.percentage >= 40 ? 'bg-orange-500' :
              'bg-red-500'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}