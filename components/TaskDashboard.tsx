import React, { useState, useMemo, useRef } from 'react';
import { AppTasks, Task, TaskGroup, TaskPriority, HistoryEntry, DayOfWeek, daysOfWeek, DayOffRequest } from '../types';
import TaskList from './TaskList';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PencilIcon from './icons/PencilIcon';
import ConfirmationModal from './ConfirmationModal';
import ChevronDownIcon from './icons/ChevronDownIcon';
import HistoryIcon from './icons/HistoryIcon';
import HistoryModal from './HistoryModal';
import DayOffRequestModal from './DayOffRequestModal';
import CalendarIcon from './icons/CalendarIcon';
import LocationMarkerIcon from './icons/LocationMarkerIcon';
import CloseIcon from './icons/CloseIcon';

// @ts-ignore
const { jsPDF } = window.jspdf;

type SortType = 'manual' | 'priority' | 'name';

// Helper to count occurrences of a weekday in a given month.
// month is 0-indexed (0 for January). dayOfWeek is 0-indexed (0 for Sunday).
const countWeekdaysInMonth = (year: number, month: number, dayOfWeek: number): number => {
    let count = 0;
    // Get the total number of days in the month using UTC
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(Date.UTC(year, month, day));
        if (date.getUTCDay() === dayOfWeek) {
            count++;
        }
    }
    return count;
};

interface TaskDashboardProps {
  tasks: AppTasks;
  history: HistoryEntry[];
  currentUsername: string | null;
  onAddTask: (text: string, isRepetitive: boolean | undefined, monthKey: string | null, groupId: string | null, dayOfWeek?: DayOfWeek, location?: string) => void;
  onAddSubTask: (parentTaskId: string, text: string) => void;
  onToggleTask: (task: Task) => void;
  onUpdateTask: (taskId: string, newText: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskRepetitive: (taskId: string) => void;
  onUpdateTaskPriority: (taskId: string, priority: TaskPriority) => void;
  onAddGroup: (monthKey: string, name: string, type: 'custom' | 'weekly') => void;
  onUpdateGroup: (monthKey: string, groupId: string, newName: string) => void;
  onDeleteGroup: (monthKey: string, groupId: string) => void;
  onClearHistoryForMonth: (monthKey: string) => void;
  onAddDayOffRequest: (request: Omit<DayOffRequest, 'id' | 'username'>) => void;
}

const getMonthKey = (date: Date): string => {
    return date.toISOString().slice(0, 7); // YYYY-MM
};

const formatMonthKey = (monthKey: string): string => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleString('default', { month: 'long', year: 'numeric' });
};

const priorityOrder: { [key in TaskPriority]: number } = { high: 1, medium: 2, low: 3 };

const sortTasks = (tasks: Task[], sortType: SortType): Task[] => {
    const sorted = [...tasks];
    if (sortType === 'manual') {
        return sorted;
    }
    sorted.sort((a, b) => {
        if (sortType === 'priority') {
            const priorityA = priorityOrder[a.priority || 'medium'];
            const priorityB = priorityOrder[b.priority || 'medium'];
            if (priorityA !== priorityB) return priorityA - priorityB;
        }
        return a.text.localeCompare(b.text);
    });
    // Recursively sort subtasks as well
    return sorted.map(task => ({
        ...task,
        subTasks: sortTasks(task.subTasks, sortType),
    }));
};

const dayOfWeekMap: { [key in DayOfWeek]: number } = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const initialInputState = { text: '', location: '' };

const TaskDashboard: React.FC<TaskDashboardProps> = (props) => {
    const { tasks, history, onAddTask, onAddGroup, onUpdateGroup, onDeleteGroup, onClearHistoryForMonth, onAddDayOffRequest } = props;
    const [currentMonthKey, setCurrentMonthKey] = useState(getMonthKey(new Date()));
    
    // UI State
    const [isGeneralTasksOpen, setGeneralTasksOpen] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [isHistoryModalOpen, setHistoryModalOpen] = useState(false);
    const [isDayOffModalOpen, setDayOffModalOpen] = useState(false);
    const [locationVisibility, setLocationVisibility] = useState<{ [key: string]: boolean }>({});


    // Form State
    const [dailyTaskInput, setDailyTaskInput] = useState(initialInputState);
    const [monthlyTaskInput, setMonthlyTaskInput] = useState(initialInputState);
    const [groupTaskInput, setGroupTaskInput] = useState<{ [key: string]: {text: string, location: string} }>({});
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupType, setNewGroupType] = useState<'custom' | 'weekly'>('custom');
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editingGroupText, setEditingGroupText] = useState('');
    const [deletingGroup, setDeletingGroup] = useState<TaskGroup | null>(null);
    const [sortConfig, setSortConfig] = useState<{ [key: string]: SortType }>({});
    const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});


    const currentMonthData = useMemo(() => {
        return tasks.monthly[currentMonthKey] || { id: currentMonthKey, generalTasks: [], groups: [] };
    }, [tasks.monthly, currentMonthKey]);
    
    const allApprovedDaysOff = useMemo(() => {
        return (tasks.dayOffs || [])
            .filter(d => d.status === 'approved')
            .map(d => d.date);
    }, [tasks.dayOffs]);

    const { fixedOffDays, requestedOffDatesForMonth } = useMemo(() => {
        const fixedDays = new Set<DayOfWeek>();
        const requestedDates: { [key in DayOfWeek]?: string[] } = {};
        const allUserDayOffs = tasks.dayOffs || [];

        allUserDayOffs
            .filter(d => d.status === 'approved' && d.type === 'fixed')
            .forEach(d => {
                const date = new Date(`${d.date}T12:00:00Z`); // Use midday UTC to avoid timezone issues
                const dayIndex = date.getUTCDay();
                const dayOfWeek = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key as DayOfWeek] === dayIndex) as DayOfWeek;
                if (dayOfWeek) {
                    fixedDays.add(dayOfWeek);
                }
            });

        allUserDayOffs
            .filter(d => d.status === 'approved' && d.type === 'request' && d.date.startsWith(currentMonthKey))
            .forEach(d => {
                const date = new Date(`${d.date}T12:00:00Z`);
                const dayIndex = date.getUTCDay();
                const dayOfWeek = Object.keys(dayOfWeekMap).find(key => dayOfWeekMap[key as DayOfWeek] === dayIndex) as DayOfWeek;
                if (dayOfWeek) {
                    if (!requestedDates[dayOfWeek]) {
                        requestedDates[dayOfWeek] = [];
                    }
                    requestedDates[dayOfWeek]!.push(d.date);
                    requestedDates[dayOfWeek]!.sort();
                }
            });

        return { fixedOffDays: fixedDays, requestedOffDatesForMonth: requestedDates };
    }, [tasks.dayOffs, currentMonthKey]);

    const historyForCurrentMonth = useMemo(() => {
        return (history || []).filter(h => h.monthKey === currentMonthKey).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [history, currentMonthKey]);
    
    const toggleLocationInput = (key: string, show?: boolean) => {
      setLocationVisibility(prev => ({ ...prev, [key]: show !== undefined ? show : !prev[key] }));
    };

    const changeMonth = (offset: number) => {
        const currentDate = new Date(`${currentMonthKey}-15T12:00:00Z`); // Use mid-month to avoid timezone day shifts
        currentDate.setUTCMonth(currentDate.getUTCMonth() + offset);
        setCurrentMonthKey(getMonthKey(currentDate));
    };
    
    const handleToggleGroup = (groupId: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(groupId)) newSet.delete(groupId);
            else newSet.add(groupId);
            return newSet;
        })
    };
    
    const handleDownloadPdf = () => {
        const doc = new jsPDF();
        doc.text(`Task History for ${formatMonthKey(currentMonthKey)}`, 14, 16);
        doc.autoTable({
            startY: 22,
            head: [['Date', 'User', 'Action', 'Task', 'Details']],
            body: historyForCurrentMonth.map(h => [
                new Date(h.timestamp).toLocaleString(),
                h.user,
                h.action,
                h.taskText,
                h.details,
            ]),
            styles: { fontSize: 8 },
            headStyles: { fillColor: [209, 23, 49] },
        });
        doc.save(`history_${currentMonthKey}.pdf`);
    };

    const handleAddDailyTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (dailyTaskInput.text.trim()) {
            onAddTask(dailyTaskInput.text.trim(), false, null, null, undefined, dailyTaskInput.location.trim());
            setDailyTaskInput(initialInputState);
            toggleLocationInput('daily', false);
        }
    };
    
    const handleAddMonthlyTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (monthlyTaskInput.text.trim()) {
            onAddTask(monthlyTaskInput.text.trim(), undefined, currentMonthKey, null, undefined, monthlyTaskInput.location.trim());
            setMonthlyTaskInput(initialInputState);
            toggleLocationInput('monthly', false);
        }
    };
    
    const handleAddGroup = (e: React.FormEvent) => {
        e.preventDefault();
        if (newGroupName.trim()) {
            onAddGroup(currentMonthKey, newGroupName.trim(), newGroupType);
            setNewGroupName('');
        }
    };
    
    const handleAddGroupTask = (e: React.FormEvent, groupId: string, day?: DayOfWeek) => {
        e.preventDefault();
        const key = `${groupId}-${day || 'custom'}`;
        const inputState = groupTaskInput[key] || initialInputState;
        if (inputState.text && inputState.text.trim()) {
            onAddTask(inputState.text.trim(), undefined, currentMonthKey, groupId, day, inputState.location.trim());
            setGroupTaskInput(prev => ({ ...prev, [key]: initialInputState }));
            toggleLocationInput(key, false);
    
            // Ensure the group stays open
            setExpandedGroups(prev => {
                if (prev.has(groupId)) return prev;
                const newSet = new Set(prev);
                newSet.add(groupId);
                return newSet;
            });
            
            // Refocus the input after state update
            setTimeout(() => {
                inputRefs.current[key]?.focus();
            }, 0);
        }
    };

    const handleUpdateGroupKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, groupId: string) => {
        if (e.key === 'Enter') {
            onUpdateGroup(currentMonthKey, groupId, editingGroupText);
            setEditingGroupId(null);
        } else if (e.key === 'Escape') {
            setEditingGroupId(null);
        }
    };
    
    const handleUpdateGroupBlur = (groupId: string) => {
        if (editingGroupText.trim()) {
            onUpdateGroup(currentMonthKey, groupId, editingGroupText);
        }
        setEditingGroupId(null);
    }

    const startEditingGroup = (group: TaskGroup) => {
        setEditingGroupId(group.id);
        setEditingGroupText(group.name);
    };

    const dailySortType = sortConfig['daily'] || 'manual';
    const sortedDailyTasks = useMemo(() => sortTasks(tasks.daily, dailySortType), [tasks.daily, dailySortType]);
    
    const generalMonthlySortType = sortConfig[`general-${currentMonthKey}`] || 'manual';
    const sortedGeneralMonthlyTasks = useMemo(() => sortTasks(currentMonthData.generalTasks, generalMonthlySortType), [currentMonthData.generalTasks, generalMonthlySortType]);

    const [yearStr, monthStr] = currentMonthKey.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Tasks */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Daily Repetitive Tasks</h2>
                   <select value={dailySortType} onChange={e => setSortConfig(s => ({...s, daily: e.target.value as SortType}))} className="bg-gray-700 text-xs rounded-md p-1 border border-gray-600 focus:ring-red-500 focus:border-red-500">
                      <option value="manual">Sort: Manual</option>
                      <option value="priority">Sort: Priority</option>
                      <option value="name">Sort: Name (A-Z)</option>
                  </select>
              </div>
              <div className="mb-4">
                  <TaskList {...props} tasks={sortedDailyTasks} />
              </div>
              <form onSubmit={handleAddDailyTask} className="space-y-2">
                   <div className="flex space-x-2">
                      <input
                          type="text"
                          value={dailyTaskInput.text}
                          onChange={(e) => setDailyTaskInput(prev => ({...prev, text: e.target.value}))}
                          placeholder="Add new daily task..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                      />
                      <button type="submit" className="p-2 bg-red-600 rounded-md hover:bg-red-500"><PlusIcon className="w-5 h-5"/></button>
                  </div>
                  {locationVisibility['daily'] ? (
                        <div className="flex items-center space-x-2 animate-fade-in">
                            <input
                                type="text"
                                value={dailyTaskInput.location}
                                onChange={(e) => setDailyTaskInput(prev => ({ ...prev, location: e.target.value }))}
                                placeholder="Location (e.g., Store Name)"
                                className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                autoFocus
                            />
                            <button type="button" onClick={() => { toggleLocationInput('daily', false); setDailyTaskInput(prev => ({ ...prev, location: '' })); }} className="p-2 text-gray-400 hover:text-white" title="Remove location">
                                <CloseIcon className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={() => toggleLocationInput('daily', true)} className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors pt-1">
                            <LocationMarkerIcon className="w-4 h-4 mr-2" />
                            Add Location
                        </button>
                    )}
              </form>
          </div>

          {/* Monthly Tasks */}
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Monthly Tasks</h2>
                  <div className="flex items-center space-x-2">
                      <button onClick={() => setDayOffModalOpen(true)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600" title="Request Day Off"><CalendarIcon className="w-5 h-5"/></button>
                      <button onClick={() => setHistoryModalOpen(true)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600" title="View History"><HistoryIcon className="w-5 h-5"/></button>
                      <button onClick={() => changeMonth(-1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600">&lt;</button>
                      <span className="font-semibold text-sm w-32 text-center">{formatMonthKey(currentMonthKey)}</span>
                      <button onClick={() => changeMonth(1)} className="p-2 rounded-md bg-gray-700 hover:bg-gray-600">&gt;</button>
                  </div>
              </div>
              
              <div className="space-y-6">
                  <div>
                       <button onClick={() => setGeneralTasksOpen(v => !v)} className="w-full flex justify-between items-center mb-2" aria-expanded={isGeneralTasksOpen}>
                          <h3 className="text-lg font-semibold text-gray-300">General Monthly Tasks</h3>
                          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isGeneralTasksOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isGeneralTasksOpen ? 'max-h-screen' : 'max-h-0'}`}>
                          <div className="flex justify-end mb-2">
                              <select value={generalMonthlySortType} onChange={e => setSortConfig(s => ({...s, [`general-${currentMonthKey}`]: e.target.value as SortType}))} className="bg-gray-700 text-xs rounded-md p-1 border border-gray-600 focus:ring-red-500 focus:border-red-500">
                                  <option value="manual">Sort: Manual</option>
                                  <option value="priority">Sort: Priority</option>
                                  <option value="name">Sort: Name (A-Z)</option>
                              </select>
                          </div>
                          <div className="mb-2">
                              <TaskList {...props} tasks={sortedGeneralMonthlyTasks} />
                          </div>
                          <form onSubmit={handleAddMonthlyTask} className="space-y-2">
                               <div className="flex space-x-2">
                                  <input
                                      type="text"
                                      value={monthlyTaskInput.text}
                                      onChange={(e) => setMonthlyTaskInput(prev => ({...prev, text: e.target.value}))}
                                      placeholder="Add general task..."
                                      className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                  />
                                   <button type="submit" className="p-2 bg-red-600 rounded-md hover:bg-red-500"><PlusIcon className="w-5 h-5"/></button>
                              </div>
                                {locationVisibility['monthly'] ? (
                                    <div className="flex items-center space-x-2 animate-fade-in">
                                        <input
                                            type="text"
                                            value={monthlyTaskInput.location}
                                            onChange={(e) => setMonthlyTaskInput(prev => ({ ...prev, location: e.target.value }))}
                                            placeholder="Location (e.g., Store Name)"
                                            className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500"
                                            autoFocus
                                        />
                                        <button type="button" onClick={() => { toggleLocationInput('monthly', false); setMonthlyTaskInput(prev => ({ ...prev, location: '' })); }} className="p-2 text-gray-400 hover:text-white" title="Remove location">
                                            <CloseIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => toggleLocationInput('monthly', true)} className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors pt-1">
                                        <LocationMarkerIcon className="w-4 h-4 mr-2" />
                                        Add Location
                                    </button>
                                )}
                          </form>
                      </div>
                  </div>

                  <div className="border-t border-gray-700 pt-4 space-y-4">
                       {currentMonthData.groups.map(group => {
                          const isExpanded = expandedGroups.has(group.id);
                          return (
                              <div key={group.id} className="bg-gray-900/50 p-4 rounded-md">
                                  <div className="flex justify-between items-center mb-2 group">
                                      <button onClick={() => handleToggleGroup(group.id)} className="flex-1 flex items-center text-left" aria-expanded={isExpanded}>
                                          {editingGroupId === group.id ? (
                                              <input type="text" value={editingGroupText} onChange={(e) => setEditingGroupText(e.target.value)} onKeyDown={(e) => handleUpdateGroupKeyDown(e, group.id)} onBlur={() => handleUpdateGroupBlur(group.id)} onClick={e => e.stopPropagation()} className="bg-gray-600 text-white rounded px-2 py-1 text-md font-semibold" autoFocus />
                                          ) : ( <h3 className="text-md font-semibold text-gray-200">{group.name}</h3> )}
                                          <span className="ml-2 text-xs text-gray-500 uppercase font-bold">{group.type}</span>
                                      </button>
                                      <div className="flex items-center">
                                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
                                              <button onClick={(e) => { e.stopPropagation(); startEditingGroup(group); }} className="p-1.5 text-gray-400 hover:text-white" title="Edit group name"><PencilIcon className="w-4 h-4" /></button>
                                              <button onClick={(e) => { e.stopPropagation(); setDeletingGroup(group); }} className="p-1.5 text-gray-400 hover:text-red-500" title="Delete group"><TrashIcon className="w-4 h-4" /></button>
                                          </div>
                                          <button onClick={() => handleToggleGroup(group.id)} className="p-1 ml-2"><ChevronDownIcon className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} /></button>
                                      </div>
                                  </div>
                                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded ? 'max-h-screen' : 'max-h-0'}`}>
                                      {group.type === 'custom' ? (
                                          (() => {
                                            const key = `${group.id}-custom`;
                                            return (
                                              <>
                                                <TaskList {...props} tasks={group.tasks} />
                                                <form onSubmit={(e) => handleAddGroupTask(e, group.id)} className="space-y-2 mt-2">
                                                    <div className="flex space-x-2">
                                                        <input type="text" value={(groupTaskInput[key] || initialInputState).text} onChange={(e) => setGroupTaskInput(prev => ({...prev, [key]: {...(prev[key] || initialInputState), text: e.target.value}}))} placeholder="Add task to group..." className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500" />
                                                        <button type="submit" className="p-2 bg-gray-600 rounded-md hover:bg-gray-500"><PlusIcon className="w-5 h-5"/></button>
                                                    </div>
                                                    {locationVisibility[key] ? (
                                                      <div className="flex items-center space-x-2 animate-fade-in">
                                                          <input type="text" value={(groupTaskInput[key] || initialInputState).location} onChange={(e) => setGroupTaskInput(prev => ({...prev, [key]: {...(prev[key] || initialInputState), location: e.target.value}}))} placeholder="Location (optional)" className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500" autoFocus/>
                                                          <button type="button" onClick={() => { toggleLocationInput(key, false); setGroupTaskInput(prev => ({ ...prev, [key]: {...(prev[key] || initialInputState), location: ''} })); }} className="p-2 text-gray-400 hover:text-white" title="Remove location"><CloseIcon className="w-4 h-4" /></button>
                                                      </div>
                                                    ) : (
                                                      <button type="button" onClick={() => toggleLocationInput(key, true)} className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors pt-1"><LocationMarkerIcon className="w-4 h-4 mr-2" />Add Location</button>
                                                    )}
                                                </form>
                                              </>
                                            )
                                          })()
                                      ) : (
                                          <div className="space-y-4 pt-2">
                                              {daysOfWeek.map(day => {
                                                  const isFixedDayOff = fixedOffDays.has(day);
                                                  const requestedDates = requestedOffDatesForMonth[day] || [];
                                                  
                                                  const dayIndex = dayOfWeekMap[day];
                                                  const totalOccurrences = countWeekdaysInMonth(year, monthIndex, dayIndex);
                                                  const isFullyRequestedOff = requestedDates.length > 0 && requestedDates.length >= totalOccurrences;
                                                  
                                                  const isDayFullyOff = isFixedDayOff || isFullyRequestedOff;
                                                  
                                                  let dayOffMessage = '';
                                                  if (isFixedDayOff) {
                                                      dayOffMessage = 'On Leave (Fixed)';
                                                  } else if (isFullyRequestedOff) {
                                                      dayOffMessage = 'On Leave (All instances booked)';
                                                  }
                                                  
                                                  const key = `${group.id}-${day}`;

                                                  return (
                                                      <div key={day}>
                                                          <div className="flex justify-between items-center">
                                                              <h4 className="text-sm font-bold capitalize text-gray-400">{day}</h4>
                                                          </div>
                                                          {isDayFullyOff ? (
                                                              <div className="pl-2 mt-1">
                                                                  <div className="p-2 bg-yellow-900/30 border border-yellow-700/50 rounded-md text-center">
                                                                      <p className="text-sm font-semibold text-yellow-300">{dayOffMessage}</p>
                                                                      <p className="text-xs text-yellow-500">Tasks are suspended for this day.</p>
                                                                  </div>
                                                              </div>
                                                          ) : (
                                                              <div className="pl-2 mt-1">
                                                                  {requestedDates.length > 0 && (
                                                                      <div className="mb-2 p-2 bg-yellow-900/20 border-l-4 border-yellow-600/50 text-left">
                                                                          <p className="text-xs font-semibold text-yellow-400">On Leave on: {requestedDates.join(', ')}</p>
                                                                      </div>
                                                                  )}
                                                                  <TaskList {...props} tasks={group.days[day]} />
                                                                  <form onSubmit={(e) => handleAddGroupTask(e, group.id, day)} className="space-y-2 mt-2">
                                                                      <div className="flex space-x-2">
                                                                          <input
                                                                              ref={el => { inputRefs.current[key] = el; }}
                                                                              type="text" 
                                                                              value={(groupTaskInput[key] || initialInputState).text} 
                                                                              onChange={(e) => setGroupTaskInput(prev => ({...prev, [key]: {...(prev[key] || initialInputState), text: e.target.value}}))} 
                                                                              placeholder={`Add task for ${day}...`} 
                                                                              className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-md px-3 py-1.5 text-sm focus:ring-red-500 focus:border-red-500" 
                                                                          />
                                                                          <button type="submit" className="p-1.5 bg-gray-600/80 rounded-md hover:bg-gray-500"><PlusIcon className="w-4 h-4"/></button>
                                                                      </div>
                                                                      {locationVisibility[key] ? (
                                                                        <div className="flex items-center space-x-2 animate-fade-in">
                                                                          <input type="text" value={(groupTaskInput[key] || initialInputState).location} onChange={(e) => setGroupTaskInput(prev => ({...prev, [key]: {...(prev[key] || initialInputState), location: e.target.value}}))} placeholder="Location (optional)" className="flex-1 bg-gray-700/50 border border-gray-600/50 rounded-md px-3 py-1.5 text-sm focus:ring-red-500 focus:border-red-500" autoFocus />
                                                                          <button type="button" onClick={() => { toggleLocationInput(key, false); setGroupTaskInput(prev => ({ ...prev, [key]: {...(prev[key] || initialInputState), location: ''} })); }} className="p-2 text-gray-400 hover:text-white" title="Remove location"><CloseIcon className="w-4 h-4" /></button>
                                                                        </div>
                                                                      ) : (
                                                                        <button type="button" onClick={() => toggleLocationInput(key, true)} className="flex items-center text-sm text-red-400 hover:text-red-300 transition-colors pt-1"><LocationMarkerIcon className="w-4 h-4 mr-2" />Add Location</button>
                                                                      )}
                                                                  </form>
                                                              </div>
                                                          )}
                                                      </div>
                                                  );
                                              })}
                                          </div>
                                      )}
                                  </div>
                              </div>
                          )
                       })}
                  </div>

                  <form onSubmit={handleAddGroup} className="border-t border-gray-700 pt-4">
                      <div className="flex space-x-2">
                        <input type="text" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} placeholder="Add new group name..." className="flex-1 bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm focus:ring-red-500 focus:border-red-500" />
                        <button type="submit" className="p-2 bg-red-600 rounded-md hover:bg-red-500"><PlusIcon className="w-5 h-5"/></button>
                      </div>
                      <div className="flex items-center space-x-4 mt-2 pl-1">
                          <label className="text-xs flex items-center"><input type="radio" name="groupType" value="custom" checked={newGroupType === 'custom'} onChange={() => setNewGroupType('custom')} className="mr-1.5 bg-gray-700 text-red-500 focus:ring-red-500"/> Custom</label>
                          <label className="text-xs flex items-center"><input type="radio" name="groupType" value="weekly" checked={newGroupType === 'weekly'} onChange={() => setNewGroupType('weekly')} className="mr-1.5 bg-gray-700 text-red-500 focus:ring-red-500"/> Weekly (Mon-Sun)</label>
                      </div>
                  </form>
              </div>
          </div>
      </div>
      {deletingGroup && <ConfirmationModal
          isOpen={!!deletingGroup}
          onClose={() => setDeletingGroup(null)}
          onConfirm={() => {
              onDeleteGroup(currentMonthKey, deletingGroup.id);
              setDeletingGroup(null);
          }}
          title="Delete Task Group"
          message={`Are you sure you want to delete the group "${deletingGroup.name}"? All tasks within it will also be deleted.`}
      />}
      <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          historyForMonth={historyForCurrentMonth}
          monthKey={currentMonthKey}
          onClearHistory={() => onClearHistoryForMonth(currentMonthKey)}
          onDownloadPdf={handleDownloadPdf}
      />
      <DayOffRequestModal
        isOpen={isDayOffModalOpen}
        onClose={() => setDayOffModalOpen(false)}
        onSubmit={onAddDayOffRequest}
        approvedDays={allApprovedDaysOff}
      />
    </div>
  );
};

export default TaskDashboard;