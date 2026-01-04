"use client";

import React, { useState } from 'react';
import { ChevronRight, ExternalLink, ImageOff } from 'lucide-react';
import { BiasBar } from './BiasBar';
import type { StoryCluster } from '@/lib/analyzer';

interface StoryCardProps {
    cluster: StoryCluster;
}

export const StoryCard: React.FC<StoryCardProps> = ({ cluster }) => {
    // Find the first valid image in the cluster
    const heroImage = cluster.items.find(item => item.urlToImage)?.urlToImage;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group/card">

            <div className="flex flex-col md:flex-row">
                {/* HERO IMAGE SECTION (Left on Desktop, Top on Mobile) */}
                <div className="md:w-1/3 relative overflow-hidden bg-gray-100 dark:bg-gray-900 min-h-[200px] md:min-h-full">
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
                    {/* Fallback container (also shows if error) */}
                    <div className={`absolute inset-0 flex items-center justify-center flex-col text-gray-400 ${heroImage ? 'hidden' : ''}`}>
                        <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-2">
                            <span className="text-indigo-500 font-bold text-lg">N</span>
                        </div>
                    </div>
                    {/* Overlay gradient for text readability on mobile if we wanted overlay text (not used here but good for premium feel) */}
                </div>

                {/* CONTENT SECTION (Right on Desktop) */}
                <div className="flex-1 flex flex-col">

                    {/* Main Header */}
                    <div className="p-6 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                            {/* Most prominent source badge? Or just bias summary? */}
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                                Cobertura Múltiple
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {new Date(cluster.firstPublishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug group-hover/card:text-indigo-700 dark:group-hover/card:text-indigo-400 transition-colors">
                            {cluster.mainTitle}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 mb-4">
                            {cluster.summary}...
                        </p>

                        {/* Bias Bar Container */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                            <div className="flex justify-between items-end mb-2">
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                                    Balance de Fuentes
                                </h4>
                            </div>
                            <BiasBar distribution={cluster.biasDistribution} />
                        </div>
                    </div>

                    {/* Articles List / Table */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex-1">
                        {/* Compact Header */}
                        <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <div className="col-span-2">Sesgo</div>
                            <div className="col-span-2">Medio</div>
                            <div className="col-span-8 text-right">Titular</div>
                        </div>

                        <div className="divide-y divide-gray-200/50 dark:divide-gray-800">
                            {cluster.items.slice(0, 5).map((item, i) => ( // Show top 5 max to preserve card height
                                <a
                                    key={i}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-6 py-3 hover:bg-white dark:hover:bg-gray-800 transition-colors group/item items-center"
                                >
                                    {/* Mobile Format: Stacked */}
                                    <div className="md:hidden flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <BiasBadge bias={item.bias} />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.source}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">
                                            {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Desktop: Bias Badge */}
                                    <div className="col-span-2 hidden md:block">
                                        <BiasBadge bias={item.bias} />
                                    </div>

                                    {/* Desktop: Source */}
                                    <div className="col-span-2 hidden md:flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate" title={item.source}>
                                            {item.source}
                                        </span>
                                    </div>

                                    {/* Headline */}
                                    <div className="col-span-12 md:col-span-8 flex justify-between items-center gap-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover/item:text-indigo-600 dark:group-hover/item:text-indigo-400 transition-colors font-medium leading-tight line-clamp-1">
                                            {item.title}
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-gray-300 group-hover/item:text-indigo-400 flex-shrink-0" />
                                    </div>
                                </a>
                            ))}
                        </div>
                        {cluster.items.length > 5 && (
                            <div className="px-6 py-2 text-center border-t border-gray-100 dark:border-gray-800">
                                <span className="text-xs font-semibold text-indigo-500 cursor-default">
                                    + {cluster.items.length - 5} fuentes más
                                </span>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};

const BiasBadge = ({ bias }: { bias?: 'left' | 'center' | 'right' }) => {
    if (!bias) return <span className="text-xs text-gray-400">-</span>;

    const styles = {
        left: 'bg-red-50 text-red-700 border-red-100', // Subtler premium colors
        center: 'bg-purple-50 text-purple-700 border-purple-100',
        right: 'bg-blue-50 text-blue-700 border-blue-100',
    };

    const labels = {
        left: 'Izquierda',
        center: 'Centro',
        right: 'Derecha',
    };

    return (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[bias]} tracking-wide`}>
            {labels[bias]}
        </span>
    );
};
