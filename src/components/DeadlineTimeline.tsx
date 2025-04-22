import React, { useState } from 'react';
import { X, Plus, Check, Calendar, Clock } from 'lucide-react';
import { DeadlineItem } from '../types';
import { dateUtils } from '../utils/dateUtils';

interface DeadlineTimelineProps {
  deadlines: DeadlineItem[];
  onUpdate: (deadlines: DeadlineItem[]) => void;
}

export function DeadlineTimeline({ deadlines, onUpdate }: DeadlineTimelineProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState<DeadlineItem | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');

  const getCurrentDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getStatusStyle = (deadline: DeadlineItem) => {
    if (deadline.completed) {
      return 'bg-gray-400 dark:bg-gray-600';
    } else if (dateUtils.isOverdue(deadline.dueDate)) {
      return 'bg-red-500';
    } else if (dateUtils.isToday(dateUtils.parseDate(deadline.dueDate))) {
      return 'bg-blue-500';
    } else {
      return 'bg-emerald-500';
    }
  };

  const handleToggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening the edit modal
    
    const updatedDeadlines = deadlines.map(deadline => 
      deadline.id === id ? { ...deadline, completed: !deadline.completed } : deadline
    );
    
    onUpdate(updatedDeadlines);
  };

  const handleOpenModal = (deadline?: DeadlineItem) => {
    if (deadline) {
      setEditingDeadline(deadline);
    } else {
      setEditingDeadline({
        id: Date.now().toString(),
        title: '',
        dueDate: getCurrentDate(),
        notes: '',
        completed: false
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDeadline(null);
  };

  const handleSave = () => {
    if (!editingDeadline || !editingDeadline.title || !editingDeadline.dueDate) {
      alert('Title and due date are required');
      return;
    }

    let newDeadlines;
    if (deadlines.some(d => d.id === editingDeadline.id)) {
      newDeadlines = deadlines.map(d => 
        d.id === editingDeadline.id ? editingDeadline : d
      );
    } else {
      newDeadlines = [...deadlines, editingDeadline];
    }

    onUpdate(newDeadlines);
    handleCloseModal();
  };

  const handleDelete = () => {
    if (editingDeadline) {
      const newDeadlines = deadlines.filter(d => d.id !== editingDeadline.id);
      onUpdate(newDeadlines);
      handleCloseModal();
    }
  };

  // Filter deadlines based on status filter
  const filteredDeadlines = deadlines.filter(deadline => {
    if (statusFilter === 'active') return !deadline.completed;
    if (statusFilter === 'completed') return deadline.completed;
    return true;
  });

  // Sort deadlines by dueDate and group by status
  const overdueSortedDeadlines = filteredDeadlines.filter(
    deadline => !deadline.completed && dateUtils.isOverdue(deadline.dueDate)
  ).sort((a, b) => {
    const dateA = dateUtils.parseDate(a.dueDate);
    const dateB = dateUtils.parseDate(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });

  const todaySortedDeadlines = filteredDeadlines.filter(
    deadline => !deadline.completed && dateUtils.isToday(dateUtils.parseDate(deadline.dueDate))
  ).sort((a, b) => {
    const dateA = dateUtils.parseDate(a.dueDate);
    const dateB = dateUtils.parseDate(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });

  const upcomingSortedDeadlines = filteredDeadlines.filter(
    deadline => !deadline.completed && !dateUtils.isOverdue(deadline.dueDate) && 
      !dateUtils.isToday(dateUtils.parseDate(deadline.dueDate))
  ).sort((a, b) => {
    const dateA = dateUtils.parseDate(a.dueDate);
    const dateB = dateUtils.parseDate(b.dueDate);
    return dateA.getTime() - dateB.getTime();
  });

  const completedSortedDeadlines = filteredDeadlines.filter(
    deadline => deadline.completed
  ).sort((a, b) => {
    const dateA = dateUtils.parseDate(a.dueDate);
    const dateB = dateUtils.parseDate(b.dueDate);
    return dateB.getTime() - dateA.getTime(); // Show recently completed first
  });

  const renderDeadlineItem = (deadline: DeadlineItem) => {
    return (
      <div 
        key={deadline.id} 
        className="relative mb-8 pl-6 group"
      >
        <div className={`absolute left-0 top-0 transform -translate-x-1/2 w-3 h-3 rounded-full ${getStatusStyle(deadline)}`}></div>
        <div className="flex items-start">
          <div className="flex-grow cursor-pointer" onClick={() => handleOpenModal(deadline)}>
            <div className="mb-1">
              <h3 className={`font-medium text-gray-900 dark:text-gray-100 ${deadline.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
                {deadline.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {dateUtils.formatDisplayDate(deadline.dueDate)}
              </p>
            </div>
            {deadline.notes && (
              <p className={`text-sm text-gray-500 dark:text-gray-400 ${deadline.completed ? 'line-through' : ''}`}>
                {deadline.notes}
              </p>
            )}
          </div>
          <button 
            className={`p-2 rounded-full opacity-80 hover:opacity-100 ${
              deadline.completed 
                ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300' 
                : 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300'
            }`}
            onClick={(e) => handleToggleComplete(deadline.id, e)}
            title={deadline.completed ? "Mark as incomplete" : "Mark as complete"}
          >
            <Check size={16} className={deadline.completed ? 'opacity-50' : ''} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">Deadlines</h2>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          <Plus size={16} />
          <span>Add deadline</span>
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-gray-700 dark:text-gray-300">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            >
              <option value="all">All Deadlines</option>
              <option value="active">Active Only</option>
              <option value="completed">Completed Only</option>
            </select>
          </div>
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {filteredDeadlines.length} {filteredDeadlines.length === 1 ? 'deadline' : 'deadlines'}
        </div>
      </div>

      {filteredDeadlines.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400 py-8">
          No deadlines to display. Add new deadlines using the button above.
        </p>
      ) : (
        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          {overdueSortedDeadlines.length > 0 && (
            <div className="mb-6">
              <h3 className="flex items-center gap-2 font-medium text-red-600 dark:text-red-400 mb-4">
                <Clock size={18} />
                <span>Overdue ({overdueSortedDeadlines.length})</span>
              </h3>
              {overdueSortedDeadlines.map(renderDeadlineItem)}
            </div>
          )}

          {todaySortedDeadlines.length > 0 && (
            <div className="mb-6">
              <h3 className="flex items-center gap-2 font-medium text-blue-600 dark:text-blue-400 mb-4">
                <Calendar size={18} />
                <span>Today ({todaySortedDeadlines.length})</span>
              </h3>
              {todaySortedDeadlines.map(renderDeadlineItem)}
            </div>
          )}

          {upcomingSortedDeadlines.length > 0 && (
            <div className="mb-6">
              <h3 className="flex items-center gap-2 font-medium text-emerald-600 dark:text-emerald-400 mb-4">
                <Calendar size={18} />
                <span>Upcoming ({upcomingSortedDeadlines.length})</span>
              </h3>
              {upcomingSortedDeadlines.map(renderDeadlineItem)}
            </div>
          )}

          {completedSortedDeadlines.length > 0 && statusFilter !== 'active' && (
            <div className="mb-6">
              <h3 className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-400 mb-4">
                <Check size={18} />
                <span>Completed ({completedSortedDeadlines.length})</span>
              </h3>
              {completedSortedDeadlines.map(renderDeadlineItem)}
            </div>
          )}
        </div>
      )}

      {isModalOpen && editingDeadline && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                {deadlines.some(d => d.id === editingDeadline.id) ? 'Edit Deadline' : 'Add Deadline'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editingDeadline.title}
                  onChange={(e) => setEditingDeadline({...editingDeadline, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={editingDeadline.dueDate}
                  onChange={(e) => setEditingDeadline({...editingDeadline, dueDate: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optional)
                </label>
                <textarea
                  value={editingDeadline.notes || ''}
                  onChange={(e) => setEditingDeadline({...editingDeadline, notes: e.target.value})}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700"
                  rows={3}
                />
              </div>
              <div className="flex items-center mt-2">
                <input
                  type="checkbox"
                  id="completed"
                  checked={editingDeadline.completed || false}
                  onChange={(e) => setEditingDeadline({...editingDeadline, completed: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="completed" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Mark as completed
                </label>
              </div>
              <div className="flex justify-between pt-4">
                {deadlines.some(d => d.id === editingDeadline.id) && (
                  <button
                    onClick={handleDelete}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                  >
                    Delete
                  </button>
                )}
                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={handleCloseModal}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 