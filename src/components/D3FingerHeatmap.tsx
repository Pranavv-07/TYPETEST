import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  FingerId,
  FingerStats,
  KeyStats,
  FingerHeatmapSnapshot,
  getFingerHeatmapData,
  FINGER_DEFINITIONS,
  generateTargetedDrillForWeakKeys
} from '../services/keystrokeAnalyticsService';
import {
  Activity,
  Hand,
  Flame,
  AlertTriangle,
  Zap,
  Target,
  Sparkles,
  RotateCcw,
  PlaySquare,
  Info,
  ChevronRight,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';

interface D3FingerHeatmapProps {
  studentId?: string;
  onStartTargetedDrill?: (drillText: string, title: string) => void;
  className?: string;
}

type HeatmapMetric = 'errorRate' | 'latency' | 'load';

export const D3FingerHeatmap: React.FC<D3FingerHeatmapProps> = ({
  studentId = 'std-24b11cs355',
  onStartTargetedDrill,
  className = ''
}) => {
  const [metric, setMetric] = useState<HeatmapMetric>('errorRate');
  const [selectedFinger, setSelectedFinger] = useState<FingerId | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<FingerHeatmapSnapshot>(() =>
    getFingerHeatmapData(studentId)
  );

  const handsSvgRef = useRef<SVGSVGElement>(null);
  const keyboardSvgRef = useRef<SVGSVGElement>(null);
  const balanceSvgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Refresh data on mount or studentId change
  useEffect(() => {
    setSnapshot(getFingerHeatmapData(studentId));
  }, [studentId]);

  // Color scales using D3
  const colorScales = useMemo(() => {
    // Error rate scale: 0% (Emerald) -> 5% (Yellow) -> 10% (Amber) -> 20%+ (Rose/Crimson)
    const errorScale = d3.scaleSequential<string>()
      .domain([0, 20])
      .interpolator(t => d3.interpolateRgbBasis(['#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444', '#b91c1c'])(t));

    // Latency scale: 120ms (Emerald fast) -> 200ms (Yellow) -> 300ms+ (Purple/Rose slow)
    const latencyScale = d3.scaleSequential<string>()
      .domain([120, 320])
      .interpolator(t => d3.interpolateRgbBasis(['#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'])(t));

    // Load share scale: 0% (Slate) -> 15% (Cyan) -> 30%+ (Emerald)
    const loadScale = d3.scaleSequential<string>()
      .domain([0, 25])
      .interpolator(t => d3.interpolateRgbBasis(['#334155', '#0284c7', '#10b981', '#fbbf24'])(t));

    return { errorScale, latencyScale, loadScale };
  }, []);

  const getMetricValueForFinger = (f: FingerStats): { value: number; formatted: string; color: string } => {
    if (metric === 'errorRate') {
      const val = f.errorRate;
      return {
        value: val,
        formatted: `${val}% error`,
        color: colorScales.errorScale(val)
      };
    } else if (metric === 'latency') {
      const val = f.avgLatencyMs;
      return {
        value: val,
        formatted: `${val}ms latency`,
        color: colorScales.latencyScale(val)
      };
    } else {
      const val = f.loadSharePercent;
      return {
        value: val,
        formatted: `${val}% of strokes`,
        color: colorScales.loadScale(val)
      };
    }
  };

  const getMetricValueForKey = (k: KeyStats): { value: number; formatted: string; color: string } => {
    if (metric === 'errorRate') {
      const val = k.errorRate;
      return {
        value: val,
        formatted: `${val}% error`,
        color: colorScales.errorScale(val)
      };
    } else if (metric === 'latency') {
      const val = k.avgLatencyMs;
      return {
        value: val,
        formatted: `${val}ms`,
        color: colorScales.latencyScale(val)
      };
    } else {
      const val = snapshot.totalKeystrokes > 0
        ? +((k.totalHits / snapshot.totalKeystrokes) * 100).toFixed(1)
        : 0;
      return {
        value: val,
        formatted: `${k.totalHits} hits`,
        color: colorScales.loadScale(val * 2)
      };
    }
  };

  // Render D3 Anatomical Hands
  useEffect(() => {
    if (!handsSvgRef.current) return;
    const svg = d3.select(handsSvgRef.current);
    svg.selectAll('*').remove();

    const width = 640;
    const height = 260;

    svg.attr('viewBox', `0 0 ${width} ${height}`)
      .attr('width', '100%')
      .attr('height', height);

    // Definitions for drop shadows and radial glows
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'finger-glow')
      .attr('x', '-30%')
      .attr('y', '-30%')
      .attr('width', '160%')
      .attr('height', '160%');

    filter.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'blur');
    filter.append('feComposite')
      .attr('in', 'SourceGraphic')
      .attr('in2', 'blur')
      .attr('operator', 'over');

    // Left Hand Container (x: 40 to 300) and Right Hand Container (x: 340 to 600)
    const leftGroup = svg.append('g').attr('transform', 'translate(30, 20)');
    const rightGroup = svg.append('g').attr('transform', 'translate(350, 20)');

    // Hand layout specifications [fingerId, x, y, width, height, rx, label, homeKey]
    const leftFingersLayout: Array<{
      id: FingerId;
      x: number;
      y: number;
      w: number;
      h: number;
      tipY: number;
      label: string;
      home: string;
    }> = [
      { id: 'left-pinky', x: 20, y: 70, w: 28, h: 90, tipY: 70, label: 'Pinky', home: 'A' },
      { id: 'left-ring', x: 56, y: 40, w: 30, h: 120, tipY: 40, label: 'Ring', home: 'S' },
      { id: 'left-middle', x: 94, y: 20, w: 32, h: 140, tipY: 20, label: 'Middle', home: 'D' },
      { id: 'left-index', x: 134, y: 35, w: 34, h: 125, tipY: 35, label: 'Index', home: 'F' },
      { id: 'left-thumb', x: 180, y: 110, w: 36, h: 70, tipY: 110, label: 'Thumb', home: 'SPC' }
    ];

    const rightFingersLayout: Array<{
      id: FingerId;
      x: number;
      y: number;
      w: number;
      h: number;
      tipY: number;
      label: string;
      home: string;
    }> = [
      { id: 'right-thumb', x: 44, y: 110, w: 36, h: 70, tipY: 110, label: 'Thumb', home: 'SPC' },
      { id: 'right-index', x: 92, y: 35, w: 34, h: 125, tipY: 35, label: 'Index', home: 'J' },
      { id: 'right-middle', x: 134, y: 20, w: 32, h: 140, tipY: 20, label: 'Middle', home: 'K' },
      { id: 'right-ring', x: 174, y: 40, w: 30, h: 120, tipY: 40, label: 'Ring', home: 'L' },
      { id: 'right-pinky', x: 212, y: 70, w: 28, h: 90, tipY: 70, label: 'Pinky', home: ';' }
    ];

    // Palm drawings
    leftGroup.append('path')
      .attr('d', 'M 20 150 C 20 210, 60 230, 140 230 C 190 230, 210 200, 210 160 L 170 150 L 130 150 L 90 150 L 50 150 Z')
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2);

    rightGroup.append('path')
      .attr('d', 'M 50 160 C 50 200, 70 230, 120 230 C 200 230, 240 210, 240 150 L 210 150 L 170 150 L 130 150 L 90 150 Z')
      .attr('fill', '#0f172a')
      .attr('stroke', '#334155')
      .attr('stroke-width', 2);

    // Hand Labels
    leftGroup.append('text')
      .attr('x', 115)
      .attr('y', 200)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(`LEFT HAND (${snapshot.leftHandLoadPercent}%)`);

    rightGroup.append('text')
      .attr('x', 145)
      .attr('y', 200)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('font-weight', 'bold')
      .text(`RIGHT HAND (${snapshot.rightHandLoadPercent}%)`);

    // Helper to render fingers
    const renderHandFingers = (
      group: d3.Selection<SVGGElement, unknown, null, undefined>,
      layout: typeof leftFingersLayout
    ) => {
      layout.forEach(fLayout => {
        const stats = snapshot.fingerStats[fLayout.id] || {
          finger: fLayout.id,
          name: fLayout.label,
          hand: fLayout.id.startsWith('left') ? 'left' : 'right',
          totalHits: 0,
          errorCount: 0,
          errorRate: 0,
          accuracy: 100,
          avgLatencyMs: 150,
          strugglingKeys: [],
          loadSharePercent: 0
        };

        const metricData = getMetricValueForFinger(stats);
        const isSelected = selectedFinger === fLayout.id;
        const isStruggling = stats.errorRate >= 10.0;

        const fingerG = group.append('g')
          .attr('class', 'finger-node cursor-pointer transition-all')
          .on('click', () => {
            setSelectedFinger(prev => (prev === fLayout.id ? null : fLayout.id));
          })
          .on('mouseenter', (event: any) => {
            if (tooltipRef.current && event.currentTarget) {
              const rect = (event.currentTarget as Element).getBoundingClientRect();
              tooltipRef.current.style.opacity = '1';
              tooltipRef.current.style.left = `${rect.left + rect.width / 2}px`;
              tooltipRef.current.style.top = `${rect.top - 12}px`;
              tooltipRef.current.innerHTML = `
                <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
                  <span>${stats.name}</span>
                  <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">Home: ${fLayout.home}</span>
                </div>
                <div class="text-[11px] text-slate-300 mt-1 space-y-0.5 font-mono">
                  <div>Accuracy: <strong class="${stats.accuracy >= 95 ? 'text-emerald-400' : 'text-amber-400'}">${stats.accuracy}%</strong></div>
                  <div>Error Rate: <strong class="${stats.errorRate > 8 ? 'text-rose-400' : 'text-slate-300'}">${stats.errorRate}%</strong> (${stats.errorCount} misses)</div>
                  <div>Hesitation: <strong>${stats.avgLatencyMs}ms</strong></div>
                  <div>Workload Share: <strong>${stats.loadSharePercent}%</strong> (${stats.totalHits} strokes)</div>
                  ${stats.strugglingKeys.length > 0 ? `<div class="text-rose-300 pt-1 border-t border-slate-800">Weak Keys: <strong class="text-rose-400">${stats.strugglingKeys.join(', ')}</strong></div>` : ''}
                </div>
              `;
            }
          })
          .on('mouseleave', () => {
            if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
          });

        // Finger body rectangle with rounded pill cap
        fingerG.append('rect')
          .attr('x', fLayout.x)
          .attr('y', fLayout.y)
          .attr('width', fLayout.w)
          .attr('height', fLayout.h)
          .attr('rx', fLayout.w / 2)
          .attr('fill', '#1e293b')
          .attr('stroke', isSelected ? '#38bdf8' : isStruggling ? '#f43f5e' : '#334155')
          .attr('stroke-width', isSelected ? 3 : isStruggling ? 2 : 1.5);

        // Finger Pad Heatmap circle
        fingerG.append('circle')
          .attr('cx', fLayout.x + fLayout.w / 2)
          .attr('cy', fLayout.y + fLayout.w / 2)
          .attr('r', (fLayout.w / 2) - 3)
          .attr('fill', metricData.color)
          .attr('filter', isStruggling || isSelected ? 'url(#finger-glow)' : null)
          .attr('opacity', 0.9);

        // Home key text on the fingertip
        fingerG.append('text')
          .attr('x', fLayout.x + fLayout.w / 2)
          .attr('y', fLayout.y + fLayout.w / 2 + 4)
          .attr('text-anchor', 'middle')
          .attr('fill', '#020617')
          .attr('font-size', '11px')
          .attr('font-family', 'monospace')
          .attr('font-weight', '900')
          .text(fLayout.home);

        // Metric badge value inside the finger shaft
        fingerG.append('text')
          .attr('x', fLayout.x + fLayout.w / 2)
          .attr('y', fLayout.y + fLayout.h - 15)
          .attr('text-anchor', 'middle')
          .attr('fill', '#cbd5e1')
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text(metric === 'errorRate' ? `${stats.errorRate}%` : metric === 'latency' ? `${stats.avgLatencyMs}m` : `${stats.loadSharePercent}%`);

        // Struggling indicator dot
        if (isStruggling) {
          fingerG.append('circle')
            .attr('cx', fLayout.x + fLayout.w / 2)
            .attr('cy', fLayout.y - 6)
            .attr('r', 3.5)
            .attr('fill', '#ef4444')
            .attr('stroke', '#020617')
            .attr('stroke-width', 1);
        }
      });
    };

    renderHandFingers(leftGroup, leftFingersLayout);
    renderHandFingers(rightGroup, rightFingersLayout);
  }, [snapshot, metric, selectedFinger, colorScales]);

  // Render D3 Full Interactive Keyboard Heatmap
  useEffect(() => {
    if (!keyboardSvgRef.current) return;
    const svg = d3.select(keyboardSvgRef.current);
    svg.selectAll('*').remove();

    const kbRows = [
      [
        { code: '`', label: '`', finger: 'left-pinky', w: 32 },
        { code: '1', label: '1', finger: 'left-pinky', w: 32 },
        { code: '2', label: '2', finger: 'left-ring', w: 32 },
        { code: '3', label: '3', finger: 'left-middle', w: 32 },
        { code: '4', label: '4', finger: 'left-index', w: 32 },
        { code: '5', label: '5', finger: 'left-index', w: 32 },
        { code: '6', label: '6', finger: 'right-index', w: 32 },
        { code: '7', label: '7', finger: 'right-index', w: 32 },
        { code: '8', label: '8', finger: 'right-middle', w: 32 },
        { code: '9', label: '9', finger: 'right-ring', w: 32 },
        { code: '0', label: '0', finger: 'right-pinky', w: 32 },
        { code: '-', label: '-', finger: 'right-pinky', w: 32 },
        { code: '=', label: '=', finger: 'right-pinky', w: 32 },
        { code: 'BACKSPACE', label: '⌫', finger: 'right-pinky', w: 56 }
      ],
      [
        { code: 'TAB', label: 'Tab', finger: 'left-pinky', w: 46 },
        { code: 'Q', label: 'Q', finger: 'left-pinky', w: 32 },
        { code: 'W', label: 'W', finger: 'left-ring', w: 32 },
        { code: 'E', label: 'E', finger: 'left-middle', w: 32 },
        { code: 'R', label: 'R', finger: 'left-index', w: 32 },
        { code: 'T', label: 'T', finger: 'left-index', w: 32 },
        { code: 'Y', label: 'Y', finger: 'right-index', w: 32 },
        { code: 'U', label: 'U', finger: 'right-index', w: 32 },
        { code: 'I', label: 'I', finger: 'right-middle', w: 32 },
        { code: 'O', label: 'O', finger: 'right-ring', w: 32 },
        { code: 'P', label: 'P', finger: 'right-pinky', w: 32 },
        { code: '[', label: '[', finger: 'right-pinky', w: 32 },
        { code: ']', label: ']', finger: 'right-pinky', w: 32 },
        { code: '\\', label: '\\', finger: 'right-pinky', w: 42 }
      ],
      [
        { code: 'CAPS', label: 'Caps', finger: 'left-pinky', w: 54 },
        { code: 'A', label: 'A', finger: 'left-pinky', w: 32 },
        { code: 'S', label: 'S', finger: 'left-ring', w: 32 },
        { code: 'D', label: 'D', finger: 'left-middle', w: 32 },
        { code: 'F', label: 'F', finger: 'left-index', w: 32 },
        { code: 'G', label: 'G', finger: 'left-index', w: 32 },
        { code: 'H', label: 'H', finger: 'right-index', w: 32 },
        { code: 'J', label: 'J', finger: 'right-index', w: 32 },
        { code: 'K', label: 'K', finger: 'right-middle', w: 32 },
        { code: 'L', label: 'L', finger: 'right-ring', w: 32 },
        { code: ';', label: ';', finger: 'right-pinky', w: 32 },
        { code: "'", label: "'", finger: 'right-pinky', w: 32 },
        { code: 'ENTER', label: 'Enter', finger: 'right-pinky', w: 66 }
      ],
      [
        { code: 'SHIFT_L', label: 'Shift', finger: 'left-pinky', w: 68 },
        { code: 'Z', label: 'Z', finger: 'left-pinky', w: 32 },
        { code: 'X', label: 'X', finger: 'left-ring', w: 32 },
        { code: 'C', label: 'C', finger: 'left-middle', w: 32 },
        { code: 'V', label: 'V', finger: 'left-index', w: 32 },
        { code: 'B', label: 'B', finger: 'left-index', w: 32 },
        { code: 'N', label: 'N', finger: 'right-index', w: 32 },
        { code: 'M', label: 'M', finger: 'right-index', w: 32 },
        { code: ',', label: ',', finger: 'right-middle', w: 32 },
        { code: '.', label: '.', finger: 'right-ring', w: 32 },
        { code: '/', label: '/', finger: 'right-pinky', w: 32 },
        { code: 'SHIFT_R', label: 'Shift', finger: 'right-pinky', w: 84 }
      ],
      [
        { code: 'CTRL_L', label: 'Ctrl', finger: 'left-pinky', w: 45 },
        { code: 'ALT_L', label: 'Alt', finger: 'left-thumb', w: 40 },
        { code: 'SPACE', label: 'SPACEBAR', finger: 'right-thumb', w: 230 },
        { code: 'ALT_R', label: 'Alt', finger: 'right-thumb', w: 40 },
        { code: 'CTRL_R', label: 'Ctrl', finger: 'right-pinky', w: 45 }
      ]
    ];

    const svgWidth = 590;
    const svgHeight = 200;
    const keyH = 32;
    const gap = 4;
    const startY = 10;
    const startX = 10;

    svg.attr('viewBox', `0 0 ${svgWidth} ${svgHeight}`)
      .attr('width', '100%')
      .attr('height', svgHeight);

    let currentY = startY;

    kbRows.forEach((row) => {
      let currentX = startX;

      row.forEach((keyDef) => {
        const keyStats = snapshot.keyStats[keyDef.code] || snapshot.keyStats[keyDef.code.toUpperCase()] || {
          key: keyDef.code,
          char: keyDef.label,
          finger: keyDef.finger as FingerId,
          hand: keyDef.finger.startsWith('left') ? 'left' : 'right',
          totalHits: 0,
          correctHits: 0,
          errorCount: 0,
          accuracy: 100,
          errorRate: 0,
          avgLatencyMs: 140,
          substitutions: {},
          struggleScore: 0
        };

        const metricData = getMetricValueForKey(keyStats);
        const isFingerSelected = selectedFinger === keyDef.finger;
        const isKeySelected = selectedKey === keyDef.code;
        const isStruggling = keyStats.errorRate >= 10.0;

        const keyG = svg.append('g')
          .attr('class', 'keycap-node cursor-pointer')
          .on('click', () => {
            setSelectedKey(prev => (prev === keyDef.code ? null : keyDef.code));
            setSelectedFinger(keyDef.finger as FingerId);
          })
          .on('mouseenter', (event: any) => {
            if (tooltipRef.current && event.currentTarget) {
              const rect = (event.currentTarget as Element).getBoundingClientRect();
              tooltipRef.current.style.opacity = '1';
              tooltipRef.current.style.left = `${rect.left + rect.width / 2}px`;
              tooltipRef.current.style.top = `${rect.top - 12}px`;

              const topSub = Object.entries(keyStats.substitutions).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

              tooltipRef.current.innerHTML = `
                <div class="font-bold text-slate-100 flex items-center justify-between gap-3">
                  <span>Key: <strong>[ ${keyDef.label} ]</strong></span>
                  <span class="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">${FINGER_DEFINITIONS[keyDef.finger as FingerId]?.name || keyDef.finger}</span>
                </div>
                <div class="text-[11px] text-slate-300 mt-1 space-y-0.5 font-mono">
                  <div>Accuracy: <strong class="${keyStats.accuracy >= 95 ? 'text-emerald-400' : 'text-amber-400'}">${keyStats.accuracy}%</strong></div>
                  <div>Error Rate: <strong class="${keyStats.errorRate >= 10 ? 'text-rose-400' : 'text-slate-300'}">${keyStats.errorRate}%</strong> (${keyStats.errorCount} misses)</div>
                  <div>Hesitation: <strong>${keyStats.avgLatencyMs}ms</strong></div>
                  <div>Total Keystrokes: <strong>${keyStats.totalHits}</strong></div>
                  ${topSub ? `<div class="text-amber-300 pt-1 border-t border-slate-800">Most frequent typo: Typed '<strong>${topSub[0]}</strong>' (${topSub[1]}x)</div>` : ''}
                </div>
              `;
            }
          })
          .on('mouseleave', () => {
            if (tooltipRef.current) tooltipRef.current.style.opacity = '0';
          });

        // Keycap Base
        keyG.append('rect')
          .attr('x', currentX)
          .attr('y', currentY)
          .attr('width', keyDef.w)
          .attr('height', keyH)
          .attr('rx', 6)
          .attr('fill', isKeySelected ? '#0284c7' : isFingerSelected ? '#1e293b' : '#0f172a')
          .attr('stroke', isKeySelected ? '#38bdf8' : isFingerSelected ? '#0284c7' : isStruggling ? '#ef4444' : '#334155')
          .attr('stroke-width', isKeySelected || isFingerSelected ? 2 : 1);

        // Heatmap color indicator bar inside keycap
        keyG.append('rect')
          .attr('x', currentX + 3)
          .attr('y', currentY + keyH - 6)
          .attr('width', keyDef.w - 6)
          .attr('height', 3)
          .attr('rx', 1.5)
          .attr('fill', metricData.color);

        // Key Label
        keyG.append('text')
          .attr('x', currentX + keyDef.w / 2)
          .attr('y', currentY + keyH / 2 + (keyDef.label.length > 2 ? 3 : 2))
          .attr('text-anchor', 'middle')
          .attr('fill', isKeySelected ? '#ffffff' : isFingerSelected ? '#38bdf8' : '#e2e8f0')
          .attr('font-size', keyDef.label.length > 3 ? '9px' : '11px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .text(keyDef.label);

        currentX += keyDef.w + gap;
      });

      currentY += keyH + gap;
    });
  }, [snapshot, metric, selectedFinger, selectedKey, colorScales]);

  // Handle Targeted Drill Trigger
  const handleTriggerDrill = () => {
    const drill = generateTargetedDrillForWeakKeys(studentId);
    if (onStartTargetedDrill) {
      onStartTargetedDrill(drill.passage, drill.title);
    }
  };

  const currentWeakDrill = useMemo(() => {
    return generateTargetedDrillForWeakKeys(studentId);
  }, [studentId, snapshot]);

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 ${className}`}>
      {/* Dynamic Floating Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed z-50 pointer-events-none px-3.5 py-2.5 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl backdrop-blur-md text-xs -translate-x-1/2 -translate-y-full transition-opacity duration-150 opacity-0 min-w-[210px]"
      />

      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              D3.js Anatomical Biometrics
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
              {snapshot.totalKeystrokes.toLocaleString()} Keystrokes Analyzed
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-1">
            <Hand className="w-6 h-6 text-emerald-400" />
            Finger-Position & Keyboard Struggle Heatmap
          </h2>
          <p className="text-xs text-slate-400">
            Real-time biometric analytics identifying finger fatigue, high error-rate anchor keys, and bilateral hand balance.
          </p>
        </div>

        {/* Metric Selector Buttons */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setMetric('errorRate')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metric === 'errorRate'
                ? 'bg-rose-500 text-slate-950 font-black shadow-lg shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Error Hotspots</span>
          </button>

          <button
            onClick={() => setMetric('latency')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metric === 'latency'
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Hesitation (ms)</span>
          </button>

          <button
            onClick={() => setMetric('load')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              metric === 'load'
                ? 'bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Finger Workload</span>
          </button>
        </div>
      </div>

      {/* Top Section: Anatomical Hands Model */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive D3 Hands */}
        <div className="lg:col-span-8 bg-slate-950/80 border border-slate-800 rounded-3xl p-4 flex flex-col items-center shadow-inner relative">
          <div className="w-full flex justify-between items-center px-3 mb-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
              <Hand className="w-3.5 h-3.5 text-emerald-400" />
              10-Finger Tactile Placement Model
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
              <span>Optimal</span>
              <div className="w-16 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-500" />
              <span>Struggle</span>
            </div>
          </div>

          <svg ref={handsSvgRef} className="w-full max-w-[620px]" />

          {selectedFinger && (
            <div className="mt-2 text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/60 px-3 py-1 rounded-xl flex items-center gap-2">
              <span>Selected: <strong>{FINGER_DEFINITIONS[selectedFinger]?.name}</strong></span>
              <button
                onClick={() => setSelectedFinger(null)}
                className="text-slate-400 hover:text-slate-200 text-[10px] underline ml-2"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>

        {/* Right: Workload & Hand Balance Biometrics Card */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
              Bilateral Hand Load Balance
            </span>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300 font-bold">Left Hand: {snapshot.leftHandLoadPercent}%</span>
                <span className="text-slate-300 font-bold">Right Hand: {snapshot.rightHandLoadPercent}%</span>
              </div>
              <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                <div
                  className="bg-cyan-500 h-full transition-all duration-500"
                  style={{ width: `${snapshot.leftHandLoadPercent}%` }}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-500"
                  style={{ width: `${snapshot.rightHandLoadPercent}%` }}
                />
              </div>
              <div className="text-[10px] text-slate-500 font-mono text-center">
                Target equilibrium: 48% - 52% (Current balance: {Math.abs(snapshot.leftHandLoadPercent - 50) <= 5 ? 'Optimal ✅' : 'Asymmetric ⚠️'})
              </div>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Overall Accuracy</span>
              <span className="text-xl font-black font-mono text-emerald-400">{snapshot.overallAccuracy}%</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">Identified Flaws</span>
              <span className="text-xl font-black font-mono text-rose-400">{snapshot.totalErrors} Typos</span>
            </div>
          </div>

          {/* Top Weakest Finger Alert */}
          {snapshot.topStrugglingFingers[0] && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-xs space-y-1">
              <div className="font-bold text-rose-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Primary Bottleneck: {snapshot.topStrugglingFingers[0].name}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Error rate of <strong className="text-rose-400 font-mono">{snapshot.topStrugglingFingers[0].errorRate}%</strong> on keys:{' '}
                <span className="font-mono font-bold text-slate-200">{snapshot.topStrugglingFingers[0].strugglingKeys.slice(0, 4).join(', ') || 'N/A'}</span>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Middle Section: D3 Full Keyboard Heatmap */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono uppercase text-slate-400 font-bold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            60% Keyboard Keycap Precision Grid
          </span>
          <span className="text-[10px] font-mono text-slate-500">
            Hover any key for error rate, substitutions, & hesitation
          </span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-4 overflow-x-auto shadow-inner flex justify-center">
          <svg ref={keyboardSvgRef} className="w-full max-w-[620px]" />
        </div>
      </div>

      {/* Bottom Section: Top 5 Struggling Keys & 1-Click Targeted Practice Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Struggling Keys Leaderboard */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-mono uppercase text-slate-300 font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-400" />
              Highest Error Rate Key Rankings
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Ranked by Mis-hits</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {snapshot.topStrugglingKeys.slice(0, 8).map((ks, idx) => (
              <div
                key={ks.key}
                onClick={() => {
                  setSelectedKey(ks.key);
                  setSelectedFinger(ks.finger);
                }}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                  selectedKey === ks.key
                    ? 'bg-rose-500/20 border-rose-500/60 shadow-lg shadow-rose-500/20'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 border border-slate-700 font-mono font-black text-xs text-slate-100 flex items-center justify-center">
                    {ks.key}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-rose-400">
                    {ks.errorRate}%
                  </span>
                </div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  {FINGER_DEFINITIONS[ks.finger]?.name || ks.finger}
                </div>
                <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                  {ks.errorCount} misses / {ks.totalHits} hits
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 1-Click Targeted Practice Generator */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-950/40 via-slate-950 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Targeted Weak-Key Remediation Drill</span>
            </div>
            <h4 className="text-sm font-black text-slate-100 mt-1">
              {currentWeakDrill.title}
            </h4>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-slate-900/90 p-3 rounded-xl border border-slate-800/80 font-mono text-[11px] line-clamp-3">
              "{currentWeakDrill.passage}"
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span>Focus Keys: <strong className="text-emerald-400">{currentWeakDrill.focusKeys.join(', ')}</strong></span>
              <span>Duration: <strong>60s</strong></span>
            </div>

            <button
              onClick={handleTriggerDrill}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <PlaySquare className="w-4 h-4" />
              <span>Start Weak-Key Recovery Drill</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
