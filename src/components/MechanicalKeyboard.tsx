import React, { useState, useEffect } from 'react';
import { soundController, SWITCH_PROFILES, MechanicalSwitchType } from '../utils/audio';
import { Volume2, VolumeX, Sparkles, ChevronDown, ChevronUp, Sliders } from 'lucide-react';

export type KeyboardTheme = 'cyberpunk' | 'retro84' | 'stealth' | 'chalk';

interface KeyConfig {
  code: string;
  label: string;
  width?: string;
  sub?: string;
}

const KEYBOARD_ROWS: KeyConfig[][] = [
  [
    { code: 'Escape', label: 'ESC', width: 'w-10' },
    { code: 'Digit1', label: '1', sub: '!' },
    { code: 'Digit2', label: '2', sub: '@' },
    { code: 'Digit3', label: '3', sub: '#' },
    { code: 'Digit4', label: '4', sub: '$' },
    { code: 'Digit5', label: '5', sub: '%' },
    { code: 'Digit6', label: '6', sub: '^' },
    { code: 'Digit7', label: '7', sub: '&' },
    { code: 'Digit8', label: '8', sub: '*' },
    { code: 'Digit9', label: '9', sub: '(' },
    { code: 'Digit0', label: '0', sub: ')' },
    { code: 'Minus', label: '-', sub: '_' },
    { code: 'Equal', label: '=', sub: '+' },
    { code: 'Backspace', label: 'BACK', width: 'w-16' },
  ],
  [
    { code: 'Tab', label: 'TAB', width: 'w-14' },
    { code: 'KeyQ', label: 'Q' },
    { code: 'KeyW', label: 'W' },
    { code: 'KeyE', label: 'E' },
    { code: 'KeyR', label: 'R' },
    { code: 'KeyT', label: 'T' },
    { code: 'KeyY', label: 'Y' },
    { code: 'KeyU', label: 'U' },
    { code: 'KeyI', label: 'I' },
    { code: 'KeyO', label: 'O' },
    { code: 'KeyP', label: 'P' },
    { code: 'BracketLeft', label: '[', sub: '{' },
    { code: 'BracketRight', label: ']', sub: '}' },
    { code: 'Backslash', label: '\\', sub: '|', width: 'w-12' },
  ],
  [
    { code: 'CapsLock', label: 'CAPS', width: 'w-16' },
    { code: 'KeyA', label: 'A' },
    { code: 'KeyS', label: 'S' },
    { code: 'KeyD', label: 'D' },
    { code: 'KeyF', label: 'F' },
    { code: 'KeyG', label: 'G' },
    { code: 'KeyH', label: 'H' },
    { code: 'KeyJ', label: 'J' },
    { code: 'KeyK', label: 'K' },
    { code: 'KeyL', label: 'L' },
    { code: 'Semicolon', label: ';', sub: ':' },
    { code: 'Quote', label: "'", sub: '"' },
    { code: 'Enter', label: 'ENTER', width: 'w-20' },
  ],
  [
    { code: 'ShiftLeft', label: 'SHIFT', width: 'w-20' },
    { code: 'KeyZ', label: 'Z' },
    { code: 'KeyX', label: 'X' },
    { code: 'KeyC', label: 'C' },
    { code: 'KeyV', label: 'V' },
    { code: 'KeyB', label: 'B' },
    { code: 'KeyN', label: 'N' },
    { code: 'KeyM', label: 'M' },
    { code: 'Comma', label: ',', sub: '<' },
    { code: 'Period', label: '.', sub: '>' },
    { code: 'Slash', label: '/', sub: '?' },
    { code: 'ShiftRight', label: 'SHIFT', width: 'w-24' },
  ],
  [
    { code: 'ControlLeft', label: 'CTRL', width: 'w-14' },
    { code: 'AltLeft', label: 'ALT', width: 'w-12' },
    { code: 'Space', label: 'SPACE', width: 'flex-1 min-w-[180px]' },
    { code: 'AltRight', label: 'ALT', width: 'w-12' },
    { code: 'ControlRight', label: 'CTRL', width: 'w-14' },
  ]
];

interface MechanicalKeyboardProps {
  interactive?: boolean;
  compact?: boolean;
  className?: string;
  onKeyAction?: (key: string) => void;
}

export const MechanicalKeyboard: React.FC<MechanicalKeyboardProps> = ({
  interactive = true,
  compact = false,
  className = '',
  onKeyAction
}) => {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<KeyboardTheme>('cyberpunk');
  const [switchType, setSwitchType] = useState<MechanicalSwitchType>('panda');
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [soundOn, setSoundOn] = useState(soundController.enabled);

  useEffect(() => {
    soundController.setSwitch(switchType);
  }, [switchType]);

  useEffect(() => {
    if (!interactive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.add(e.code);
        return next;
      });
      soundController.playKeyClick();
      if (onKeyAction) onKeyAction(e.key);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [interactive, onKeyAction]);

  const handleManualKeyClick = (code: string, label: string) => {
    soundController.playKeyClick();
    setPressedKeys(prev => new Set(prev).add(code));
    setTimeout(() => {
      setPressedKeys(prev => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    }, 120);
    if (onKeyAction) onKeyAction(label);
  };

  const currentSwitchInfo = SWITCH_PROFILES.find(s => s.id === switchType) || SWITCH_PROFILES[3];

  // Theme styling configurations
  const themeStyles = {
    cyberpunk: {
      chassis: 'bg-slate-950 border-cyan-500/30 shadow-2xl shadow-cyan-950/40',
      keyBase: 'bg-slate-900 border-slate-700/80 text-slate-200 hover:border-cyan-400/60 shadow-sm shadow-slate-950',
      keyPressed: 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-lg shadow-cyan-400/50 translate-y-1',
      accentKey: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300',
      escKey: 'bg-rose-950/80 border-rose-500/50 text-rose-300',
      spaceKey: 'border-slate-700/80',
    },
    retro84: {
      chassis: 'bg-[#1e1e1e] border-[#38332a] shadow-2xl',
      keyBase: 'bg-[#d8d3c5] border-[#b0a996] text-[#2c2824] hover:bg-[#eae5d8] shadow-sm',
      keyPressed: 'bg-[#c57d3c] text-white border-[#8c5321] translate-y-1 shadow-inner',
      accentKey: 'bg-[#9f9a8d] border-[#7d786d] text-slate-900 font-bold',
      escKey: 'bg-[#c94a29] border-[#912d14] text-white font-bold',
      spaceKey: 'bg-[#d8d3c5] border-[#b0a996]',
    },
    stealth: {
      chassis: 'bg-black border-slate-800 shadow-2xl',
      keyBase: 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-600',
      keyPressed: 'bg-emerald-500 text-neutral-950 border-emerald-400 shadow-lg shadow-emerald-500/30 translate-y-1',
      accentKey: 'bg-neutral-800 border-neutral-700 text-neutral-400',
      escKey: 'bg-neutral-800 border-neutral-700 text-emerald-400',
      spaceKey: 'border-neutral-800',
    },
    chalk: {
      chassis: 'bg-slate-900 border-slate-800 shadow-2xl',
      keyBase: 'bg-slate-800 border-slate-700 text-slate-100 hover:border-amber-400/50',
      keyPressed: 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/40 translate-y-1',
      accentKey: 'bg-teal-900/60 border-teal-500/50 text-teal-300',
      escKey: 'bg-rose-900/60 border-rose-500/50 text-rose-300',
      spaceKey: 'border-slate-700',
    }
  };

  const st = themeStyles[theme];

  return (
    <div className={`w-full rounded-2xl border transition-all ${st.chassis} ${className}`}>
      {/* Mechanical Keyboard Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-slate-800/80 bg-slate-900/50 rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: currentSwitchInfo.color }}
            />
            <span className="font-mono text-xs font-bold text-slate-200">
              {currentSwitchInfo.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-slate-800 text-slate-400 border border-slate-700">
              {currentSwitchInfo.category}
            </span>
          </div>
        </div>

        {/* Controls: Switch Selector, Theme, Sound, Collapse */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Switch Picker */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {SWITCH_PROFILES.map(sw => (
              <button
                key={sw.id}
                onClick={() => {
                  setSwitchType(sw.id);
                  soundController.setSwitch(sw.id);
                  soundController.playKeyClick(sw.id);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
                  switchType === sw.id
                    ? 'bg-slate-800 text-white font-bold border border-slate-600 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`${sw.name}: ${sw.description}`}
              >
                {sw.category}
              </button>
            ))}
          </div>

          {/* Theme Picker */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['cyberpunk', 'retro84', 'stealth', 'chalk'] as KeyboardTheme[]).map(th => (
              <button
                key={th}
                onClick={() => setTheme(th)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono capitalize transition-all ${
                  theme === th
                    ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-600'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {th === 'retro84' ? 'Retro 84' : th}
              </button>
            ))}
          </div>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !soundOn;
              setSoundOn(next);
              soundController.enabled = next;
            }}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              soundOn
                ? 'bg-slate-800 text-cyan-400 border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-800'
            }`}
            title={soundOn ? 'Switch sound enabled' : 'Muted'}
          >
            {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Toggle Expand/Collapse */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs"
            title={isExpanded ? 'Hide Keyboard View' : 'Show Keyboard View'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Interactive 60% Layout Keyboard Surface */}
      {isExpanded && (
        <div className="p-4 sm:p-5 overflow-x-auto select-none">
          <div className="min-w-[620px] max-w-4xl mx-auto flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/70 shadow-inner">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex gap-1.5 justify-center">
                {row.map(k => {
                  const isPressed = pressedKeys.has(k.code);
                  let keySpecificStyle = st.keyBase;
                  if (k.code === 'Escape') keySpecificStyle = st.escKey;
                  else if (['Backspace', 'Tab', 'Enter', 'ShiftLeft', 'ShiftRight', 'CapsLock', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'].includes(k.code)) {
                    keySpecificStyle = st.accentKey;
                  }

                  const activeStyle = isPressed ? st.keyPressed : keySpecificStyle;

                  return (
                    <button
                      key={k.code}
                      onClick={() => handleManualKeyClick(k.code, k.label)}
                      className={`
                        ${k.width || 'w-10 sm:w-11'} h-10 sm:h-11 rounded-lg border flex flex-col items-center justify-center
                        font-mono text-xs font-bold transition-all duration-75 relative
                        ${activeStyle}
                      `}
                    >
                      {k.sub && (
                        <span className="text-[9px] opacity-60 leading-none">{k.sub}</span>
                      )}
                      <span className="leading-tight">{k.label}</span>

                      {/* Under-key switch stem glow when pressed */}
                      {isPressed && (
                        <span
                          className="absolute inset-0 rounded-lg blur-[2px] opacity-40 pointer-events-none"
                          style={{ backgroundColor: currentSwitchInfo.color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-3 text-center text-[11px] font-mono text-slate-500">
            <span>Actuation Feedback: Type on your physical keyboard to see mechanical switch actuation and hear real-time acoustic profiles</span>
          </div>
        </div>
      )}
    </div>
  );
};
