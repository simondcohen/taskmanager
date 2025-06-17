import React from 'react';
import { Task } from '../../types';

interface ChecklistProgressProps {
  tasks: Task[];
}

export function ChecklistProgress({ tasks }: ChecklistProgressProps) {
  const getProgressStats = () => {
    const completed = tasks.filter(t => t.completed).length;
    const total = tasks.length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-rose-500';
  };

  const progress = getProgressStats();

  return (
    <div className="mb-8">
      <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-center gap-12">
          <div className="relative">
            <svg className="w-24 h-24">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
                className="opacity-25"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                className={`${getProgressColor(progress.percentage)} transition-all duration-500`}
                strokeDasharray={`${progress.percentage * 3.51858}, 351.858`}
                transform="rotate(-90 64 64)"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-3xl font-bold ${getProgressColor(progress.percentage)}`}>
                {progress.percentage}%
              </span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold mb-2">
              {progress.completed} / {progress.total}
            </div>
            <div className="text-gray-600 text-lg">tasks completed</div>
          </div>
        </div>
      </div>
    </div>
  );
}