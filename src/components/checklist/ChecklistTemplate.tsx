import React, { useState } from 'react';
import { Edit2, X, Plus } from 'lucide-react';
import { Task } from '../../types';

interface ChecklistTemplateProps {
  templateTasks: Task[];
  onUpdateTemplate: (newTemplate: Task[]) => void;
}

export function ChecklistTemplate({ templateTasks, onUpdateTemplate }: ChecklistTemplateProps) {
  const [templateExpanded, setTemplateExpanded] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [editIndex, setEditIndex] = useState(-1);
  const [editText, setEditText] = useState('');

  const addTemplateTask = () => {
    if (!newTaskText.trim()) return;
    onUpdateTemplate([...templateTasks, { text: newTaskText.trim() }]);
    setNewTaskText('');
  };

  const removeTemplateTask = (index: number) => {
    const newTemplate = templateTasks.filter((_, i) => i !== index);
    onUpdateTemplate(newTemplate);
  };

  const editTemplateTask = (index: number) => {
    setEditIndex(index);
    setEditText(templateTasks[index].text);
  };

  const saveTemplateTaskEdit = (index: number) => {
    if (!editText.trim()) return;
    const newTemplate = [...templateTasks];
    newTemplate[index] = { text: editText.trim() };
    onUpdateTemplate(newTemplate);
    setEditIndex(-1);
    setEditText('');
  };

  return (
    <section className="bg-white rounded-lg shadow">
      <div
        className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setTemplateExpanded(!templateExpanded)}
      >
        <h2 className="text-xl font-semibold text-indigo-700">Checklist Template</h2>
        <span className="text-2xl font-bold text-indigo-600">
          {templateExpanded ? '−' : '+'}
        </span>
      </div>

      {templateExpanded && (
        <div className="p-4 border-t">
          <p className="text-gray-600 mb-4">
            Configure your template tasks. These form the basis of new daily checklists.
          </p>
          <ul className="space-y-2">
            {templateTasks.map((task, index) => (
              <li
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-200"
              >
                {editIndex === index ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 p-2 border rounded"
                      onKeyDown={(e) => e.key === 'Enter' && saveTemplateTaskEdit(index)}
                    />
                    <button
                      onClick={() => saveTemplateTaskEdit(index)}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditIndex(-1);
                        setEditText('');
                      }}
                      className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <span>{task.text}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editTemplateTask(index)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeTemplateTask(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="New template task description"
              className="flex-1 p-2 border rounded"
              onKeyDown={(e) => e.key === 'Enter' && addTemplateTask()}
            />
            <button
              onClick={addTemplateTask}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}