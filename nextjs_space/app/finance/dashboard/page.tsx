'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Summary {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  categoryBreakdown: Array<{
    categoryId: string | null;
    category: { name: string; icon: string; color: string } | null;
    total: number;
  }>;
  recentTransactions: Array<{
    id: string;
    date: string;
    description: string;
    amount: number;
    type: string;
    category: { name: string; icon: string; color: string } | null;
  }>;
}

export default function FinanceDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [loading, setLoading] = useState(true);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    // Seed categories on first load
    if (!seeded) {
      fetch('/api/finance/seed', { method: 'POST' }).then(() => setSeeded(true));
    }
  }, [seeded]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/finance/summary?month=${month}`)
      .then((r) => r.json())
      .then((data) => { setSummary(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [month, seeded]);

  const fmt = (n: number) =>
    new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Month selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Maandoverzicht</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm"
        />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Inkomsten</p>
                <p className="text-2xl font-bold text-green-600">{fmt(summary?.totalIncome || 0)}</p>
              </div>
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Uitgaven</p>
                <p className="text-2xl font-bold text-red-600">{fmt(summary?.totalExpenses || 0)}</p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Balans</p>
                <p className={`text-2xl font-bold ${(summary?.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {fmt(summary?.balance || 0)}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Uitgaven per categorie</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.categoryBreakdown && summary.categoryBreakdown.length > 0 ? (
              <div className="space-y-3">
                {summary.categoryBreakdown.map((item, i) => {
                  const pct = summary.totalExpenses > 0
                    ? (item.total / summary.totalExpenses) * 100
                    : 0;
                  return (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span>{item.category?.icon || '📦'}</span>
                          <span className="font-medium">{item.category?.name || 'Geen categorie'}</span>
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">{fmt(item.total)}</span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: item.category?.color || '#64748b',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Nog geen uitgaven deze maand</p>
            )}
          </CardContent>
        </Card>

        {/* Recent transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recente transacties</CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.recentTransactions && summary.recentTransactions.length > 0 ? (
              <div className="space-y-2">
                {summary.recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{tx.category?.icon || (tx.type === 'income' ? '💰' : '📦')}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]">
                          {tx.description}
                        </p>
                        <p className="text-xs text-gray-500">{fmtDate(tx.date)}</p>
                      </div>
                    </div>
                    <div className={`flex items-center gap-1 text-sm font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {fmt(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-8">Nog geen transacties deze maand</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
