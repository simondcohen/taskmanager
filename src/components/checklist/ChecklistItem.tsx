import React, { useState } from 'react';
import { Edit2, X, Save, Clock, MessageSquare, Check } from 'lucide-react';
import { Task } from '../../types';
import { dateUtils } from '../../utils/dateUtils';

interface ChecklistItemProps {
  task: Task;
  index: number;
  onSave: (index: number, updatedTask: Task) => void;
  onDelete: (index: number) => void;
  onAddToTemplate: (text: string) => void;
}

export function ChecklistItem({
  task,
  index,
  onSave,
  onDelete,
  onAddToTemplate
}: ChecklistItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [editTime, setEditTime] = useState(
    task.completedAt
      ? new Date(task.completedAt).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        })
      : ''
  );
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editNote, setEditNote] = useState(task.notes || '');

  const formatTimeDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString('en-GB', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return dateStr;
    }
  };

  const handleStatusChange = () => {
    const now = new Date().toISOString();
    let updatedTask: Task = { ...task };

    // Cycle through states: unchecked -> completed -> not completed -> unchecked
    if (!task.completed && !task.notCompleted) {
      // Unchecked -> Completed (green check)
      updatedTask = {
        ...task,
        completed: true,
        notCompleted: false,
        completedAt: now
      };
    } else if (task.completed) {
      // Completed -> Not completed (red X)
      updatedTask = {
        ...task,
        completed: false,
        notCompleted: true,
        completedAt: undefined
      };
    } else if (task.notCompleted) {
      // Not completed -> Unchecked
      updatedTask = {
        ...task,
        completed: false,
        notCompleted: false,
        completedAt: undefined
      };
    } else {
      // Fallback case - should never happen, but just in case
      updatedTask = {
        ...task,
        completed: false,
        notCompleted: false,
        completedAt: undefined
      };
    }

    onSave(index, updatedTask);
  };

  return (
    <li className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200">
      {isEditing ? (
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="flex-1 p-2 border rounded"
            onKeyDown={(e) => e.key === 'Enter' && onSave(index, { ...task, text: editText.trim() })}
          />
          <button
            onClick={() => onSave(index, { ...task, text: editText.trim() })}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : isEditingTime ? (
        <div className="flex-1 flex gap-2">
          <input
            type="time"
            value={editTime}
            onChange={(e) => setEditTime(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={() => {
              if (!editTime) return;
              if (!task.completed) {
                alert('Task must be completed before setting completion time.');
                return;
              }

              const [hours, minutes] = editTime.split(':');
              const completedDate = new Date(task.completedAt || new Date());
              completedDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));

              onSave(index, { ...task, completedAt: completedDate.toISOString() });
              setIsEditingTime(false);
            }}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditingTime(false)}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      ) : isEditingNote ? (
        <div className="flex-1 flex gap-2">
          <textarea
            value={editNote}
            onChange={(e) => setEditNote(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 p-2 border rounded"
            rows={2}
          />
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                onSave(index, { ...task, notes: editNote.trim() || undefined });
                setIsEditingNote(false);
              }}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingNote(false)}
              className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          <label className="flex items-center gap-3 flex-1">
            <button
              onClick={handleStatusChange}
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                task.completed
                  ? 'bg-green-500 border-green-500 text-white hover:bg-green-600'
                  : task.notCompleted
                  ? 'bg-red-500 border-red-500 text-white hover:bg-red-600'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {task.completed && <Check className="w-4 h-4" />}
              {task.notCompleted && <X className="w-4 h-4" />}
            </button>
            <div className="flex-1">
              <span className={task.completed ? 'line-through text-gray-400' : task.notCompleted ? 'text-red-500' : ''}>
                {task.text}
              </span>
              {(task.completed || task.notCompleted) && (
                <div className="text-sm text-gray-500 flex items-center gap-2">
                  {task.completedAt && task.completed && (
                    <div className="flex items-center gap-1">
                      Completed at {formatTimeDisplay(task.completedAt)}
                      <button
                        onClick={() => {
                          setIsEditingTime(true);
                          const date = new Date(task.completedAt!);
                          setEditTime(`${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`);
                        }}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit completion time"
                      >
                        <Clock className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {task.notCompleted && (
                    <span className="text-red-500">Not completed</span>
                  )}
                  <button
                    onClick={() => {
                      setIsEditingNote(true);
                      setEditNote(task.notes || '');
                    }}
                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    title={task.notes ? 'Edit note' : 'Add note'}
                  >
                    <MessageSquare className="w-3 h-3" />
                  </button>
                </div>
              )}
              {task.notes && (
                <div className="text-sm text-gray-600 mt-1 pl-4 border-l-2 border-gray-200">
                  {task.notes}
                </div>
              )}
            </div>
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => onAddToTemplate(task.text)}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              title="Add to template"
            >
              <Save className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setIsEditing(true);
                setEditText(task.text);
              }}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(index)}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </li>
  );
}