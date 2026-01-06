"use client";

import React, { useState } from 'react';
import { ChevronRight, ExternalLink, EyeOff } from 'lucide-react';
import { BiasBar } from './BiasBar';
import type { StoryCluster, BiasType } from '@/lib/analyzer';

interface StoryCardProps {
    cluster: StoryCluster;
}

export const StoryCard: React.FC<StoryCardProps> = ({ cluster }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    // Find the first valid image in the cluster
    const heroImage = cluster.items.find(item => item.urlToImage)?.urlToImage;
    const visibleItems = isExpanded ? cluster.items : cluster.items.slice(0, 3);
    const hasMore = cluster.items.length > 3;

    interface AnalysisResult {
        framing: string | Record<string, string>;
        omissions: string[] | Record<string, string>;
        neutrality_score: number | string;
        polarization_score: number | string;
        key_contradictions: string[];
        greatest_discrepancy?: string | Record<string, string>;
        summary: string;
    }

    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (analysis) return; // Already analyzed

        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: cluster.items })
            });
            const data = await res.json();
            if (data.analysis) {
                setAnalysis(data.analysis);
            } else {
                console.error("No analysis data returned");
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 border border-gray-100 dark:border-gray-800 overflow-hidden transition-all duration-300 group/card relative">

            {/* BLINDSPOT BADGE */}
            <div className="flex flex-col h-full">
                {/* HERO IMAGE SECTION - Top Position */}
                <div className="w-full relative overflow-hidden bg-gray-100 dark:bg-gray-900 h-48 sm:h-56 shrink-0">
                    {/* BLINDSPOT BADGE - Positioned over image */}
                    {cluster.blindspot && (
                        <div className="absolute top-0 right-0 z-20">
                            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${cluster.blindspotSide === 'left' ? 'bg-red-500' : 'bg-blue-600'}`}>
                                <EyeOff className="w-3 h-3" />
                                <span>Blindspot {cluster.blindspotSide === 'left' ? 'Izquierda' : 'Derecha'}</span>
                            </div>
                        </div>
                    )}

                    {heroImage ? (
                        <img
                            src={heroImage}
                            alt={cluster.mainTitle}
                            className="w-full h-full object-cover transform transition-transform duration-700 group-hover/card:scale-105"
                            onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}

                    {/* Fallback container */}
                    <div className={`absolute inset-0 flex items-center justify-center flex-col text-gray-400 ${heroImage ? 'hidden' : ''}`}>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-2">
                            <span className="text-indigo-500 font-bold text-lg">N</span>
                        </div>
                    </div>
                </div>

                {/* CONTENT SECTION */}
                <div className="flex-1 flex flex-col">

                    {/* Header */}
                    <div className="p-6 md:p-8 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cluster.blindspot ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-50 text-indigo-700'}`}>
                                {cluster.blindspot ? 'Cobertura Parcial' : 'Cobertura Múltiple'}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {new Date(cluster.firstPublishedAt).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <h3 className="text-2xl md:text-3xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-3 leading-tight group-hover/card:text-indigo-700 transition-colors">
                            {cluster.mainTitle}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed line-clamp-2 mb-3">
                            {cluster.summary}...
                        </p>

                        {/* 5-Point Bias Bar */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-2 border border-gray-100 dark:border-gray-700/50 mb-2">
                            <BiasBar distribution={cluster.biasDistribution} />
                        </div>

                        {/* AI ANALYSIS BUTTON */}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className={`w-full mt-2 py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all ${analysis
                                ? 'bg-indigo-50 border-indigo-100 text-indigo-700 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    Analizando con IA...
                                </>
                            ) : (
                                <>
                                    <span className="text-indigo-500 text-base">✨</span>
                                    {analysis ? 'Análisis Completado' : 'Analizar Discrepancias y Omisiones'}
                                </>
                            )}
                        </button>

                        {/* ADVANCED AI REPORT */}
                        {analysis && (
                            <div className="mt-4 animate-in fade-in slide-in-from-top-2 space-y-3">

                                {/* 0. Greatest Discrepancy Highlight */}
                                {analysis.greatest_discrepancy && (
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border-l-4 border-indigo-500 shadow-sm">
                                        <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                            <span className="text-lg">⚡</span> Punto de Mayor Fricción
                                        </div>
                                        <div className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">
                                            {typeof analysis.greatest_discrepancy === 'object' ? (
                                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                                    {Object.entries(analysis.greatest_discrepancy).map(([k, v], i) => (
                                                        <li key={i}><span className="font-bold">{k}:</span> {String(v)}</li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                `"${analysis.greatest_discrepancy}"`
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 1. Framing - "Under what lens?" */}
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/30">
                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                                        Estrategia de Encuadre (Framing)
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300 leading-snug">
                                        {typeof analysis.framing === 'object' ? (
                                            <ul className="list-disc pl-4 space-y-1 mt-1">
                                                {Object.entries(analysis.framing).map(([k, v], i) => (
                                                    <li key={i}><span className="font-bold">{k}:</span> {String(v)}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            analysis.framing
                                        )}
                                    </div>
                                </div>



                                {/* 2. Neutrality & Polarization Thermometer */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Neutrality */}
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Índice de Neutralidad
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                                {Number(analysis.neutrality_score) || 5}<span className="text-sm text-gray-400 font-normal">/10</span>
                                            </span>
                                            <div className="flex-1 pb-1.5">
                                                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000"
                                                        style={{ width: `${(Number(analysis.neutrality_score) || 5) * 10}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Polarization */}
                                    <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                                            Nivel de Polarización
                                        </div>
                                        <div className="flex items-end gap-2">
                                            <span className={`text-2xl font-black ${(Number(analysis.polarization_score) || 5) > 7 ? 'text-red-500' : 'text-green-500'}`}>
                                                {Number(analysis.polarization_score) || 5}<span className="text-sm text-gray-400 font-normal">/10</span>
                                            </span>
                                            <span className="text-[10px] text-gray-400 font-medium pb-1.5">
                                                {(Number(analysis.polarization_score) || 5) > 7 ? 'Crítico' : 'Estable'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Auditoría de Omisiones */}
                                {(Array.isArray(analysis.omissions) ? analysis.omissions : (analysis.omissions ? [analysis.omissions] : [])).length > 0 && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800/30">
                                        <div className="flex items-center gap-1.5 mb-2">
                                            <span className="text-amber-500">⚠️</span>
                                            <div className="text-[10px] font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider">
                                                Auditoría de Datos Omitidos
                                            </div>
                                        </div>
                                        <ul className="space-y-1.5">
                                            {Array.isArray(analysis.omissions) ? (
                                                analysis.omissions.map((omission, idx) => (
                                                    <li key={idx} className="text-xs text-gray-700 dark:text-gray-300 flex gap-2">
                                                        <span className="text-amber-400/50">•</span>
                                                        {typeof omission === 'object' ? JSON.stringify(omission) : omission}
                                                    </li>
                                                ))
                                            ) : (
                                                typeof analysis.omissions === 'object' ? (
                                                    Object.entries(analysis.omissions).map(([k, v], i) => (
                                                        <li key={i} className="text-xs text-gray-700 dark:text-gray-300 flex gap-2">
                                                            <span className="text-amber-400/50">•</span>
                                                            <span className="font-bold">{k}:</span> {String(v)}
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-xs text-gray-700 dark:text-gray-300">{String(analysis.omissions)}</li>
                                                )
                                            )}
                                        </ul>
                                    </div>
                                )}

                                <div className="text-[10px] text-center text-gray-400 pt-1">
                                    Análisis generado por IA • Puede contener alucinaciones
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Compact List */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex-1">
                        <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <div className="col-span-2">Sesgo</div>
                            <div className="col-span-2">Medio</div>
                            <div className="col-span-8 text-right">Titular</div>
                        </div>

                        <div className="divide-y divide-gray-200/50 dark:divide-gray-800">
                            {visibleItems.map((item, i) => {
                                // Extract domain for favicon
                                let domain = '';
                                try {
                                    domain = new URL(item.url).hostname;
                                } catch (e) {
                                    domain = 'google.com';
                                }
                                const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

                                return (
                                    <a
                                        key={i}
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 md:px-8 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group/item items-center"
                                    >
                                        <div className="md:hidden flex justify-between items-center mb-1">
                                            <div className="flex items-center gap-2">
                                                <BiasBadge bias={item.bias} />
                                                <div className="flex items-center gap-1.5">
                                                    <img src={faviconUrl} alt="" className="w-3.5 h-3.5 rounded-sm opacity-80" />
                                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.source}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2 hidden md:block">
                                            <BiasBadge bias={item.bias} />
                                        </div>

                                        <div className="col-span-2 hidden md:flex items-center gap-2">
                                            <img src={faviconUrl} alt="" className="w-3.5 h-3.5 rounded-sm opacity-80" />
                                            <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate">
                                                {item.source}
                                            </span>
                                        </div>

                                        <div className="col-span-12 md:col-span-8 flex justify-between items-center gap-4">
                                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 group-hover/item:text-indigo-600 transition-colors font-medium leading-tight line-clamp-1">
                                                {item.title}
                                            </span>
                                            <ExternalLink className="w-3 h-3 text-gray-300" />
                                        </div>
                                    </a>
                                )
                            })}
                        </div>
                        {hasMore && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsExpanded(!isExpanded);
                                }}
                                className="w-full py-3 text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors text-center border-t border-dashed border-gray-200 dark:border-gray-700"
                            >
                                {isExpanded ? 'Ver menos' : `Ver ${cluster.items.length - 3} más...`}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const BiasBadge = ({ bias }: { bias?: BiasType }) => {
    if (!bias) return <span className="text-xs text-gray-400">-</span>;

    const styles: Record<string, string> = {
        'left': 'bg-red-100 text-red-800 border-red-200',
        'center-left': 'bg-rose-50 text-rose-700 border-rose-100',
        'center': 'bg-purple-50 text-purple-700 border-purple-100',
        'center-right': 'bg-sky-50 text-sky-700 border-sky-100',
        'right': 'bg-blue-100 text-blue-800 border-blue-200',
    };

    const labels: Record<string, string> = {
        'left': 'Ext. Izquierda',
        'center-left': 'C. Izquierda',
        'center': 'Centro',
        'center-right': 'C. Derecha',
        'right': 'Ext. Derecha',
    };

    return (
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border-0 ${styles[bias] || styles['center']} tracking-wide whitespace-nowrap opacity-90`}>
            {labels[bias] || 'Centro'}
        </span>
    );
};
