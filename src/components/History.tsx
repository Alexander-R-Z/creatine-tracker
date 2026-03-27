import { useMemo, useState } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { AppState, getLogForDate, updateDayLog } from '../lib/storage';
import { cn } from '../lib/utils';
import { Plus, Minus, Check, Calendar, ChevronRight, FolderArchive } from 'lucide-react';

interface HistoryProps {
  state: AppState;
  updateState: (updater: (prev: AppState) => AppState) => void;
}

export default function History({ state, updateState }: HistoryProps) {
  const last7Days = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }).map((_, i) => subDays(now, i));
  }, []);

  const last24Months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 24 }).map((_, i) => subMonths(now, i));
  }, []);

  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const startEditing = (dateStr: string, currentTotal: number) => {
    setEditingDate(dateStr);
    setEditValue(currentTotal);
  };

  const saveEdit = () => {
    if (editingDate) {
      updateState(prev => updateDayLog(prev, editingDate, editValue));
      setEditingDate(null);
    }
  };

  return (
    <div className="space-y-10 pt-4 pb-20">
      {/* Recent Activity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Calendar className="text-[#00fdc1] w-4 h-4" />
          <span className="text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase">Recent Activity</span>
        </div>
        
        <div className="space-y-3">
          {last7Days.map((date, idx) => {
            const dateStr = format(date, 'yyyy-MM-dd');
            const log = getLogForDate(state, dateStr);
            const isToday = idx === 0;
            const isEditing = editingDate === dateStr;
            const isCompleted = log.total >= state.settings.dailyGoal;

            return (
              <div 
                key={dateStr}
                className={cn(
                  "bg-[#262626]/60 backdrop-blur-xl rounded-2xl p-4 border transition-all",
                  isEditing ? "border-[#00fdc1]/50" : "border-white/5"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isToday ? "text-[#00fdc1]" : "text-[#ababab]"
                    )}>
                      {isToday ? "Today" : format(date, 'EEEE')}
                    </span>
                    <span className="text-[10px] text-[#ababab]/60">{format(date, 'MMM dd, yyyy')}</span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setEditValue(prev => Math.max(0, prev - 1))}
                          className="w-8 h-8 rounded-full bg-[#131313] flex items-center justify-center text-white"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="text-xl font-headline font-bold text-white w-12 text-center">{editValue}g</span>
                        <button 
                          onClick={() => setEditValue(prev => prev + 1)}
                          className="w-8 h-8 rounded-full bg-[#131313] flex items-center justify-center text-white"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button 
                        onClick={saveEdit}
                        className="w-8 h-8 rounded-full bg-[#00fdc1] flex items-center justify-center text-[#004734]"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <div 
                      onClick={() => startEditing(dateStr, log.total)}
                      className="flex items-center gap-4 cursor-pointer group"
                    >
                      <div className="flex flex-col items-end">
                        <span className={cn(
                          "text-xl font-headline font-bold",
                          isCompleted ? "text-[#00fdc1]" : "text-white"
                        )}>
                          {log.total}<span className="text-xs font-medium text-[#ababab] ml-0.5">/ {state.settings.dailyGoal}g</span>
                        </span>
                        <div className="w-24 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={cn("h-full transition-all duration-500", isCompleted ? "bg-[#00fdc1]" : "bg-[#7f98ff]")}
                            style={{ width: `${Math.min(100, (log.total / state.settings.dailyGoal) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Historical Archive */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 mb-2">
          <FolderArchive className="text-[#7f98ff] w-4 h-4" />
          <span className="text-xs font-headline font-bold tracking-widest text-[#ababab] uppercase">Historical Archive</span>
        </div>

        <div className="space-y-6">
          {last24Months.map((monthDate, idx) => {
            const monthName = format(monthDate, 'MMMM');
            const year = format(monthDate, 'yyyy');
            const days = eachDayOfInterval({
              start: startOfMonth(monthDate),
              end: endOfMonth(monthDate)
            });

            const completedDays = days.filter(d => {
              const log = getLogForDate(state, format(d, 'yyyy-MM-dd'));
              return log.total >= state.settings.dailyGoal;
            }).length;

            // Only show months that have data or are recent (last 3 months)
            const hasData = completedDays > 0;
            const isRecent = idx < 3;
            if (!hasData && !isRecent) return null;

            return (
              <div key={idx} className="bg-[#131313]/80 backdrop-blur-xl rounded-2xl p-5 border border-white/5">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline font-bold text-lg text-white">{monthName}</h3>
                    <p className="text-[#ababab] text-[10px] font-bold uppercase tracking-widest">{year}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-headline font-black text-[#00fdc1]">
                      {completedDays}<span className="text-xs text-[#ababab] ml-0.5">/{days.length}</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {days.map((day, dIdx) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const log = getLogForDate(state, dateStr);
                    const isCompleted = log.total >= state.settings.dailyGoal;
                    const hasLog = log.total > 0;

                    return (
                      <div 
                        key={dIdx}
                        className={cn(
                          "aspect-square rounded-md flex items-center justify-center border transition-all",
                          isCompleted 
                            ? "bg-[#00fdc1]/20 border-[#00fdc1]/20" 
                            : hasLog 
                              ? "bg-[#7f98ff]/20 border-[#7f98ff]/20"
                              : "bg-[#262626]/40 border-white/5"
                        )}
                      >
                        {hasLog && (
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            isCompleted ? "bg-[#00fdc1] shadow-[0_0_8px_rgba(0,253,193,0.6)]" : "bg-[#7f98ff]"
                          )} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
