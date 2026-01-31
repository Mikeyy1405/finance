'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: string;
  source: string;
  category: Category | null;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [filterType, setFilterType] = useState<string>('all');

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: '',
    type: 'expense',
    categoryId: '',
    notes: '',
  });

  const loadData = useCallback(() => {
    setLoading(true);
    const typeParam = filterType !== 'all' ? `&type=${filterType}` : '';
    Promise.all([
      fetch(`/api/finance/transactions?month=${month}${typeParam}`).then((r) => r.json()),
      fetch('/api/finance/categories').then((r) => r.json()),
    ]).then(([txs, cats]) => {
      setTransactions(txs);
      setCategories(cats);
      setLoading(false);
    });
  }, [month, filterType]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) {
      toast.error('Vul alle verplichte velden in');
      return;
    }

    const res = await fetch('/api/finance/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      toast.success('Transactie toegevoegd');
      setForm({ date: new Date().toISOString().split('T')[0], description: '', amount: '', type: 'expense', categoryId: '', notes: '' });
      setShowForm(false);
      loadData();
    } else {
      toast.error('Fout bij opslaan');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Weet je zeker dat je deze transactie wilt verwijderen?')) return;
    const res = await fetch(`/api/finance/transactions?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Verwijderd');
      loadData();
    }
  };

  const fmt = (n: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });

  const filteredCategories = categories.filter((c) => c.type === form.type);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Transacties</h2>
        <div className="flex items-center gap-3">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
          >
            <option value="all">Alle</option>
            <option value="income">Inkomsten</option>
            <option value="expense">Uitgaven</option>
          </select>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="w-4 h-4 mr-1" /> Toevoegen
          </Button>
        </div>
      </div>

      {/* Add transaction form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Nieuwe transactie</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Datum *</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div>
                <Label>Omschrijving *</Label>
                <Input
                  placeholder="bijv. Albert Heijn boodschappen"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <Label>Bedrag *</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v, categoryId: '' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Uitgave</SelectItem>
                    <SelectItem value="income">Inkomst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Categorie</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Kies categorie..." /></SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notitie</Label>
                <Input
                  placeholder="Optioneel..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
              <div className="md:col-span-2 lg:col-span-3 flex gap-2">
                <Button type="submit">Opslaan</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuleren</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Transactions list */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Geen transacties gevonden voor deze periode</p>
          ) : (
            <div className="space-y-1">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xl flex-shrink-0">{tx.category?.icon || (tx.type === 'income' ? '💰' : '📦')}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{fmtDate(tx.date)}</span>
                        {tx.category && <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{tx.category.name}</span>}
                        {tx.source === 'upload' && <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 px-2 py-0.5 rounded">Import</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold flex items-center gap-1 ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {fmt(tx.amount)}
                    </span>
                    <button onClick={() => handleDelete(tx.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
