"use client";

import { useState, useEffect } from 'react';
import { StoryCard } from '@/components/StoryCard';
import { CHILE_LEFT_LIST, CHILE_RIGHT_CENTER_LIST, type StoryCluster } from '@/lib/analyzer';
import { RefreshCw, Globe, MapPin, Search, Clock, MessageSquare, Newspaper } from 'lucide-react';
import clsx from 'clsx';

type Tab = 'nacional' | 'internacional' | 'anglo';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('nacional');
  const [activeCategory, setActiveCategory] = useState<string>('general');
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [clusters, setClusters] = useState<StoryCluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchNews = async (scope: Tab, query: string, category: string, date: string, source: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ scope });
      if (query.trim()) params.append('q', query.trim());
      if (category !== 'general') params.append('category', category);
      if (date) params.append('date', date);
      if (source) params.append('source', source);

      const res = await fetch(`/api/news?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

      if (data.clusters.length === 0) {
        setError("No se encontraron noticias para esta selección.");
        setClusters([]);
      } else {
        setClusters(data.clusters);
      }

    } catch (err: any) {
      console.error("Frontend Error:", err);
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchNews(activeTab, searchQuery, activeCategory, selectedDate, selectedSource);
  }, [activeTab, activeCategory, selectedDate, selectedSource]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNews(activeTab, searchQuery, activeCategory, selectedDate, selectedSource);
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSource(e.target.value);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setSearchQuery(''); // Clear manual search when switching categories to ensure category view works
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20 font-sans">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-indigo-200 dark:shadow-none">N</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight hidden md:block">
              Nexus <span className="text-indigo-600">News</span>
            </h1>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar">

            {/* Search */}
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-8 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-24 sm:w-40 transition-all"
              />
              <button type="submit" className="absolute right-2 top-1.5 text-gray-400 hover:text-indigo-600">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="h-6 w-px bg-gray-300 dark:bg-gray-600 mx-1"></div>

            {/* Refresh */}
            <button
              onClick={() => fetchNews(activeTab, searchQuery, activeCategory, selectedDate, selectedSource)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-full text-xs font-bold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Intro - Compact */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Tabs - Pill Style */}
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 inline-flex overflow-x-auto max-w-full">
            <button
              onClick={() => setActiveTab('nacional')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap",
                activeTab === 'nacional'
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              <MapPin className="w-4 h-4" />
              Nacional
            </button>
            <button
              onClick={() => setActiveTab('internacional')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap",
                activeTab === 'internacional'
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              <Globe className="w-4 h-4" />
              Internacional (ES)
            </button>
            <button
              onClick={() => setActiveTab('anglo')}
              className={clsx(
                "px-4 py-2 rounded-md text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap",
                activeTab === 'anglo'
                  ? "bg-indigo-600 text-white shadow"
                  : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              )}
            >
              <Newspaper className="w-4 h-4" />
              Mundo (EN)
            </button>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <Newspaper className="w-4 h-4 text-gray-400 ml-2" />
            <select
              value={selectedSource}
              onChange={handleSourceChange}
              className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 outline-none p-1 cursor-pointer w-40"
            >
              <option value="">Todas las fuentes</option>
              <optgroup label="Izquierda / Independiente">
                {CHILE_LEFT_LIST.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </optgroup>
              <optgroup label="Centro / Derecha">
                {CHILE_RIGHT_CENTER_LIST.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 text-sm bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <Clock className="w-4 h-4 text-gray-400 ml-2" />
            <span className="text-xs font-bold text-gray-500 uppercase mr-1">Fecha:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="bg-transparent border-none text-sm text-gray-700 dark:text-gray-200 focus:ring-0 outline-none p-1 cursor-pointer"
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate('')}
                className="text-xs text-red-500 hover:text-red-700 font-bold px-2"
                title="Borrar fecha"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Category Filters (Pills) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: 'general', label: 'General' },
            { id: 'politica', label: 'Política' },
            { id: 'economia', label: 'Economía' },
            { id: 'deportes', label: 'Deportes' },
            { id: 'tecnologia', label: 'Tecnología' },
            { id: 'salud', label: 'Salud' },
            { id: 'cultura', label: 'Cultura' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={clsx(
                "px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap",
                activeCategory === cat.id
                  ? "bg-gray-800 text-white border-gray-800 dark:bg-white dark:text-gray-900"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Query Context */}
        {searchQuery && (
          <div className="text-center text-sm text-gray-500">
            Resultados para: <span className="font-bold text-gray-800 dark:text-gray-200">"{searchQuery}"</span>
            <button
              onClick={() => { setSearchQuery(''); fetchNews(activeTab, '', activeCategory, selectedDate, selectedSource); }}
              className="ml-2 text-indigo-500 hover:underline text-xs"
            >
              (Limpiar búsqueda)
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-8 rounded-xl text-center">
            <p className="font-bold text-lg mb-2">⚠️ {error}</p>
            <p className="text-sm opacity-80">
              Intenta cambiar la fecha o busca otro término.
            </p>
            <button
              onClick={() => { setSelectedDate(''); setSelectedSource(''); fetchNews(activeTab, '', activeCategory, '', ''); }}
              className="mt-4 px-4 py-2 bg-white border border-yellow-300 rounded-lg text-sm font-semibold hover:bg-yellow-100 transition-colors"
            >
              Ver Todo
            </button>
          </div>
        )}

        {/* Feed */}
        <section className="space-y-4">
          {loading ? (
            <div className="space-y-6">
              <div className="text-center text-indigo-500 text-sm font-semibold animate-pulse">Buscando noticias en tiempo real...</div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            clusters.map((cluster) => (
              <StoryCard key={cluster.id} cluster={cluster} />
            ))
          )}
        </section>

      </main>
    </div>
  );
}
