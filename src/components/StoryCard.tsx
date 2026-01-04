"use client";

import React, { useState } from 'react';
import { ChevronRight, ExternalLink, EyeOff } from 'lucide-react';
import { BiasBar } from './BiasBar';
import type { StoryCluster, BiasType } from '@/lib/analyzer'; // Import BiasType

interface StoryCardProps {
    cluster: StoryCluster;
}

export const StoryCard: React.FC<StoryCardProps> = ({ cluster }) => {
    // Find the first valid image in the cluster
    const heroImage = cluster.items.find(item => item.urlToImage)?.urlToImage;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 group/card relative">

            {/* BLINDSPOT BADGE */}
            {cluster.blindspot && (
                <div className="absolute top-0 right-0 z-10">
                    <div className={`flex items-center gap-1 px-3 py-1 rounded-bl-xl text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${cluster.blindspotSide === 'left' ? 'bg-red-500' : 'bg-blue-600'}`}>
                        <EyeOff className="w-3 h-3" />
                        <span>Blindspot {cluster.blindspotSide === 'left' ? 'Izquierda' : 'Derecha'}</span>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row h-full">
                {/* HERO IMAGE SECTION */}
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
                    <div className="p-6 pb-4">
                        <div className="flex items-center gap-2 mb-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cluster.blindspot ? 'bg-yellow-100 text-yellow-800' : 'bg-indigo-50 text-indigo-700'}`}>
                                {cluster.blindspot ? 'Cobertura Parcial' : 'Cobertura Múltiple'}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">
                                {new Date(cluster.firstPublishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <h3 className="text-xl md:text-2xl font-serif font-bold text-gray-900 dark:text-gray-100 mb-3 leading-snug group-hover/card:text-indigo-700 transition-colors">
                            {cluster.mainTitle}
                        </h3>

                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 md:line-clamp-3 mb-4">
                            {cluster.summary}...
                        </p>

                        {/* 5-Point Bias Bar */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                            <BiasBar distribution={cluster.biasDistribution} />
                        </div>
                    </div>

                    {/* Compact List */}
                    <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex-1">
                        <div className="hidden md:grid grid-cols-12 gap-3 px-6 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            <div className="col-span-3">Sesgo</div>
                            <div className="col-span-2">Medio</div>
                            <div className="col-span-7 text-right">Titular</div>
                        </div>

                        <div className="divide-y divide-gray-200/50 dark:divide-gray-800">
                            {cluster.items.slice(0, 5).map((item, i) => (
                                <a
                                    key={i}
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 px-6 py-3 hover:bg-white dark:hover:bg-gray-800 transition-colors group/item items-center"
                                >
                                    <div className="md:hidden flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <BiasBadge bias={item.bias} />
                                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{item.source}</span>
                                        </div>
                                    </div>

                                    <div className="col-span-3 hidden md:block">
                                        <BiasBadge bias={item.bias} />
                                    </div>

                                    <div className="col-span-2 hidden md:flex items-center gap-2">
                                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-200 truncate">
                                            {item.source}
                                        </span>
                                    </div>

                                    <div className="col-span-12 md:col-span-7 flex justify-between items-center gap-4">
                                        <span className="text-sm text-gray-600 dark:text-gray-400 group-hover/item:text-indigo-600 transition-colors font-medium leading-tight line-clamp-1">
                                            {item.title}
                                        </span>
                                        <ExternalLink className="w-3 h-3 text-gray-300" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Updated Badge for 5-Point Scale
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
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${styles[bias] || styles['center']} tracking-wide whitespace-nowrap`}>
            {labels[bias] || 'Centro'}
        </span>
    );
};
