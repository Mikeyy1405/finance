import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(value: string): number {
  // Handle Dutch format: 1.234,56 -> 1234.56
  let cleaned = value.replace(/[€$\s]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // 1.234,56 format
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  return parseFloat(cleaned);
}

function parseDate(value: string): Date | null {
  // Try common formats: DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY
  const formats = [
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
  ];

  for (const fmt of formats) {
    const match = value.match(fmt);
    if (match) {
      if (fmt === formats[1]) {
        return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
      }
      return new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
    }
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

async function autoCategorize(description: string): Promise<string | null> {
  const categories = await prisma.finance_categories.findMany();
  const descLower = description.toLowerCase();

  for (const cat of categories) {
    for (const keyword of cat.keywords) {
      if (keyword && descLower.includes(keyword.toLowerCase())) {
        return cat.id;
      }
    }
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Geen bestand geüpload' }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split('\n').filter((l) => l.trim());

    if (lines.length < 2) {
      return NextResponse.json({ error: 'Bestand bevat geen data' }, { status: 400 });
    }

    // Parse header to detect columns
    const header = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/"/g, ''));

    // Try to auto-detect column indices
    const dateIdx = header.findIndex((h) => ['datum', 'date', 'boekingsdatum', 'transactiedatum'].includes(h));
    const descIdx = header.findIndex((h) => ['omschrijving', 'description', 'naam / omschrijving', 'mededelingen', 'naam'].includes(h));
    const amountIdx = header.findIndex((h) => ['bedrag', 'amount', 'bedrag (eur)', 'transactiebedrag'].includes(h));
    const debitCreditIdx = header.findIndex((h) => ['af bij', 'af/bij', 'debit/credit', 'type'].includes(h));

    // Also check for separate debit/credit columns
    const debitIdx = header.findIndex((h) => ['af', 'debit', 'debet'].includes(h));
    const creditIdx = header.findIndex((h) => ['bij', 'credit'].includes(h));

    if (dateIdx === -1 || descIdx === -1 || (amountIdx === -1 && debitIdx === -1)) {
      return NextResponse.json({
        error: 'Kan kolommen niet herkennen. Verwacht minimaal: datum, omschrijving, bedrag',
        detectedHeaders: header,
      }, { status: 400 });
    }

    const transactions = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = parseCSVLine(lines[i]);
      if (cols.length < 3) continue;

      try {
        const dateStr = cols[dateIdx]?.replace(/"/g, '');
        const desc = cols[descIdx]?.replace(/"/g, '') || '';
        const date = parseDate(dateStr);

        if (!date || !desc) continue;

        let amount: number;
        let type: string;

        if (amountIdx !== -1) {
          amount = parseAmount(cols[amountIdx]?.replace(/"/g, '') || '0');

          if (debitCreditIdx !== -1) {
            const dc = cols[debitCreditIdx]?.replace(/"/g, '').toLowerCase().trim();
            type = ['af', 'debit', 'debet', '-'].includes(dc) ? 'expense' : 'income';
            amount = Math.abs(amount);
          } else {
            type = amount < 0 ? 'expense' : 'income';
            amount = Math.abs(amount);
          }
        } else {
          const debit = parseAmount(cols[debitIdx]?.replace(/"/g, '') || '0');
          const credit = parseAmount(cols[creditIdx]?.replace(/"/g, '') || '0');
          if (debit && !isNaN(debit) && debit > 0) {
            amount = debit;
            type = 'expense';
          } else {
            amount = credit;
            type = 'income';
          }
        }

        if (isNaN(amount) || amount === 0) continue;

        const categoryId = await autoCategorize(desc);

        transactions.push({
          date,
          description: desc,
          amount,
          type,
          categoryId,
          source: 'upload' as const,
        });
      } catch {
        errors.push(`Regel ${i + 1}: kon niet worden verwerkt`);
      }
    }

    // Bulk create
    const created = await prisma.finance_transactions.createMany({ data: transactions });

    return NextResponse.json({
      imported: created.count,
      total: transactions.length,
      errors,
      categorized: transactions.filter((t) => t.categoryId).length,
      uncategorized: transactions.filter((t) => !t.categoryId).length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
