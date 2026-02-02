'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Plus,
  Calendar,
  TrendingUp,
  Pause,
  CheckCircle2,
  Play,
  Filter,
} from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetDate: string;
  progress: number;
  status: 'actief' | 'voltooid' | 'gepauzeerd';
  createdAt: string;
}

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  financieel: { label: 'Financieel', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  gezondheid: { label: 'Gezondheid', color: 'text-rose-700', bg: 'bg-rose-100' },
  carriere: { label: 'Carri\u00e8re', color: 'text-blue-700', bg: 'bg-blue-100' },
  persoonlijk: { label: 'Persoonlijk', color: 'text-violet-700', bg: 'bg-violet-100' },
  gezin: { label: 'Gezin', color: 'text-amber-700', bg: 'bg-amber-100' },
};

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  actief: { label: 'Actief', icon: <Play className="w-3 h-3" />, color: 'text-green-600' },
  voltooid: { label: 'Voltooid', icon: <CheckCircle2 className="w-3 h-3" />, color: 'text-blue-600' },
  gepauzeerd: { label: 'Gepauzeerd', icon: <Pause className="w-3 h-3" />, color: 'text-orange-600' },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('alle');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchGoals();
  }, []);

  async function fetchGoals() {
    try {
      const res = await fetch('/api/goals');
      if (res.ok) {
        const data = await res.json();
        setGoals(data);
      }
    } catch (err) {
      console.error('Fout bij ophalen doelen:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, targetDate, progress, status: 'actief' }),
      });
      if (res.ok) {
        const newGoal = await res.json();
        setGoals((prev) => [newGoal, ...prev]);
        setTitle('');
        setDescription('');
        setCategory('');
        setTargetDate('');
        setProgress(0);
        setShowForm(false);
      }
    } catch (err) {
      console.error('Fout bij toevoegen doel:', err);
    }
  }

  async function updateGoalStatus(id: string, status: string) {
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, status: status as Goal['status'] } : g)));
      }
    } catch (err) {
      console.error('Fout bij bijwerken status:', err);
    }
  }

  async function updateGoalProgress(id: string, progress: number) {
    try {
      const res = await fetch('/api/goals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, progress }),
      });
      if (res.ok) {
        setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, progress } : g)));
      }
    } catch (err) {
      console.error('Fout bij bijwerken voortgang:', err);
    }
  }

  const filteredGoals = filterStatus === 'alle' ? goals : goals.filter((g) => g.status === filterStatus);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-8 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-lg">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Doelen</h1>
            <p className="text-muted-foreground">Stel doelen, volg je voortgang en bereik meer.</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle doelen</SelectItem>
              <SelectItem value="actief">Actief</SelectItem>
              <SelectItem value="voltooid">Voltooid</SelectItem>
              <SelectItem value="gepauzeerd">Gepauzeerd</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 text-white shadow-md rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuw doel
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="rounded-xl shadow-lg border-0 bg-gradient-to-br from-white to-violet-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Nieuw doel toevoegen</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titel</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bijv. Marathon lopen"
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categorie</label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue placeholder="Kies categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryConfig).map(([key, cfg]) => (
                        <SelectItem key={key} value={key}>
                          {cfg.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Beschrijving</label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Beschrijf je doel..."
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Streefdatum</label>
                  <Input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Voortgang: {progress}%</label>
                  <Slider
                    value={[progress]}
                    onValueChange={(val) => setProgress(val[0])}
                    max={100}
                    step={5}
                    className="mt-3"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white">
                  Doel opslaan
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Doelen laden...</div>
      ) : filteredGoals.length === 0 ? (
        <Card className="rounded-xl shadow-md border-0">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg">Geen doelen gevonden</p>
            <p className="text-muted-foreground text-sm mt-1">Voeg je eerste doel toe om te beginnen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGoals.map((goal) => {
            const cat = categoryConfig[goal.category];
            const stat = statusConfig[goal.status];
            return (
              <Card
                key={goal.id}
                className="rounded-xl shadow-md border-0 hover:shadow-lg transition-shadow duration-200"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {cat && (
                          <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${cat.bg} ${cat.color}`}>
                            {cat.label}
                          </span>
                        )}
                        <span className={`flex items-center gap-1 text-xs font-medium ${stat?.color}`}>
                          {stat?.icon}
                          {stat?.label}
                        </span>
                      </div>
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                    </div>
                  </div>
                  {goal.description && (
                    <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Voortgang</span>
                      <span className="font-semibold">{goal.progress}%</span>
                    </div>
                    <Progress value={goal.progress} className="h-2 rounded-full" />
                    <Slider
                      value={[goal.progress]}
                      onValueChange={(val) => updateGoalProgress(goal.id, val[0])}
                      max={100}
                      step={5}
                      className="mt-1"
                    />
                  </div>

                  {/* Target date */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Streefdatum: {formatDate(goal.targetDate)}</span>
                  </div>

                  {/* Status actions */}
                  <div className="flex gap-2 pt-1">
                    {goal.status !== 'actief' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => updateGoalStatus(goal.id, 'actief')}
                      >
                        <Play className="w-3 h-3 mr-1" />
                        Activeren
                      </Button>
                    )}
                    {goal.status !== 'voltooid' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => updateGoalStatus(goal.id, 'voltooid')}
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Voltooien
                      </Button>
                    )}
                    {goal.status !== 'gepauzeerd' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl text-xs"
                        onClick={() => updateGoalStatus(goal.id, 'gepauzeerd')}
                      >
                        <Pause className="w-3 h-3 mr-1" />
                        Pauzeren
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {(['actief', 'voltooid', 'gepauzeerd'] as const).map((s) => {
            const count = goals.filter((g) => g.status === s).length;
            const cfg = statusConfig[s];
            return (
              <Card key={s} className="rounded-xl shadow-sm border-0 bg-gradient-to-br from-white to-slate-50">
                <CardContent className="py-4 text-center">
                  <div className={`text-2xl font-bold ${cfg.color}`}>{count}</div>
                  <div className="text-xs text-muted-foreground mt-1">{cfg.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
