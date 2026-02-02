'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Plus, Calendar, Tag, X } from 'lucide-react';

interface JournalEntry {
  id: string;
  date: string;
  title?: string;
  content: string;
  mood: number;
  tags: string[];
  createdAt: string;
}

const moodEmojis: Record<number, string> = {
  1: '\uD83D\uDE2B',
  2: '\uD83D\uDE15',
  3: '\uD83D\uDE10',
  4: '\uD83D\uDE42',
  5: '\uD83D\uDE04',
};

const moodLabels: Record<number, string> = {
  1: 'Slecht',
  2: 'Matig',
  3: 'Neutraal',
  4: 'Goed',
  5: 'Geweldig',
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(3);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const res = await fetch('/api/goals/journal');
      if (res.ok) {
        const data = await res.json();
        setEntries(data);
      }
    } catch (err) {
      console.error('Fout bij ophalen dagboek:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch('/api/goals/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, title: title || undefined, content, mood, tags }),
      });
      if (res.ok) {
        const newEntry = await res.json();
        setEntries((prev) => [newEntry, ...prev]);
        setDate(new Date().toISOString().split('T')[0]);
        setTitle('');
        setContent('');
        setMood(3);
        setTags([]);
        setTagInput('');
        setShowForm(false);
      }
    } catch (err) {
      console.error('Fout bij toevoegen dagboekitem:', err);
    }
  }

  function addTag() {
    const trimmed = tagInput.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  function handleTagKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-8 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dagboek</h1>
            <p className="text-muted-foreground">Schrijf je gedachten op en reflecteer op je dag.</p>
          </div>
        </div>
      </div>

      {/* Add button */}
      <div className="flex justify-end">
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white shadow-md rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nieuw item
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="rounded-xl shadow-lg border-0 bg-gradient-to-br from-white to-teal-50/30">
          <CardHeader>
            <CardTitle className="text-lg">Nieuw dagboekitem</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Datum</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Titel (optioneel)</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Bijv. Een mooie dag"
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Inhoud</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Schrijf hier je gedachten..."
                  required
                  rows={5}
                  className="rounded-xl"
                />
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Stemming</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMood(m)}
                      className={`text-3xl transition-all duration-150 hover:scale-110 ${
                        mood === m ? 'scale-125 drop-shadow-md' : 'opacity-40 hover:opacity-70'
                      }`}
                    >
                      {moodEmojis[m]}
                    </button>
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">{moodLabels[mood]}</span>
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Tags</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Typ een tag en druk op Enter"
                    className="rounded-xl flex-1"
                  />
                  <Button type="button" variant="outline" className="rounded-xl" onClick={addTag}>
                    <Tag className="w-4 h-4" />
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-teal-100 text-teal-700"
                      >
                        #{tag}
                        <button type="button" onClick={() => removeTag(tag)} className="hover:text-teal-900">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="rounded-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white">
                  Opslaan
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowForm(false)}>
                  Annuleren
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Entries timeline */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Dagboek laden...</div>
      ) : sortedEntries.length === 0 ? (
        <Card className="rounded-xl shadow-md border-0">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-lg">Geen dagboekitems gevonden</p>
            <p className="text-muted-foreground text-sm mt-1">Begin met schrijven om je eerste item toe te voegen.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-teal-300 to-cyan-200" />

          <div className="space-y-6">
            {sortedEntries.map((entry) => (
              <div key={entry.id} className="relative flex gap-4">
                {/* Timeline dot */}
                <div className="flex-shrink-0 w-10 flex justify-center pt-5">
                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 shadow-md ring-4 ring-white z-10" />
                </div>

                {/* Card */}
                <Card className="flex-1 rounded-xl shadow-sm border-0 hover:shadow-md transition-shadow duration-200">
                  <CardContent className="py-4 space-y-3">
                    {/* Date + mood */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(entry.date)}</span>
                      </div>
                      <div className="flex items-center gap-1" title={moodLabels[entry.mood]}>
                        <span className="text-xl">{moodEmojis[entry.mood]}</span>
                      </div>
                    </div>

                    {/* Title */}
                    {entry.title && <h3 className="text-lg font-semibold">{entry.title}</h3>}

                    {/* Content */}
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {entry.content}
                    </p>

                    {/* Tags */}
                    {entry.tags && entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {entry.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs font-medium px-2 py-0.5 rounded-full bg-teal-100 text-teal-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
