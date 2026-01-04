"use client";

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface BiasBarProps {
    distribution: {
        left: number;
        center: number;
        right: number;
    };
    className?: string;
}

export const BiasBar: React.FC<BiasBarProps> = ({ distribution, className }) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!svgRef.current) return;

        const { left, center, right } = distribution;
        const total = left + center + right;

        const totalCount = total === 0 ? 1 : total;
        const data = [
            { label: 'Izquierda', value: left, color: '#ef4444' }, // Red (Requested)
            { label: 'Centro', value: center, color: '#a855f7' }, // Purple/Gray
            { label: 'Derecha', value: right, color: '#3b82f6' } // Blue (Requested)
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
                    .attr('rx', i === 0 || i === data.length - 1 ? radius : 0);

                currentX += segmentWidth;
            }
        });

    }, [distribution]);

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
                <span className="text-red-600">Izquierda ({distribution.left})</span>
                <span className="text-purple-600">Centro ({distribution.center})</span>
                <span className="text-blue-500">Derecha ({distribution.right})</span>
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
