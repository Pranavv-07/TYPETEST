import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { SubmissionHistoryPoint } from '../types';
import { Activity, AlertCircle, TrendingUp } from 'lucide-react';

interface ChartPoint extends SubmissionHistoryPoint {
  index: number;
  errorRate: number;
}

interface D3SessionChartProps {
  data: SubmissionHistoryPoint[];
  height?: number;
  className?: string;
  isLive?: boolean;
}

export const D3SessionChart: React.FC<D3SessionChartProps> = ({
  data,
  height = 200,
  className = '',
  isLive = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(600);
  const [hoverData, setHoverData] = useState<{
    second: number;
    wpm: number;
    rawWpm?: number;
    errorRate: number;
    errors: number;
    accuracy?: number;
    x: number;
    yWpm: number;
    yErr: number;
  } | null>(null);

  // Responsive width observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    setContainerWidth(containerRef.current.clientWidth || 600);
    return () => observer.disconnect();
  }, []);

  // Compute processed data points with error rate
  const processedData: ChartPoint[] = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map((d, index) => {
      // Calculate error rate percentage (100 - accuracy)
      const errorRate = d.accuracy !== undefined ? Math.max(0, +(100 - d.accuracy).toFixed(1)) : 0;
      return {
        ...d,
        index,
        errorRate
      };
    });
  }, [data]);

  // Render D3 chart
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 20, right: 48, bottom: 32, left: 44 };
    const width = Math.max(200, containerWidth);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    if (innerWidth <= 0 || innerHeight <= 0) return;

    // Defs: Gradients and Filters
    const defs = svg.append('defs');

    // WPM Area Gradient
    const wpmGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-wpm-gradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');

    wpmGradient.append('stop').attr('offset', '0%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.35);
    wpmGradient.append('stop').attr('offset', '100%').attr('stop-color', '#06b6d4').attr('stop-opacity', 0.0);

    // Error Rate Area Gradient
    const errGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-err-gradient')
      .attr('x1', '0')
      .attr('y1', '0')
      .attr('x2', '0')
      .attr('y2', '1');

    errGradient.append('stop').attr('offset', '0%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.25);
    errGradient.append('stop').attr('offset', '100%').attr('stop-color', '#f43f5e').attr('stop-opacity', 0.0);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // If no data or only 1 point, draw placeholders
    if (processedData.length < 2) {
      // Draw grid lines
      const yEmpty = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);
      g.append('g')
        .attr('class', 'grid')
        .call(
          d3
            .axisLeft(yEmpty)
            .ticks(4)
            .tickSize(-innerWidth)
            .tickFormat(() => '')
        )
        .selectAll('line')
        .attr('stroke', '#334155')
        .attr('stroke-dasharray', '3,3')
        .attr('stroke-opacity', 0.4);

      g.select('.domain').remove();

      // Placeholder text
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#64748b')
        .attr('font-size', '12px')
        .attr('font-family', 'monospace')
        .text(isLive ? 'Telemetry awaiting typing progression...' : 'Progression curves will plot as you type...');
      return;
    }

    // Scales
    const maxSec = Math.max(d3.max(processedData, (d: ChartPoint) => d.second) ?? 1, 5);
    const maxWpmVal = Math.max(d3.max(processedData, (d: ChartPoint) => Math.max(d.wpm, d.rawWpm || 0)) ?? 0, 40);
    const maxErrVal = Math.max(d3.max(processedData, (d: ChartPoint) => d.errorRate) ?? 0, 10);

    const xScale = d3.scaleLinear().domain([0, maxSec]).range([0, innerWidth]);
    const yWpmScale = d3.scaleLinear().domain([0, Math.ceil(maxWpmVal * 1.15)]).range([innerHeight, 0]).nice();
    const yErrScale = d3.scaleLinear().domain([0, Math.max(15, Math.ceil(maxErrVal * 1.25))]).range([innerHeight, 0]).nice();

    // Horizontal Grid Lines
    g.append('g')
      .attr('class', 'grid grid-horizontal')
      .call(
        d3
          .axisLeft(yWpmScale)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#334155')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-opacity', 0.35);

    g.selectAll('.grid .domain').remove();

    // D3 Line & Area Generators
    const wpmAreaGenerator = d3
      .area<ChartPoint>()
      .x(d => xScale(d.second))
      .y0(innerHeight)
      .y1(d => yWpmScale(d.wpm))
      .curve(d3.curveMonotoneX);

    const wpmLineGenerator = d3
      .line<ChartPoint>()
      .x(d => xScale(d.second))
      .y(d => yWpmScale(d.wpm))
      .curve(d3.curveMonotoneX);

    const rawWpmLineGenerator = d3
      .line<ChartPoint>()
      .x(d => xScale(d.second))
      .y(d => yWpmScale(d.rawWpm || d.wpm))
      .curve(d3.curveMonotoneX);

    const errLineGenerator = d3
      .line<ChartPoint>()
      .x(d => xScale(d.second))
      .y(d => yErrScale(d.errorRate))
      .curve(d3.curveMonotoneX);

    // Draw WPM Area
    g.append('path')
      .datum(processedData)
      .attr('fill', 'url(#d3-wpm-gradient)')
      .attr('d', wpmAreaGenerator);

    // Draw Raw WPM Line (dashed subtle slate/cyan)
    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,4')
      .attr('stroke-opacity', 0.5)
      .attr('d', rawWpmLineGenerator);

    // Draw Net WPM Line
    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#06b6d4')
      .attr('stroke-width', 2.5)
      .attr('d', wpmLineGenerator);

    // Draw Error Rate Line
    g.append('path')
      .datum(processedData)
      .attr('fill', 'none')
      .attr('stroke', '#f43f5e')
      .attr('stroke-width', 2)
      .attr('d', errLineGenerator);

    // Draw Error Markers where error rate > 0 or errors occur
    g.selectAll('.err-dot')
      .data(processedData.filter((d: ChartPoint) => d.errorRate > 0 || d.errors > 0))
      .enter()
      .append('circle')
      .attr('class', 'err-dot')
      .attr('cx', (d: ChartPoint) => xScale(d.second))
      .attr('cy', (d: ChartPoint) => yErrScale(d.errorRate))
      .attr('r', 3)
      .attr('fill', '#f43f5e')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 1.5);

    // X Axis (Seconds)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(8, maxSec))
      .tickFormat(d => `${d}s`);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');
    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup.selectAll('line').attr('stroke', '#334155');

    // Y Axis Left (WPM - Cyan)
    const yWpmAxis = d3.axisLeft(yWpmScale).ticks(4);
    const yWpmGroup = g.append('g').call(yWpmAxis);
    yWpmGroup.selectAll('text').attr('fill', '#22d3ee').attr('font-size', '10px').attr('font-family', 'monospace');
    yWpmGroup.select('.domain').remove();
    yWpmGroup.selectAll('line').remove();

    // Y Axis Right (Error Rate - Rose)
    const yErrAxis = d3
      .axisRight(yErrScale)
      .ticks(4)
      .tickFormat(d => `${d}%`);
    const yErrGroup = g.append('g').attr('transform', `translate(${innerWidth},0)`).call(yErrAxis);
    yErrGroup.selectAll('text').attr('fill', '#f43f5e').attr('font-size', '10px').attr('font-family', 'monospace');
    yErrGroup.select('.domain').remove();
    yErrGroup.selectAll('line').remove();

    // Overlay for mouse/touch tracking
    const bisectSecond = d3.bisector<any, number>(d => d.second).center;

    const hoverLine = g
      .append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#94a3b8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .style('opacity', 0)
      .style('pointer-events', 'none');

    const hoverDotWpm = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#22d3ee')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .style('pointer-events', 'none');

    const hoverDotErr = g
      .append('circle')
      .attr('r', 5)
      .attr('fill', '#f43f5e')
      .attr('stroke', '#0f172a')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .style('pointer-events', 'none');

    const overlay = g
      .append('rect')
      .attr('width', innerWidth)
      .attr('height', innerHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    const handlePointerMove = (event: any) => {
      const [mx] = d3.pointer(event);
      const x0 = xScale.invert(mx);
      const index = bisectSecond(processedData, x0, 0, processedData.length - 1);
      const d = processedData[index];
      if (!d) return;

      const px = xScale(d.second);
      const pyWpm = yWpmScale(d.wpm);
      const pyErr = yErrScale(d.errorRate);

      hoverLine.attr('x1', px).attr('x2', px).style('opacity', 1);
      hoverDotWpm.attr('cx', px).attr('cy', pyWpm).style('opacity', 1);
      hoverDotErr.attr('cx', px).attr('cy', pyErr).style('opacity', 1);

      setHoverData({
        second: d.second,
        wpm: d.wpm,
        rawWpm: d.rawWpm,
        errorRate: d.errorRate,
        errors: d.errors,
        accuracy: d.accuracy,
        x: px + margin.left,
        yWpm: pyWpm + margin.top,
        yErr: pyErr + margin.top
      });
    };

    const handlePointerLeave = () => {
      hoverLine.style('opacity', 0);
      hoverDotWpm.style('opacity', 0);
      hoverDotErr.style('opacity', 0);
      setHoverData(null);
    };

    overlay.on('mousemove touchmove', handlePointerMove);
    overlay.on('mouseleave touchend', handlePointerLeave);
  }, [processedData, containerWidth, height, isLive]);

  // Current stats summary
  const lastPoint = processedData[processedData.length - 1];
  const maxWpm = processedData.length > 0 ? Math.max(...processedData.map(d => d.wpm)) : 0;
  const currentWpm = lastPoint ? lastPoint.wpm : 0;
  const currentErrRate = lastPoint ? lastPoint.errorRate : 0;

  return (
    <div
      id="d3-session-chart-card"
      ref={containerRef}
      className={`bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden select-none ${className}`}
    >
      {/* Chart Header & Live Legends */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs mb-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <TrendingUp size={15} />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">Session Velocity & Error Telemetry</h4>
            <p className="text-[11px] text-slate-400 font-mono">D3.js dynamic performance curves</p>
          </div>
        </div>

        {/* Dynamic Series Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" />
            <span className="font-semibold">Net WPM:</span>
            <span className="font-bold text-slate-100">{currentWpm}</span>
            <span className="text-[10px] text-slate-400">(Peak: {maxWpm})</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300">
            <span className="w-2.5 h-0.5 bg-rose-400 rounded-full" />
            <span className="font-semibold">Error Rate:</span>
            <span className="font-bold text-slate-100">{currentErrRate}%</span>
          </div>
        </div>
      </div>

      {/* D3 Canvas Container */}
      <div className="relative w-full" style={{ height }}>
        <svg
          id="d3-typing-telemetry-svg"
          ref={svgRef}
          className="w-full h-full overflow-visible"
          style={{ width: '100%', height: `${height}px` }}
        />

        {/* Hover Crosshair Tooltip */}
        {hoverData && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3 py-2 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl backdrop-blur-md text-[11px] font-mono text-slate-200 space-y-1"
            style={{
              left: `${Math.min(Math.max(hoverData.x, 70), containerWidth - 70)}px`,
              top: `${Math.max(20, Math.min(hoverData.yWpm, height - 60))}px`
            }}
          >
            <div className="text-[10px] text-slate-400 font-bold border-b border-slate-800 pb-0.5 flex justify-between gap-4">
              <span>TIME: {hoverData.second}s</span>
              {hoverData.accuracy !== undefined && (
                <span className="text-emerald-400">{hoverData.accuracy}% ACC</span>
              )}
            </div>
            <div className="flex items-center justify-between gap-4 text-cyan-300">
              <span>Speed:</span>
              <span className="font-bold">{hoverData.wpm} WPM</span>
            </div>
            {hoverData.rawWpm && (
              <div className="flex items-center justify-between gap-4 text-sky-400 text-[10px]">
                <span>Raw Speed:</span>
                <span>{hoverData.rawWpm} WPM</span>
              </div>
            )}
            <div className="flex items-center justify-between gap-4 text-rose-400">
              <span>Error Rate:</span>
              <span className="font-bold">{hoverData.errorRate}% ({hoverData.errors} err)</span>
            </div>
          </div>
        )}
      </div>

      {/* Micro-footer metadata */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 mt-2 px-1">
        <span>LEFT AXIS: Speed (WPM)</span>
        <span>HORIZONTAL AXIS: Elapsed Time (Seconds)</span>
        <span>RIGHT AXIS: Error Rate (%)</span>
      </div>
    </div>
  );
};
