'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  period: string;
  spent: number;
  category: Category;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ categoryId: '', amount: '', period: 'monthly' });

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/finance/budgets').then((r) => r.json()),
      fetch('/api/finance/categories').then((r) => r.json()),
    ]).then(([b, c]) => {
      setBudgets(b);
      setCategories(c);
      setLoading(false);
    });
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId || !form.amount) {
      toast.error('Vul alle velden in');
      return;
    }

    const res = await fetch('/api/finance/budgets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success('Budget aangemaakt');
      setForm({ categoryId: '', amount: '', period: 'monthly' });
      setShowForm(false);
      loadData();
    } else {
      toast.error('Fout bij opslaan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Budget verwijderen?')) return;
    const res = await fetch(`/api/finance/budgets?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Verwijderd');
      loadData();
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

  // Categories available for budgets (expense only, not yet budgeted)
  const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));
  const availableCategories = categories.filter((c) => c.type === 'expense' && !budgetedCategoryIds.has(c.id));

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Budgetten</h2>
        <Button onClick={() => setShowForm(!showForm)} size="sm" disabled={availableCategories.length === 0}>
          <Plus className="w-4 h-4 mr-1" /> Nieuw budget
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Totaal budget</p>
            <p className="text-2xl font-bold">{fmt(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Totaal uitgegeven</p>
            <p className="text-2xl font-bold text-red-600">{fmt(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Resterend</p>
            <p className={`text-2xl font-bold ${totalBudget - totalSpent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {fmt(totalBudget - totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add budget form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nieuw budget</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Categorie</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Kies categorie..." /></SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.icon} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Maandelijks budget</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div className="flex items-end gap-2">
                <Button type="submit">Opslaan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuleren</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Budget cards */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : budgets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            Nog geen budgetten ingesteld. Klik op &quot;Nieuw budget&quot; om te beginnen.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget) => {
            const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
            const over = pct > 100;
            const warning = pct > 80 && !over;

            return (
              <Card key={budget.id} className={over ? 'border-red-300 dark:border-red-800' : ''}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{budget.category.icon}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{budget.category.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {over && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {!over && !warning && <CheckCircle className="w-4 h-4 text-green-500" />}
                      <button onClick={() => handleDelete(budget.id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">
                      {fmt(budget.spent)} van {fmt(budget.amount)}
                    </span>
                    <span className={`font-medium ${over ? 'text-red-600' : warning ? 'text-orange-600' : 'text-green-600'}`}>
                      {Math.round(pct)}%
                    </span>
                  </div>

                  <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : warning ? 'bg-orange-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>

                  {over && (
                    <p className="text-xs text-red-600 mt-2">
                      {fmt(budget.spent - budget.amount)} over budget
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
