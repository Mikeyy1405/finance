'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Repeat,
  Plus,
  CheckCircle2,
  Circle,
  Flame,
  Zap,
  Heart,
  BookOpen,
  Dumbbell,
  Coffee,
  Moon,
  Droplets,
} from 'lucide-react';

interface Habit {
  id: string;
  name: string;
  icon: string;
  color: string;
  frequency: 'dagelijks' | 'wekelijks';
  targetCount: number;
  createdAt: string;
}

interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
}

const iconMap: Record<string, React.ReactNode> = {
  zap: <Zap className="w-5 h-5" />,
  heart: <Heart className="w-5 h-5" />,
  book: <BookOpen className="w-5 h-5" />,
  dumbbell: <Dumbbell className="w-5 h-5" />,
  coffee: <Coffee className="w-5 h-5" />,
  moon: <Moon className="w-5 h-5" />,
  droplets: <Droplets className="w-5 h-5" />,
  flame: <Flame className="w-5 h-5" />,
};

const colorOptions = [
  { value: 'violet', label: 'Violet', classes: 'bg-violet-100 text-violet-700' },
  { value: 'rose', label: 'Roze', classes: 'bg-rose-100 text-rose-700' },
  { value: 'blue', label: 'Blauw', classes: 'bg-blue-100 text-blue-700' },
  { value: 'emerald', label: 'Groen', classes: 'bg-emerald-100 text-emerald-700' },
  { value: 'amber', label: 'Geel', classes: 'bg-amber-100 text-amber-700' },
  { value: 'cyan', label: 'Cyaan', classes: 'bg-cyan-100 text-cyan-700' },
];

const colorClasses: Record<string, { bg: string; text: string; dot: string; dotDone: string }> = {
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-200', dotDone: 'bg-violet-500' },
  rose: { bg: 'bg-rose-100', text: 'text-rose-700', dot: 'bg-rose-200', dotDone: 'bg-rose-500' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-200', dotDone: 'bg-blue-500' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-200', dotDone: 'bg-emerald-500' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-200', dotDone: 'bg-amber-500' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', dot: 'bg-cyan-200', dotDone: 'bg-cyan-500' },
};

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('zap');
  const [color, setColor] = useState('violet');
  const [frequency, setFrequency] = useState<string>('dagelijks');
  const [targetCount, setTargetCount] = useState('1');

  const today = getToday();
  const last7Days = getLast7Days();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [habitsRes, logsRes] = await Promise.all([
        fetch('/api/goals/habits'),
        fetch('/api/goals/habits/log'),
      ]);
      if (habitsRes.ok) { const d = await habitsRes.json(); if (Array.isArray(d)) setHabits(d); }
      if (logsRes.ok) { const d = await logsRes.json(); if (Array.isArray(d)) setLogs(d); }
    } catch (err) {
      console.error('Fout bij ophalen gewoonten:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/goals/habits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, color, frequency, targetCount: parseInt(targetCount) }),
      });
      if (res.ok) {
        const newHabit = await res.json();
        setHabits((prev) => [newHabit, ...prev]);
        setName('');
        setIcon('zap');
        setColor('violet');
        setFrequency('dagelijks');
        setTargetCount('1');
        setShowForm(false);
      }
    } catch (err) {
      console.error('Fout bij toevoegen gewoonte:', err);
    }
  }

  async function toggleHabitLog(habitId: string, date: string) {
    const existing = logs.find((l) => l.habitId === habitId && l.date === date);
    try {
      const res = await fetch('/api/goals/habits/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date, completed: !existing?.completed }),
      });
      if (res.ok) {
        const updatedLog = await res.json();
        setLogs((prev) => {
          const filtered = prev.filter((l) => !(l.habitId === habitId && l.date === date));
          return [...filtered, updatedLog];
        });
      }
    } catch (err) {
      console.error('Fout bij loggen gewoonte:', err);
    }
  }

  function isCompleted(habitId: string, date: string): boolean {
    return logs.some((l) => l.habitId === habitId && l.date === date && l.completed);
  }

  function getStreak(habitId: string): number {
    let streak = 0;
    const d = new Date();
    while (true) {
      const dateStr = d.toISOString().split('T')[0];
      if (isCompleted(habitId, dateStr)) {
        streak++;
        d.setDate(d.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  }

  const dayLabels = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 text-white shadow-lg">
            <Repeat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gewoonten</h1>
            <p className="text-muted-foreground">Bouw dagelijkse gewoonten op en houd je voortgang bij.</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-orange-500 to-rose-600 hover:from-orange-600 hover:to-rose-700 text-white shadow-md rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuwe gewoonte
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="rounded-xl shadow-lg border-0 bg-gradient-to-br from-white to-orange-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Nieuwe gewoonte toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Naam</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Bijv. Water drinken"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Icoon</label>
                  <Select value={icon} onValueChange={setIcon}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(iconMap).map(([key]) => (
                        <SelectItem key={key} value={key}>
                          <span className="flex items-center gap-2">
                            {iconMap[key]}
                            <span className="capitalize">{key}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Kleur</label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colorOptions.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="flex items-center gap-2">
                            <span className={`w-3 h-3 rounded-full ${c.classes.split(' ')[0]}`} />
                            {c.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Frequentie</label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dagelijks">Dagelijks</SelectItem>
                      <SelectItem value="wekelijks">Wekelijks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Doelantal</label>
                  <Input
                    type="number"
                    min="1"
                    value={targetCount}
                    onChange={(e) => setTargetCount(e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-orange-500 to-rose-600 text-white">
                  Gewoonte opslaan
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Habits checklist */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Gewoonten laden...</div>
      ) : habits.length === 0 ? (
        <Card className="rounded-xl shadow-md border-0">
          <CardContent className="py-12 text-center">
            <Repeat className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg">Geen gewoonten gevonden</p>
            <p className="text-muted-foreground text-sm mt-1">Voeg je eerste gewoonte toe om te beginnen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Today section */}
          <h2 className="text-xl font-semibold">
            Vandaag &mdash;{' '}
            {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>

          <div className="space-y-3">
            {habits.map((habit) => {
              const clr = colorClasses[habit.color] || colorClasses.violet;
              const done = isCompleted(habit.id, today);
              const streak = getStreak(habit.id);

              return (
                <Card
                  key={habit.id}
                  className={`rounded-xl shadow-sm border-0 transition-all duration-200 ${
                    done ? 'bg-gradient-to-r from-white to-green-50/50' : ''
                  }`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center gap-4">
                      {/* Toggle */}
                      <button
                        onClick={() => toggleHabitLog(habit.id, today)}
                        className="flex-shrink-0 transition-transform hover:scale-110"
                      >
                        {done ? (
                          <CheckCircle2 className="w-7 h-7 text-green-500" />
                        ) : (
                          <Circle className="w-7 h-7 text-muted-foreground/40" />
                        )}
                      </button>

                      {/* Icon + name */}
                      <div className={`p-2 rounded-lg ${clr.bg} ${clr.text}`}>
                        {iconMap[habit.icon] || <Zap className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium ${done ? 'line-through text-muted-foreground' : ''}`}>
                          {habit.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {habit.frequency === 'dagelijks' ? 'Dagelijks' : 'Wekelijks'} &middot; doel: {habit.targetCount}x
                        </p>
                      </div>

                      {/* Streak */}
                      {streak > 0 && (
                        <div className="flex items-center gap-1 text-orange-500">
                          <Flame className="w-4 h-4" />
                          <span className="text-sm font-semibold">{streak}</span>
                        </div>
                      )}

                      {/* Last 7 days dots */}
                      <div className="hidden sm:flex items-center gap-1">
                        {last7Days.map((day) => {
                          const dayDone = isCompleted(habit.id, day);
                          const dayOfWeek = dayLabels[new Date(day).getDay()];
                          return (
                            <div key={day} className="flex flex-col items-center gap-0.5">
                              <span className="text-[10px] text-muted-foreground">{dayOfWeek}</span>
                              <div
                                className={`w-4 h-4 rounded-sm ${
                                  dayDone ? clr.dotDone : clr.dot
                                } transition-colors`}
                                title={new Date(day).toLocaleDateString('nl-NL')}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
