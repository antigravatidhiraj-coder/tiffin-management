import { useState, useEffect } from 'react';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

interface User {
  _id: string;
  name: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://tiffin-backend-9g33.onrender.com';

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUserName, setNewUserName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [tiffinStatus, setTiffinStatus] = useState<Record<string, boolean>>({});
  const [summary, setSummary] = useState<Record<string, {count: number, total: number, dates: string[]}>>({});
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  
  // Modals State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<{ id: string; name: string } | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  // Loading States
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [isSavingLog, setIsSavingLog] = useState(false);

  const currentYear = parseInt(selectedDate.split('-')[0]);
  const currentMonth = parseInt(selectedDate.split('-')[1]) - 1;

  const loadUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
        
        setTiffinStatus(prev => {
          const newStatus = { ...prev };
          data.forEach((u: User) => {
            if (newStatus[u._id] === undefined) {
              newStatus[u._id] = true; 
            }
          });
          return newStatus;
        });
      }
    } catch (e) {
      console.error('Failed to load users');
    }
  };

  const loadSummary = async () => {
    try {
      const monthStr = selectedDate.substring(0, 7);
      const res = await fetch(`${API_BASE}/tiffin/summary/${monthStr}`);
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error('Failed to load summary');
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      loadSummary();
    }
  }, [selectedDate, users]);

  useEffect(() => {
    if (users.length > 0) {
      const newStatus: Record<string, boolean> = {};
      users.forEach(user => {
        const userDates = summary[user._id]?.dates || [];
        newStatus[user._id] = userDates.includes(selectedDate);
      });
      setTiffinStatus(newStatus);
    }
  }, [selectedDate, summary, users]);

  const handleToggle = (id: string) => {
    setTiffinStatus((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;

    try {
      setIsAddingUser(true);
      const res = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newUserName.trim() })
      });
      if (res.ok) {
        toast.success(`Member "${newUserName.trim()}" added successfully!`);
        setNewUserName('');
        loadUsers(); 
      } else {
        toast.error('Failed to add member');
      }
    } catch (e) {
      toast.error('Server error while adding member');
    } finally {
      setIsAddingUser(false);
    }
  };

  const confirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    const { id, name } = deleteConfirmUser;

    try {
      setIsDeletingUser(true);
      const res = await fetch(`${API_BASE}/users/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success(`Member "${name}" deleted!`);
        setDeleteConfirmUser(null); 
        loadUsers(); 
      } else {
        toast.error('Failed to delete member');
      }
    } catch (e) {
      toast.error('Error connecting to server');
    } finally {
      setIsDeletingUser(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSavingLog(true);
      const res = await fetch(`${API_BASE}/tiffin/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: selectedDate,
          statuses: tiffinStatus
        })
      });
      
      if (res.ok) {
        toast.success('Daily entry saved successfully!');
        loadSummary(); 
      } else {
        toast.error('Failed to save daily entry');
      }
    } catch (e) {
      console.error(e);
      toast.error('Error connecting to server');
    } finally {
      setIsSavingLog(false);
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonth(currentYear, currentMonth);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleMonthChange = (offset: number) => {
    const newDate = new Date(currentYear, currentMonth + offset, 1);
    setSelectedDate(newDate.toISOString().split('T')[0]);
  };

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarCells.push(i);
  }

  const getDayDetails = (dayNum: number) => {
    const formattedDay = dayNum < 10 ? `0${dayNum}` : dayNum;
    const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : currentMonth + 1;
    const cellDateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    
    const dateObj = new Date(currentYear, currentMonth, dayNum);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const presentUsersOnDay = users.filter(user => {
      const userDates = summary[user._id]?.dates || [];
      return userDates.includes(cellDateStr);
    });

    return {
      dateStr: cellDateStr,
      isWeekend,
      presentUsers: presentUsersOnDay,
      isSelected: selectedDate === cellDateStr
    };
  };

  // Generate all date strings for the selected month to render the Detailed Report
  const generateMonthDates = () => {
    const dates = [];
    const formattedMonth = (currentMonth + 1) < 10 ? `0${currentMonth + 1}` : currentMonth + 1;
    for (let i = 1; i <= daysInMonth; i++) {
      const formattedDay = i < 10 ? `0${i}` : i;
      dates.push(`${currentYear}-${formattedMonth}-${formattedDay}`);
    }
    return dates;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-slate-200 font-sans p-4 sm:p-6 relative overflow-hidden flex flex-col justify-center">
      
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} theme="dark" transition={Slide} />

      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      <div className="max-w-7xl w-full mx-auto">
        <header className="text-center mb-6 flex items-center justify-center gap-3">
          <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-2xl backdrop-blur-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-indigo-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Tiffin Management
          </h1>
        </header>

        {/* 3-Column Desktop Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* Column 1: Calendar */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  Calendar ({monthNames[currentMonth]} {currentYear})
                </h2>
                
                <div className="flex gap-1.5">
                  <button 
                    onClick={() => handleMonthChange(-1)}
                    className="p-1.5 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>
                  <button 
                    onClick={() => handleMonthChange(1)}
                    className="p-1.5 bg-slate-900/50 hover:bg-slate-900 border border-slate-700 rounded-lg text-slate-300 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-semibold text-slate-500">
                <div>MO</div>
                <div>TU</div>
                <div>WE</div>
                <div>TH</div>
                <div>FR</div>
                <div className="text-red-400/80">SA</div>
                <div className="text-red-400/80">SU</div>
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((dayNum, index) => {
                  if (dayNum === null) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }

                  const { dateStr, isWeekend, presentUsers, isSelected } = getDayDetails(dayNum);

                  return (
                    <button
                      key={`day-${dayNum}`}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`aspect-square rounded-lg border flex flex-col justify-between p-1 transition-all ${
                        isSelected 
                          ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                          : presentUsers.length > 0 && isWeekend
                            ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-300 hover:bg-emerald-950/30'
                            : isWeekend
                              ? 'bg-red-950/20 border-red-900/10 text-red-300 hover:bg-red-950/30'
                              : 'bg-slate-900/40 border-slate-700/30 hover:bg-slate-800/80'
                      }`}
                    >
                      <span className="text-[10px] font-bold">
                        {dayNum}
                      </span>
                      
                      <div className="w-full flex justify-center gap-0.5 overflow-hidden">
                        {presentUsers.length > 0 ? (
                          presentUsers.slice(0, 3).map(u => (
                            <span 
                              key={u._id} 
                              className={`w-1 h-1 rounded-full ${
                                isSelected ? 'bg-white' : 'bg-emerald-400'
                              }`}
                            />
                          ))
                        ) : isWeekend ? (
                          <span className="text-[8px] font-medium scale-90">
                            OFF
                          </span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Daily Log & Add Member */}
          <div className="flex flex-col gap-4 justify-between">
            {/* Daily Entry Log */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-2xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-purple-400">
                      <path d="M12.75 12.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM7.5 15.375a.75.75 0 100-1.5.75.75 0 000 1.5zM12.75 15.375a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM1.5 7.5A2.25 2.25 0 013.75 5.25h16.5A2.25 2.25 0 0122.5 7.5v11.25a2.25 2.25 0 01-2.25 2.25H3.75a2.25 2.25 0 01-2.25-2.25V7.5zM3.75 6.75A.75.75 0 003 7.5v11.25c0 .414.336.75.75.75h16.5a.75.75 0 00.75-.75V7.5a.75.75 0 00-.75-.75H3.75z" />
                    </svg>
                    Daily Log: <span className="text-indigo-400 font-semibold">{selectedDate.split('-').reverse().join('-')}</span>
                  </h2>
                  {(new Date(selectedDate).getDay() === 0 || new Date(selectedDate).getDay() === 6) && (
                    <span className="px-2 py-0.5 bg-red-950/60 text-red-400 border border-red-900/50 rounded-md text-[10px] font-semibold">
                      Weekend
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                  {users.length === 0 && (
                    <div className="text-slate-400 text-center py-4 text-sm">
                      No members. Add a member below.
                    </div>
                  )}
                  {users.map((user) => (
                    <div 
                      className="flex items-center justify-between p-3 bg-slate-900/30 rounded-xl border border-slate-700/40 hover:bg-slate-800/50 transition-all" 
                      key={user._id}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm text-slate-100">{user.name}</span>
                          <span className={`text-[10px] ${tiffinStatus[user._id] ? 'text-emerald-400' : 'text-slate-500'}`}>
                            {tiffinStatus[user._id] ? 'Tiffin Delivered' : 'Opted Out'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDeleteConfirmUser({ id: user._id, name: user.name })}
                          className="p-1 text-slate-500 hover:text-red-400 rounded transition-colors"
                          title="Delete Member"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggle(user._id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
                            tiffinStatus[user._id] ? 'bg-indigo-500' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${
                              tiffinStatus[user._id] ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {users.length > 0 && (
                <button 
                  className="w-full mt-4 p-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-semibold text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  onClick={handleSave}
                  disabled={isSavingLog}
                >
                  {isSavingLog ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Log'
                  )}
                </button>
              )}
            </div>

            {/* Compact Add Member Form */}
            <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-4 border border-slate-700/50 shadow-2xl">
              <form onSubmit={handleAddUser} className="flex gap-2">
                <input 
                  type="text" 
                  placeholder="Add member name..."
                  className="flex-1 p-2.5 bg-slate-900/50 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-sm placeholder:text-slate-500"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={isAddingUser}
                >
                  {isAddingUser ? (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Add'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Column 3: Month Summary */}
          <div className="bg-slate-800/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 shadow-2xl h-full flex flex-col justify-between group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="h-full flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white relative z-10">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-emerald-400">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  Summary <span className="text-slate-400 text-xs font-normal ml-auto bg-slate-900/50 px-2 py-0.5 rounded-md">{selectedDate.substring(0, 7)}</span>
                </h2>
                
                <div className="flex flex-col gap-3 relative z-10 max-h-[220px] overflow-y-auto pr-1">
                  {users.length === 0 && (
                    <p className="text-slate-400 text-center py-4 text-sm">No data.</p>
                  )}
                  {users.map((user) => {
                    const userSummary = summary[user._id];
                    const isExpanded = expandedUser === user._id;
                    const totalAmount = userSummary?.total || 0;
                    
                    return (
                      <div className="flex flex-col p-4 bg-slate-900/40 rounded-xl border border-slate-700/40 hover:border-emerald-500/20" key={user._id}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-semibold text-slate-200 text-sm">{user.name}</span>
                            {userSummary?.count > 0 && (
                              <button 
                                onClick={() => setExpandedUser(isExpanded ? null : user._id)}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1 block transition-colors"
                              >
                                {isExpanded ? 'Hide History' : 'View History'}
                              </button>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-emerald-400">
                              ₹{totalAmount}
                            </span>
                            <span className="block text-[10px] text-slate-500">
                              {userSummary?.count || 0} Days
                            </span>
                          </div>
                        </div>
                        
                        {isExpanded && userSummary?.dates && (
                          <div className="mt-3 pt-3 border-t border-slate-700/30">
                            <div className="flex flex-wrap gap-1">
                              {userSummary.dates.sort().map(d => (
                                <span key={d} className="px-1.5 py-0.5 bg-slate-800 text-[9px] rounded border border-slate-600 text-slate-300">
                                  {d.split('-').reverse().join('-').substring(0, 5)} 
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* View Full Monthly Sheet button */}
              {users.length > 0 && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="w-full mt-4 p-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-semibold text-sm transition-all shadow-md flex items-center justify-center gap-2 relative z-10 active:scale-[0.98]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Detailed Monthly Sheet
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Custom Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700/80 rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              Are you sure?
            </h3>
            <p className="text-slate-300 text-sm mb-6 leading-relaxed">
              Do you really want to delete <span className="font-semibold text-indigo-400">"{deleteConfirmUser.name}"</span>? This will permanently erase their tiffin history for the month.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 rounded-xl font-semibold text-sm transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteUser}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isDeletingUser}
              >
                {isDeletingUser ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Member'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Monthly Sheet Modal */}
      {showReportModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/75 backdrop-blur-md z-50 p-4 overflow-hidden animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl relative animate-in zoom-in duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-md rounded-t-3xl">
              <div>
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-emerald-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  Detailed Ledger - {monthNames[currentMonth]} {currentYear}
                </h3>
                <p className="text-slate-400 text-sm mt-1">Full monthly check sheet with daily delivery status and amount per member.</p>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all border border-transparent hover:border-slate-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body (Scrollable Table) */}
            <div className="p-6 overflow-auto flex-1 bg-slate-950/20">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold sticky top-0 bg-slate-900 z-10">
                    <th className="py-3 px-4 w-[160px]">DATE</th>
                    {users.map(u => (
                      <th key={u._id} className="py-3 px-4 text-center">{u.name.toUpperCase()}</th>
                    ))}
                    <th className="py-3 px-4 text-right">DAILY TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {generateMonthDates().map(dateStr => {
                    const dateObj = new Date(dateStr);
                    const dayOfWeek = dateObj.getDay();
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    
                    const dayLabel = dateStr.split('-').reverse().join('-');
                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
                    
                    let dailyTotal = 0;

                    return (
                      <tr 
                        key={dateStr} 
                        className={`hover:bg-slate-800/20 transition-colors ${
                          isWeekend ? 'bg-red-950/5 text-slate-400' : ''
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-medium flex items-center gap-2">
                          <span className={isWeekend ? 'text-red-400' : 'text-slate-400'}>{dayName}</span>
                          <span>{dayLabel}</span>
                        </td>
                        {users.map(user => {
                          const isPresent = summary[user._id]?.dates?.includes(dateStr) || false;
                          const price = isPresent ? 70 : 0;
                          dailyTotal += price;

                          return (
                            <td key={user._id} className="py-3 px-4 text-center font-medium">
                              {isPresent ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 text-emerald-400 border border-emerald-900/30 text-xs">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  ₹70
                                </span>
                              ) : isWeekend ? (
                                <span className="text-slate-600 text-xs">OFF</span>
                              ) : (
                                <span className="text-slate-500 text-xs">-</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-right font-black text-slate-200">
                          {dailyTotal > 0 ? `₹${dailyTotal}` : <span className="text-slate-600 font-normal">-</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Modal Footer (Summary Totals) */}
            <div className="p-6 border-t border-slate-800 bg-slate-900/50 backdrop-blur-md rounded-b-3xl flex justify-between items-center text-sm font-semibold">
              <span className="text-slate-400">GRAND TOTALS:</span>
              <div className="flex gap-8 items-center">
                {users.map(user => (
                  <div key={user._id} className="text-center">
                    <span className="text-xs text-slate-400 block font-normal">{user.name}</span>
                    <span className="text-base font-bold text-emerald-400">₹{summary[user._id]?.total || 0}</span>
                  </div>
                ))}
                <div className="text-right border-l border-slate-800 pl-8">
                  <span className="text-xs text-slate-400 block font-normal">Month Budget</span>
                  <span className="text-lg font-black text-emerald-400">
                    ₹{users.reduce((acc, u) => acc + (summary[u._id]?.total || 0), 0)}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

export default App;
