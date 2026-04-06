import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'fokuszone_pomodoro';
const HISTORY_KEY = 'fokuszone_pomodoro_history';
const STREAK_KEY = 'fokuszone_focus_streak';

interface PomodoroState {
  timeRemaining: number;
  running: boolean;
  startedAt: number | null;
  mode: 'work' | 'shortBreak' | 'longBreak';
  cycleCount: number;
  totalWorkSessions: number;
}

interface PomodoroSession {
  date: string;
  duration: number;
  completed: boolean;
  mode: string;
}

const DURATIONS = {
  work: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

function loadState(): PomodoroState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('no state');
    const saved: PomodoroState = JSON.parse(raw);
    if (saved.running && saved.startedAt) {
      const elapsed = Math.floor((Date.now() - saved.startedAt) / 1000);
      saved.timeRemaining = Math.max(0, saved.timeRemaining - elapsed);
      if (saved.timeRemaining <= 0) {
        saved.running = false;
        saved.startedAt = null;
        saved.timeRemaining = 0;
      }
    }
    return saved;
  } catch {
    return {
      timeRemaining: DURATIONS.work,
      running: false,
      startedAt: null,
      mode: 'work',
      cycleCount: 0,
      totalWorkSessions: 0,
    };
  }
}

function saveState(state: PomodoroState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function addSessionToHistory(session: PomodoroSession) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history: PomodoroSession[] = raw ? JSON.parse(raw) : [];
    history.unshift(session);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 100)));
  } catch { /* ignore */ }
}

export function getStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const data = JSON.parse(raw);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    if (data.lastDate === today) return data.streak;
    if (data.lastDate === yesterday) return data.streak;
    return 0;
  } catch {
    return 0;
  }
}

function updateStreak() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    let data = raw ? JSON.parse(raw) : { streak: 0, lastDate: '' };
    if (data.lastDate === today) return;
    if (data.lastDate === yesterday) {
      data.streak += 1;
    } else {
      data.streak = 1;
    }
    data.lastDate = today;
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function usePomodoro() {
  const [state, setState] = useState<PomodoroState>(loadState);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    if (state.running && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const next = prev.timeRemaining - 1;
          if (next <= 0) {
            const completed = true;
            addSessionToHistory({
              date: new Date().toISOString(),
              duration: DURATIONS[prev.mode],
              completed,
              mode: prev.mode,
            });
            if (prev.mode === 'work') updateStreak();

            let nextMode: PomodoroState['mode'];
            let nextCycle = prev.cycleCount;
            let nextTotal = prev.totalWorkSessions;

            if (prev.mode === 'work') {
              nextTotal += 1;
              nextCycle += 1;
              nextMode = nextCycle % 4 === 0 ? 'longBreak' : 'shortBreak';
            } else {
              nextMode = 'work';
            }

            return {
              ...prev,
              timeRemaining: DURATIONS[nextMode],
              running: false,
              startedAt: null,
              mode: nextMode,
              cycleCount: nextCycle,
              totalWorkSessions: nextTotal,
            };
          }
          return { ...prev, timeRemaining: next };
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.running, state.timeRemaining]);

  const toggle = useCallback(() => {
    setState(prev => ({
      ...prev,
      running: !prev.running,
      startedAt: !prev.running ? Date.now() : null,
    }));
  }, []);

  const reset = useCallback(() => {
    setState(prev => ({
      ...prev,
      timeRemaining: DURATIONS[prev.mode],
      running: false,
      startedAt: null,
    }));
  }, []);

  const setMode = useCallback((mode: PomodoroState['mode']) => {
    setState(prev => ({
      ...prev,
      mode,
      timeRemaining: DURATIONS[mode],
      running: false,
      startedAt: null,
    }));
  }, []);

  const minutes = Math.floor(state.timeRemaining / 60);
  const seconds = state.timeRemaining % 60;
  const progress = ((DURATIONS[state.mode] - state.timeRemaining) / DURATIONS[state.mode]) * 100;

  return {
    minutes,
    seconds,
    running: state.running,
    mode: state.mode,
    cycleCount: state.cycleCount,
    totalWorkSessions: state.totalWorkSessions,
    progress,
    toggle,
    reset,
    setMode,
  };
}

export function getSessionHistory(): PomodoroSession[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
