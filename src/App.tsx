import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { CheckSquare, Pill, LayoutGrid, Database, Download, Upload } from 'lucide-react';
import { DailyChecklist } from './components/DailyChecklist';
import { DailyHabitsHistory } from './components/DailyHabitsHistory';
import { MedicationList } from './components/MedicationList';
import { Task, DailyChecklists, Tab, MedicationItem } from './types';
import { toStorage, fromStorage, formatDateOnly } from './utils/time';

// Group tabs by category
const tabGroups = [
  {
    name: 'Personal',
    tabs: [
      { id: 'daily', label: 'Daily Habits', icon: CheckSquare },
      { id: 'medications', label: 'Medications', icon: Pill },
    ],
  },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const savedTab = localStorage.getItem('activeTab');
    return (savedTab as Tab) || 'daily';
  });
  const [isCompactView, setIsCompactView] = useState(false);
  const location = useLocation();
  
  // Add state for last backup time
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(() => {
    return localStorage.getItem('lastBackupTime');
  });
  
  // Update activeTab based on URL path
  useEffect(() => {
    const path = location.pathname.substring(1); // Remove the leading '/'
    const validTab = path as Tab;
    
    if (path === '') {
      setActiveTab('daily');
    } else if (tabGroups.some(group => 
      group.tabs.some(tab => tab.id === validTab)
    )) {
      setActiveTab(validTab);
      localStorage.setItem('activeTab', validTab);
    }
  }, [location.pathname]);
  
  // Update document title when activeTab changes
  useEffect(() => {
    // Find the current tab label for the title
    let tabLabel = "Task Manager";
    
    for (const group of tabGroups) {
      const tab = group.tabs.find(t => t.id === activeTab);
      if (tab) {
        tabLabel = `${tab.label} - Task Manager`;
        break;
      }
    }
    
    document.title = tabLabel;
  }, [activeTab]);
  
  // Get dates for demo data
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [templateTasks, setTemplateTasks] = useState<Task[]>([]);
  const [checklists, setChecklists] = useState<DailyChecklists>({});
  const [selectedDay, setSelectedDay] = useState(formatDate(new Date()));
  const [medicationItems, setMedicationItems] = useState<MedicationItem[]>(() => {
    const savedItems = localStorage.getItem('medicationItems');
    return savedItems ? JSON.parse(savedItems) : [];
  });
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [showTooltip, setShowTooltip] = useState('');
  const [mergeImport, setMergeImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalFileInputRef = useRef<HTMLInputElement>(null);

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedData = localStorage.getItem('react-task-manager-app');
      const today = formatDate(new Date());
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        const loadedTemplateTasks = parsedData.templateTasks || [];
        const loadedChecklists = parsedData.checklists || {};
        
        // Ensure today's checklist exists
        if (!loadedChecklists[today] && loadedTemplateTasks.length > 0) {
          loadedChecklists[today] = loadedTemplateTasks.map((task: Task) => ({
            text: task.text,
            status: 'unchecked' as const
          }));
        }
        
        setTemplateTasks(loadedTemplateTasks);
        setChecklists(loadedChecklists);
        
        if (parsedData.medicationItems) {
          setMedicationItems(parsedData.medicationItems);
        }
        
        // Always set selectedDay to today when app loads
        setSelectedDay(today);
      } else {
        // Use default date format for initial load
        // Set today as the selected day
        setSelectedDay(today);
        
        // Initialize empty checklist for today
        setChecklists({ [today]: [] });
      }
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      // Set today as the selected day
      const today = formatDate(new Date());
      setSelectedDay(today);
      // Initialize empty checklist for today
      setChecklists({ [today]: [] });
    }
  }, []); // Empty dependency array to run only on mount

  // Save data to localStorage when it changes
  useEffect(() => {
    const dataToSave = {
      templateTasks,
      checklists,
    };
    localStorage.setItem('react-task-manager-app', JSON.stringify(dataToSave));
  }, [templateTasks, checklists]);

  // Save medication items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('medicationItems', JSON.stringify(medicationItems));
  }, [medicationItems]);

  const showTemporaryMessage = (message: string) => {
    setShowTooltip(message);
    setTimeout(() => setShowTooltip(''), 3000);
  };

  const downloadData = () => {
    // Get medications list from localStorage
    const savedMedications = localStorage.getItem('medications');
    const medications = savedMedications ? JSON.parse(savedMedications) : [];
    
    const dataToExport = {
      templateTasks,
      checklists,
      medicationItems,
      medications, // Include medications list
    };
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-manager-data-${formatDateOnly(toStorage(new Date()))}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    // Update last backup time
    const backupTime = new Date().toISOString();
    setLastBackupTime(backupTime);
    localStorage.setItem('lastBackupTime', backupTime);
    
    showTemporaryMessage('Backup downloaded');
  };

  const formatLastBackupTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    
    const backupDate = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - backupDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  const validateImportData = (data: any) => {
    if (!data || typeof data !== 'object') {
      alert('Invalid format: Not an object.');
      return false;
    }

    let isValid = false;

    if (Object.prototype.hasOwnProperty.call(data, 'templateTasks')) {
      if (!Array.isArray(data.templateTasks)) {
        alert('Invalid: templateTasks not array.');
        return false;
      }
      isValid = true;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'checklists')) {
      if (typeof data.checklists !== 'object' || Array.isArray(data.checklists)) {
        alert('Invalid: checklists not object.');
        return false;
      }
      isValid = true;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'medicationItems')) {
      if (!Array.isArray(data.medicationItems)) {
        alert('Invalid: medicationItems not array.');
        return false;
      }
      isValid = true;
    }

    if (Object.prototype.hasOwnProperty.call(data, 'medications')) {
      if (!Array.isArray(data.medications)) {
        alert('Invalid: medications not array.');
        return false;
      }
      isValid = true;
    }

    // No other sections to validate

    if (!isValid) {
      alert('Invalid: No recognizable sections found.');
      return false;
    }

    return true;
  };

  const mergeImportData = (data: any) => {
    // Merge templateTasks (habits) - combine unique tasks by text
    if (data.templateTasks) {
      const existingTexts = new Set(templateTasks.map(t => t.text));
      const newTasks = data.templateTasks.filter((task: Task) => !existingTexts.has(task.text));
      setTemplateTasks([...templateTasks, ...newTasks]);
    }

    // Merge checklists - combine by date
    if (data.checklists) {
      const mergedChecklists = { ...checklists };
      
      Object.entries(data.checklists).forEach(([date, importedTasks]) => {
        if (mergedChecklists[date]) {
          // Date exists - merge tasks
          const existingTexts = new Set(mergedChecklists[date].map((t: Task) => t.text));
          const newTasks = (importedTasks as Task[]).filter(task => !existingTexts.has(task.text));
          mergedChecklists[date] = [...mergedChecklists[date], ...newTasks];
        } else {
          // Date doesn't exist - add all tasks
          mergedChecklists[date] = importedTasks as Task[];
        }
      });
      
      setChecklists(mergedChecklists);
    }

    // Merge medicationItems - avoid duplicates by timestamp
    if (data.medicationItems) {
      const existingTimestamps = new Set(medicationItems.map(m => m.timestamp));
      const newMeds = data.medicationItems.filter((med: MedicationItem) => 
        !existingTimestamps.has(med.timestamp)
      );
      
      // If no timestamp, check by name+dose+date+time
      const uniqueNewMeds = newMeds.filter((med: MedicationItem) => {
        if (med.timestamp) return true;
        return !medicationItems.some(existing => 
          existing.name === med.name && 
          existing.dose === med.dose && 
          existing.date === med.date && 
          existing.time === med.time
        );
      });
      
      setMedicationItems([...medicationItems, ...uniqueNewMeds]);
    }

    // Merge medications list - combine unique medication names
    if (data.medications) {
      const savedMedications = localStorage.getItem('medications');
      const currentMedications = savedMedications ? JSON.parse(savedMedications) : [];
      const existingMedNames = new Set(currentMedications);
      const newMedications = data.medications.filter((med: string) => !existingMedNames.has(med));
      const mergedMedications = [...currentMedications, ...newMedications];
      localStorage.setItem('medications', JSON.stringify(mergedMedications));
    }
  };
  
  const handleImportData = (data: any) => {
    if (data.templateTasks) {
      setTemplateTasks(data.templateTasks);
    }
    if (data.checklists) {
      setChecklists(data.checklists);
    }
    if (data.medicationItems) {
      setMedicationItems(data.medicationItems);
    }
    if (data.medications) {
      localStorage.setItem('medications', JSON.stringify(data.medications));
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
              const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      if (validateImportData(parsed)) {
        if (mergeImport) {
          if (!confirm('This will merge the imported data with your existing data. Continue?')) {
            return;
          }
          mergeImportData(parsed);
        } else {
          if (!confirm('This will replace your current data. Are you sure you want to import?')) {
            return;
          }
          handleImportData(parsed);
        }
        showTemporaryMessage('Data imported successfully!');
      }
      } catch (err) {
        alert('Invalid JSON file or error during parsing.');
        console.error('Import Error:', err);
      }
    };
    reader.readAsText(file);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // Validate the JSON before putting it in the textarea
        const parsed = JSON.parse(content);
        if (validateImportData(parsed)) {
          setImportText(content);
          setImportError('');
        } else {
          setImportError('JSON schema not recognised');
        }
      } catch (err) {
        setImportError('Invalid JSON file');
        console.error('File parsing error:', err);
      }
    };
    reader.readAsText(file);
    
    // Clear the input so the same file can be selected again if needed
    event.target.value = '';
  };
  
  const handleImportText = () => {
    setImportError('');
    try {
          const parsed = JSON.parse(importText);
    
    if (validateImportData(parsed)) {
      if (mergeImport) {
        if (!confirm('This will merge the imported data with your existing data. Continue?')) {
          return;
        }
        mergeImportData(parsed);
      } else {
        if (!confirm('This will replace your current data. Are you sure you want to import?')) {
          return;
        }
        handleImportData(parsed);
      }
      setIsImportModalOpen(false);
      setImportText('');
      showTemporaryMessage('Data imported successfully!');
    } else {
        setImportError('JSON schema not recognised');
      }
    } catch (err) {
      setImportError('Invalid JSON');
      console.error('Import Error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full overflow-x-hidden">
      <div className="transition-all duration-300 ease-in-out w-full px-4">
        <div className="max-w-3xl mx-auto w-full">
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-4xl font-bold text-indigo-600">Task Manager</h1>
              <button
                onClick={() => setIsCompactView(!isCompactView)}
                className="p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                title={isCompactView ? "Show labels" : "Compact view"}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>

            {/* Last Backup Indicator */}
            <div className="mb-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
                <Download className="w-4 h-4 mr-2" />
                <span>Last backed up: {formatLastBackupTime(lastBackupTime)}</span>
              </div>
            </div>

            <nav className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex flex-col sm:flex-row w-full">
                {tabGroups.map((group, groupIndex) => (
                  <div
                    key={group.name}
                    className={`flex-1 ${groupIndex > 0 ? 'sm:border-l' : ''}`}
                  >
                    <div className="pl-4 pr-2 py-2 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                      {group.name}
                    </div>
                    <div className="px-2 pb-2">
                      {group.tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                          <NavLink
                            key={tab.id}
                            to={`/${tab.id}`}
                            className={({ isActive }) => `w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center ${
                              isActive
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            <Icon className="w-5 h-5 flex-shrink-0" />
                            {!isCompactView && (
                              <span className="ml-3 truncate">{tab.label}</span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* New Data Management Section */}
                <div className="flex-1 sm:border-l">
                  <div className="pl-4 pr-2 py-2 font-semibold text-gray-500 text-sm uppercase tracking-wider">
                    Data
                  </div>
                  <div className="px-2 pb-2">
                    <button
                      onClick={() => setIsImportModalOpen(true)}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center hover:bg-gray-100"
                    >
                      <Database className="w-5 h-5 flex-shrink-0" />
                      {!isCompactView && (
                        <span className="ml-3 truncate">Import Data</span>
                      )}
                    </button>

                    <button
                      onClick={downloadData}
                      className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center hover:bg-gray-100"
                    >
                      <Download className="w-5 h-5 flex-shrink-0" />
                      {!isCompactView && (
                        <span className="ml-3 truncate">Download Data</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </nav>
          </header>
          
          <main className="w-full overflow-x-hidden">
            <Routes>
              <Route path="/" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <DailyChecklist
                    templateTasks={templateTasks}
                    checklists={checklists}
                    selectedDay={selectedDay}
                    onUpdateChecklists={setChecklists}
                    onUpdateTemplate={setTemplateTasks}
                    onSelectDay={setSelectedDay}
                  />
                </div>
              } />
              <Route path="/daily" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <DailyChecklist
                    templateTasks={templateTasks}
                    checklists={checklists}
                    selectedDay={selectedDay}
                    onUpdateChecklists={setChecklists}
                    onUpdateTemplate={setTemplateTasks}
                    onSelectDay={setSelectedDay}
                  />
                </div>
              } />
              <Route path="/daily/history" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <DailyHabitsHistory
                    checklists={checklists}
                    onSelectDay={setSelectedDay}
                  />
                </div>
              } />
              <Route path="/medications" element={
                <div className={`w-full ${isCompactView ? 'max-h-screen' : ''}`}>
                  <MedicationList
                    items={medicationItems}
                    onUpdateItems={setMedicationItems}
                  />
                </div>
              } />
            </Routes>

            {showTooltip && (
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-50 transition-opacity">
                {showTooltip}
              </div>
            )}

            {/* Import Data Modal */}
            {isImportModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-4xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Import Data</h3>
                    <button 
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setImportText('');
                        setImportError('');
                      }}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <span className="sr-only">Close</span>
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Method 1: Paste JSON Data
                        </label>
                        <textarea
                          value={importText}
                          onChange={(e) => setImportText(e.target.value)}
                          className="w-full border rounded p-2 h-[350px]"
                          placeholder="Paste your JSON here..."
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Method 2: Upload JSON File
                        </label>
                        <button
                          onClick={() => modalFileInputRef.current?.click()}
                          className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 hover:border-gray-400 transition-colors flex items-center justify-center"
                        >
                          <Upload className="w-5 h-5 mr-2" />
                          Choose JSON File to Upload
                        </button>
                        <input
                          ref={modalFileInputRef}
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={handleFileSelect}
                        />
                      </div>
                      
                      {importError && (
                        <div className="text-red-500 text-sm">{importError}</div>
                      )}
                    </div>
                    
                    <div className="border rounded p-4 h-[500px] overflow-y-auto">
                      <p className="text-sm mb-3">
                        The JSON should include <code>templateTasks</code>, <code>checklists</code>, <code>medicationItems</code> and/or <code>medications</code>.
                      </p>
                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{`{
  "templateTasks": [],
  "checklists": {},
  "medicationItems": [],
  "medications": []
}`}</pre>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center">
                    <input
                      type="checkbox"
                      id="merge-import"
                      checked={mergeImport}
                      onChange={(e) => setMergeImport(e.target.checked)}
                      className="mr-2"
                    />
                    <label htmlFor="merge-import" className="text-sm">
                      Merge with existing data (instead of replacing everything)
                    </label>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setImportText('');
                        setImportError('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleImportText}
                      disabled={!importText.trim()}
                      className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Import JSON Data
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default App;