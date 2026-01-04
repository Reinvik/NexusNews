"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

// 5-point bias distribution type (must match analyzer.ts but defined here for component isolation or imported if possible)
// To keep it simple we'll assume the props match the shape
interface BiasBarProps {
    distribution: {
        'left': number;
        'center-left': number;
        'center': number;
        'center-right': number;
        'right': number;
    };
    className?: string;
}

export const BiasBar: React.FC<BiasBarProps> = ({ distribution, className }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        // Extract values, default to 0 if undefined (safety)
        const left = distribution['left'] || 0;
        const centerLeft = distribution['center-left'] || 0;
        const center = distribution['center'] || 0;
        const centerRight = distribution['center-right'] || 0;
        const right = distribution['right'] || 0;

        const total = left + centerLeft + center + centerRight + right;
        const totalCount = total === 0 ? 1 : total;

        const data = [
            { label: 'Izquierda', value: left, color: '#dc2626' },        // Strong Red
            { label: 'Centro-Izq', value: centerLeft, color: '#f87171' }, // Soft Red
            { label: 'Centro', value: center, color: '#a855f7' },         // Purple
            { label: 'Centro-Der', value: centerRight, color: '#60a5fa' },// Soft Blue
            { label: 'Derecha', value: right, color: '#2563eb' }          // Strong Blue
        ];

        const width = 300;
        const height = 20;
        const radius = 6;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        const xScale = d3.scaleLinear()
            .domain([0, totalCount])
            .range([0, width]);

        let currentX = 0;

        data.forEach((d, i) => {
            const segmentWidth = xScale(d.value);

            if (segmentWidth > 0) {
                svg.append('rect')
                    .attr('x', currentX)
                    .attr('y', 0)
                    .attr('width', segmentWidth)
                    .attr('height', height)
                    .attr('fill', d.color)
                    .attr('rx', (i === 0 && d.value > 0) || (i === 4 && d.value > 0 && currentX + segmentWidth >= width - 1) ? radius : 0) // Basic rounding logic
                    // A better rounding logic effectively needs clip paths or checking neighbors, but this is okay for MVP
                    .attr('title', `${d.label}: ${d.value}`);

                currentX += segmentWidth;
            }
        });

    }, [distribution]);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>

            {/* Text Legend for 5 points might be too wide, let's group if possible or just show scale */}
            <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider w-full">
                <div className="flex gap-2">
                    {distribution.left > 0 && <span className="text-red-600">E. Izq ({distribution.left})</span>}
                    {distribution['center-left'] > 0 && <span className="text-red-400">C. Izq ({distribution['center-left']})</span>}
                </div>

                {distribution.center > 0 && <span className="text-purple-600">Centro ({distribution.center})</span>}

                <div className="flex gap-2 justify-end">
                    {distribution['center-right'] > 0 && <span className="text-blue-400">C. Der ({distribution['center-right']})</span>}
                    {distribution.right > 0 && <span className="text-blue-600">E. Der ({distribution.right})</span>}
                </div>
            </div>

            <svg
                ref={svgRef}
                viewBox="0 0 300 20"
                className="w-full h-5 rounded-full bg-gray-100 overflow-hidden"
                preserveAspectRatio="none"
            />
        </div>
    );
};
