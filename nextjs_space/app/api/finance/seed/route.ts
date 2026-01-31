import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  { name: 'Salaris', icon: '💰', color: '#22c55e', type: 'income', keywords: ['salaris', 'loon', 'salary', 'wage', 'netto'] },
  { name: 'Freelance', icon: '💻', color: '#10b981', type: 'income', keywords: ['freelance', 'factuur', 'invoice', 'opdracht'] },
  { name: 'Overige Inkomsten', icon: '📥', color: '#06b6d4', type: 'income', keywords: ['terugbetaling', 'refund', 'bonus', 'dividend'] },
  { name: 'Boodschappen', icon: '🛒', color: '#f59e0b', type: 'expense', keywords: ['albert heijn', 'jumbo', 'lidl', 'aldi', 'plus', 'dirk', 'supermarkt', 'ah'] },
  { name: 'Huur & Wonen', icon: '🏠', color: '#ef4444', type: 'expense', keywords: ['huur', 'rent', 'hypotheek', 'mortgage', 'woningcorporatie'] },
  { name: 'Energie & Water', icon: '⚡', color: '#f97316', type: 'expense', keywords: ['vattenfall', 'eneco', 'essent', 'greenchoice', 'energie', 'gas', 'water', 'vitens'] },
  { name: 'Transport', icon: '🚗', color: '#8b5cf6', type: 'expense', keywords: ['ns', 'ov-chipkaart', 'shell', 'bp', 'tankstation', 'benzine', 'parking', 'uber'] },
  { name: 'Verzekeringen', icon: '🛡️', color: '#6366f1', type: 'expense', keywords: ['verzekering', 'insurance', 'zorgverzekering', 'centraal beheer', 'aegon'] },
  { name: 'Abonnementen', icon: '📺', color: '#a855f7', type: 'expense', keywords: ['netflix', 'spotify', 'disney', 'youtube', 'kpn', 'ziggo', 'tele2', 'vodafone', 'gym', 'sportschool'] },
  { name: 'Eten & Drinken', icon: '🍕', color: '#ec4899', type: 'expense', keywords: ['restaurant', 'thuisbezorgd', 'uber eats', 'deliveroo', 'cafe', 'koffie', 'starbucks'] },
  { name: 'Kleding', icon: '👕', color: '#14b8a6', type: 'expense', keywords: ['h&m', 'zara', 'primark', 'zalando', 'nike', 'adidas', 'kleding'] },
  { name: 'Gezondheid', icon: '🏥', color: '#f43f5e', type: 'expense', keywords: ['apotheek', 'huisarts', 'tandarts', 'ziekenhuis', 'fysiotherapie'] },
  { name: 'Entertainment', icon: '🎮', color: '#d946ef', type: 'expense', keywords: ['bioscoop', 'pathe', 'steam', 'game', 'concert', 'festival'] },
  { name: 'Sparen', icon: '🏦', color: '#0ea5e9', type: 'expense', keywords: ['spaarrekening', 'savings', 'beleggen', 'investering'] },
  { name: 'Overig', icon: '📦', color: '#64748b', type: 'expense', keywords: [] },
];

export async function POST() {
  try {
    const existing = await prisma.finance_categories.count();
    if (existing > 0) {
      return NextResponse.json({ message: 'Categorieën bestaan al', count: existing });
    }

    await prisma.finance_categories.createMany({ data: defaultCategories });
    return NextResponse.json({ message: 'Categorieën aangemaakt', count: defaultCategories.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
