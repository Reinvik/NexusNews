"use client";

import React from 'react';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { BiasBar } from './BiasBar';
import type { StoryCluster } from '@/lib/analyzer';

interface StoryCardProps {
    cluster: StoryCluster;
}

export const StoryCard: React.FC<StoryCardProps> = ({ cluster }) => {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 leading-tight">
                    {cluster.mainTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    {cluster.summary}
                </p>

                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                        Distribución de Cobertura
                    </h4>
                    <BiasBar distribution={cluster.biasDistribution} />
                </div>
            </div>

            {/* Articles List (Table-like) */}
            <div className="bg-gray-50 dark:bg-gray-900/50">
                {/* Table Header (Hidden on small screens, visible on md) */}
                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                    <div className="col-span-2">Tendencia</div>
                    <div className="col-span-2">Hora</div>
                    <div className="col-span-3">Medio</div>
                    <div className="col-span-4">Titular</div>
                    <div className="col-span-1 text-right">Link</div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {cluster.items.map((item, i) => (
                        <a
                            key={i}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 hover:bg-white dark:hover:bg-gray-700 transition-colors group items-center"
                        >
                            {/* Tendencia (Bias) */}
                            <div className="col-span-2 flex items-center">
                                <BiasBadge bias={item.bias} />
                            </div>

                            {/* Hora (Time) */}
                            <div className="col-span-2 flex items-center text-xs text-gray-400 font-mono">
                                {new Date(item.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="md:hidden ml-1">
                                    - {new Date(item.publishedAt).toLocaleDateString()}
                                </span>
                            </div>

                            {/* Medio (Source) */}
                            <div className="col-span-3 flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-[10px] font-bold text-gray-500 dark:text-gray-300 uppercase">
                                    {item.source.substring(0, 2)}
                                </div>
                                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {item.source}
                                </span>
                            </div>

                            {/* Titular */}
                            <div className="col-span-4">
                                <span className="text-sm text-gray-600 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-medium leading-snug block">
                                    {item.title}
                                </span>
                            </div>

                            {/* Link Icon */}
                            <div className="col-span-1 flex justify-end text-gray-400 group-hover:text-indigo-500">
                                <ExternalLink className="w-4 h-4" />
                            </div>
                        </a>
                    ))}
                </div>
            </div>
        </div>
    );
};

const BiasBadge = ({ bias }: { bias?: 'left' | 'center' | 'right' }) => {
    if (!bias) return <span className="text-xs text-gray-400">-</span>;

    const styles = {
        left: 'bg-red-100 text-red-700 border-red-200',
        center: 'bg-purple-100 text-purple-700 border-purple-200',
        right: 'bg-blue-100 text-blue-700 border-blue-200',
    };

    const labels = {
        left: 'Izquierda',
        center: 'Centro',
        right: 'Derecha',
    };

    return (
        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${styles[bias]}`}>
            {labels[bias]}
        </span>
    );
};
