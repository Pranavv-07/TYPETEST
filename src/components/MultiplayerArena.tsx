import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  Swords,
  Zap,
  Users,
  Loader2,
  ArrowLeft,
  Flag,
  Crown,
  CheckCircle2,
  XCircle,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Gauge,
  Target,
  Clock,
  Car,
  Rocket,
  Bot
} from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import { soundController } from '../utils/audio';
import { MechanicalKeyboard } from './MechanicalKeyboard';

const PASSAGES = [
  "The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging errant code. Multiplayer typing races are fun and engaging for everyone involved.",
  "In the world of software engineering, clean code is a sign of a true professional. Always remember to comment your complex logic and write comprehensive unit tests to ensure long-term maintainability.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. Success is a journey, not a destination. Keep typing fast and accurately to improve your skills daily.",
  "Computer science is no more about computers than astronomy is about telescopes. Writing clear, elegant algorithms transforms abstract logic into responsive, interactive human experiences.",
  "Typing speed is a superpower for modern creators. As your fingers glide effortlessly across mechanical keys, thoughts materialize directly onto the digital canvas with lightning velocity."
];

const RACER_ICONS = ['🏎️', '🚀', '⚡', '🐆', '🏍️', '🛸', '🏎️'];

interface PlayerState {
  id: string;
  name: string;
  wpm: number;
  accuracy: number;
  progress: number;
  correctChars: number;
  incorrectChars: number;
  status: 'waiting' | 'racing' | 'finished';
  finishTime?: number;
  finishRank?: number;
  avatarIcon?: string;
  isBot?: boolean;
  targetWpm?: number;
}

const MultiplayerWordRenderer: React.FC<{
  rawWord: string;
  wIdx: number;
  isActive: boolean;
  currentInput: string;
  typedWord?: string;
  activeWordRef?: React.RefObject<HTMLSpanElement | null> | null;
}> = React.memo(({ rawWord, wIdx, isActive, currentInput, typedWord, activeWordRef }) => {
  const word = rawWord.trim();

  return (
    <span
      ref={isActive ? (activeWordRef as any) : null}
      className={`inline-block py-1 rounded transition-colors mr-2.5 ${
        isActive ? 'bg-slate-800/80 px-1.5 ring-1 ring-emerald-400/40' : ''
      }`}
    >
      {word.split('').map((char, cIdx) => {
        let charColor = 'text-slate-500';
        let bg = '';

        if (isActive) {
          if (cIdx < currentInput.length) {
            if (currentInput[cIdx] === char) {
              charColor = 'text-emerald-400 font-semibold';
            } else {
              charColor = 'text-rose-400 font-semibold';
              bg = 'bg-rose-500/25';
            }
          }
        } else if (typedWord !== undefined) {
          if (cIdx < typedWord.length) {
            charColor = typedWord[cIdx] === char ? 'text-emerald-400' : 'text-rose-400';
          } else {
            charColor = typedWord === word ? 'text-emerald-400' : 'text-rose-400/60';
          }
        }

        const isCaretHere = isActive && cIdx === currentInput.length;

        return (
          <span key={cIdx} className="relative inline-block">
            {isCaretHere && (
              <span className="absolute -left-[1px] top-1 bottom-1 w-[2.5px] bg-emerald-400 animate-pulse rounded-full shadow-[0_0_8px_#10b981]" />
            )}
            <span className={`${charColor} ${bg} rounded-sm px-[0.5px]`}>{char}</span>
          </span>
        );
      })}

      {isActive &&
        currentInput.length > word.length &&
        currentInput.substring(word.length).split('').map((char, idx) => (
          <span key={`extra-${idx}`} className="relative inline-block">
            <span className="text-rose-400 bg-rose-500/30 rounded-sm px-[0.5px] line-through">
              {char}
            </span>
          </span>
        ))}
    </span>
  );
});

export const MultiplayerArena: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { currentUser, soundEnabled } = useApp();

  const fallbackGuest = useMemo(
    () => ({
      id: `guest-${Math.random().toString(36).substring(2, 8)}`,
      name: `Racer-${Math.floor(100 + Math.random() * 900)}`,
      role: 'student' as const,
      email: 'guest@testtype.local'
    }),
    []
  );
  const activeUser = currentUser || fallbackGuest;

  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [roomState, setRoomState] = useState<'joining' | 'waiting' | 'countdown' | 'racing' | 'finished'>('joining');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [countdown, setCountdown] = useState(3);

  const [hostId, setHostId] = useState<string>('');
  const [raceText, setRaceText] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);

  // Typing state
  const [inputVal, setInputVal] = useState('');
  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [myWpm, setMyWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myProgress, setMyProgress] = useState(0);
  const [myFinishRank, setMyFinishRank] = useState<number | null>(null);

  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const incorrectKeystrokesRef = useRef(0);
  const hostIdRef = useRef(hostId);
  hostIdRef.current = hostId;
  const raceTextRef = useRef(raceText);
  raceTextRef.current = raceText;
  const roomStateRef = useRef(roomState);
  roomStateRef.current = roomState;
  const wordsRef = useRef(words);
  wordsRef.current = words;

  const channelRef = useRef<RealtimeChannel | null>(null);
  const localBroadcastRef = useRef<BroadcastChannel | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const countdownIntervalRef = useRef<any>(null);

  const myAvatarIcon = useMemo(() => {
    const hash = (activeUser.name || 'player')
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return RACER_ICONS[hash % RACER_ICONS.length];
  }, [activeUser.name]);

  const broadcastEvent = useCallback((event: string, payload: any) => {
    if (channelRef.current) {
      try {
        channelRef.current.send({
          type: 'broadcast',
          event,
          payload
        });
      } catch (e) {
        console.error('Supabase broadcast failed', e);
      }
    }
    if (localBroadcastRef.current) {
      try {
        localBroadcastRef.current.postMessage({ event, payload });
      } catch (e) {
        console.error('Local BroadcastChannel failed', e);
      }
    }
  }, []);

  const handleStartCountdownAt = useCallback((targetStartAt: number) => {
    setRoomState('countdown');
    clearInterval(countdownIntervalRef.current);

    const updateCountdown = () => {
      const now = Date.now();
      const remainingSec = Math.max(0, Math.ceil((targetStartAt - now) / 1000));
      setCountdown(remainingSec);

      if (now >= targetStartAt) {
        clearInterval(countdownIntervalRef.current);
        setRoomState('racing');
        setStartTime(targetStartAt);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };

    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 50);
  }, []);

  const handleIncomingMessage = useCallback(
    (event: string, payload: any) => {
      if (event === 'request_room_info') {
        const myId = activeUser.id;
        if (hostIdRef.current === myId) {
          broadcastEvent('room_info', {
            hostId: hostIdRef.current,
            raceText: raceTextRef.current
          });
        }
      } else if (event === 'room_info') {
        if (payload.hostId) setHostId(payload.hostId);
        if (payload.raceText) {
          setRaceText(payload.raceText);
          setWords(payload.raceText.split(' '));
        }
      } else if (event === 'start_countdown') {
        if (payload.targetStartAt) {
          handleStartCountdownAt(payload.targetStartAt);
        }
      } else if (event === 'player_progress') {
        if (payload.player && payload.player.id) {
          setPlayers(prev => ({
            ...prev,
            [payload.player.id]: payload.player
          }));
        }
      } else if (event === 'reset_race') {
        clearInterval(countdownIntervalRef.current);
        setTypedWords(['']);
        setCurrentWordIndex(0);
        setInputVal('');
        setMyWpm(0);
        setMyAccuracy(100);
        setMyProgress(0);
        setStartTime(null);
        setEndTime(null);
        setElapsedTime(0);
        setMyFinishRank(null);
        totalKeystrokesRef.current = 0;
        correctKeystrokesRef.current = 0;
        incorrectKeystrokesRef.current = 0;

        if (payload.raceText) {
          setRaceText(payload.raceText);
          setWords(payload.raceText.split(' '));
        }

        setRoomState('waiting');
      }
    },
    [activeUser.id, broadcastEvent, handleStartCountdownAt]
  );

  useEffect(() => {
    if (!roomCode) return;

    const myId = activeUser.id;
    const initialPlayerState: PlayerState = {
      id: myId,
      name: activeUser.name,
      wpm: 0,
      accuracy: 100,
      progress: 0,
      correctChars: 0,
      incorrectChars: 0,
      status: 'waiting',
      avatarIcon: myAvatarIcon
    };

    let localBc: BroadcastChannel | null = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      localBc = new BroadcastChannel(`testtype-room-${roomCode}`);
      localBc.onmessage = (e) => {
        if (e.data && e.data.event) {
          handleIncomingMessage(e.data.event, e.data.payload);
        }
      };
      localBroadcastRef.current = localBc;
    }

    const channel = supabase.channel(`multiplayer-lobby-${roomCode}`, {
      config: {
        presence: { key: myId },
      },
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const newPlayers: Record<string, PlayerState> = {};
        Object.values(state).forEach((presences: any) => {
          if (presences.length > 0) {
            const p = presences[0] as PlayerState;
            newPlayers[p.id] = p;
          }
        });
        setPlayers(prev => ({ ...prev, ...newPlayers }));
      })
      .on('broadcast', { event: 'request_room_info' }, (e) => handleIncomingMessage('request_room_info', e.payload))
      .on('broadcast', { event: 'room_info' }, (e) => handleIncomingMessage('room_info', e.payload))
      .on('broadcast', { event: 'start_countdown' }, (e) => handleIncomingMessage('start_countdown', e.payload))
      .on('broadcast', { event: 'player_progress' }, (e) => handleIncomingMessage('player_progress', e.payload))
      .on('broadcast', { event: 'reset_race' }, (e) => handleIncomingMessage('reset_race', e.payload))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(initialPlayerState);
          setRoomState('waiting');

          if (hostIdRef.current !== myId) {
            broadcastEvent('request_room_info', {});
          }
        }
      });

    channelRef.current = channel;

    return () => {
      clearInterval(countdownIntervalRef.current);
      channel.unsubscribe();
      if (localBc) localBc.close();
    };
  }, [roomCode, activeUser.id, activeUser.name, myAvatarIcon, handleIncomingMessage, broadcastEvent]);

  // AI Bots simulation during race
  useEffect(() => {
    if (roomState !== 'racing' || !startTime) return;

    const botInterval = setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - startTime) / 1000;

      setPlayers(prev => {
        let updated = false;
        const next = { ...prev };

        Object.values(next).forEach((p: any) => {
          if (p.isBot && p.status === 'racing') {
            updated = true;
            const targetWpm = p.targetWpm || 55;
            // Expected words = (targetWpm / 60) * elapsedSec
            const totalWords = wordsRef.current.length || 30;
            const wordsTyped = (targetWpm / 60) * elapsedSec;
            const rawProgress = Math.min(100, Math.round((wordsTyped / totalWords) * 100));

            const isDone = rawProgress >= 100;
            next[p.id] = {
              ...p,
              progress: rawProgress,
              wpm: targetWpm + Math.round((Math.random() - 0.5) * 4),
              status: isDone ? 'finished' : 'racing',
              finishTime: isDone ? (p.finishTime || now) : undefined
            };
          }
        });

        return updated ? next : prev;
      });
    }, 400);

    return () => clearInterval(botInterval);
  }, [roomState, startTime]);

  useEffect(() => {
    if (roomState !== 'racing' || !startTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 200);

    return () => clearInterval(timer);
  }, [roomState, startTime]);

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomText = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setHostId(activeUser.id);
    hostIdRef.current = activeUser.id;
    setRaceText(randomText);
    raceTextRef.current = randomText;
    setWords(randomText.split(' '));
    setRoomCode(code);
  };

  const handleJoinRoom = () => {
    if (joinCodeInput.trim().length < 6) return;
    setRoomCode(joinCodeInput.trim().toUpperCase());
  };

  const handleAddBots = () => {
    const bots: PlayerState[] = [
      {
        id: `bot-titan-${Date.now()}`,
        name: '🤖 Titan AI (65 WPM)',
        wpm: 65,
        accuracy: 99,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting',
        avatarIcon: '⚡',
        isBot: true,
        targetWpm: 65
      },
      {
        id: `bot-velocity-${Date.now()}`,
        name: '🤖 Velocity Racer (52 WPM)',
        wpm: 52,
        accuracy: 96,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting',
        avatarIcon: '🐆',
        isBot: true,
        targetWpm: 52
      },
      {
        id: `bot-falcon-${Date.now()}`,
        name: '🤖 Falcon AI (44 WPM)',
        wpm: 44,
        accuracy: 94,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting',
        avatarIcon: '🚀',
        isBot: true,
        targetWpm: 44
      }
    ];

    setPlayers(prev => {
      const copy = { ...prev };
      bots.forEach(b => {
        copy[b.id] = b;
      });
      return copy;
    });
  };

  const handleStartRace = () => {
    if (hostIdRef.current !== activeUser.id) return;
    const targetStartAt = Date.now() + 3500;
    broadcastEvent('start_countdown', { targetStartAt });
    handleStartCountdownAt(targetStartAt);
  };

  const sendMyProgress = useCallback(
    (customProgress?: number, customWpm?: number, customStatus?: 'racing' | 'finished', finishTime?: number) => {
      const prog = customProgress !== undefined ? customProgress : myProgress;
      const wpmVal = customWpm !== undefined ? customWpm : myWpm;
      const statusVal = customStatus || (prog >= 100 ? 'finished' : 'racing');

      const state: PlayerState = {
        id: activeUser.id,
        name: activeUser.name,
        wpm: wpmVal,
        accuracy: myAccuracy,
        progress: prog,
        correctChars: correctKeystrokesRef.current,
        incorrectChars: incorrectKeystrokesRef.current,
        status: statusVal,
        finishTime: finishTime || (statusVal === 'finished' ? Date.now() : undefined),
        avatarIcon: myAvatarIcon
      };

      setPlayers(prev => ({ ...prev, [activeUser.id]: state }));
      broadcastEvent('player_progress', { player: state });

      if (channelRef.current) {
        channelRef.current.track(state);
      }
    },
    [activeUser.id, activeUser.name, myProgress, myWpm, myAccuracy, myAvatarIcon, broadcastEvent]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (roomState !== 'racing') return;

    if (soundEnabled) {
      if (e.key === 'Backspace' || e.key.length === 1) {
        soundController.playKeyClick();
      }
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    const currentTargetWord = (words[currentWordIndex] || '').trim();

    if (e.key === 'Backspace') {
      totalKeystrokesRef.current += 1;
      if (inputVal === '' && currentWordIndex > 0) {
        e.preventDefault();
        const prevIndex = currentWordIndex - 1;
        const prevWord = typedWords[prevIndex] || '';
        setCurrentWordIndex(prevIndex);
        setInputVal(prevWord);
        setTypedWords(prev => prev.slice(0, -1));
        return;
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!inputVal.trim() && inputVal !== '') {
        return;
      }

      totalKeystrokesRef.current += 1;

      if (inputVal === currentTargetWord) {
        correctKeystrokesRef.current += currentTargetWord.length + 1;
      } else {
        incorrectKeystrokesRef.current += 1;
      }

      const updatedWords = [...typedWords];
      updatedWords[currentWordIndex] = inputVal;

      const nextWordIdx = currentWordIndex + 1;
      const progressPercent = Math.min(100, Math.round((nextWordIdx / words.length) * 100));
      setMyProgress(progressPercent);

      if (nextWordIdx >= words.length) {
        setTypedWords(updatedWords);
        finishRace();
        return;
      }

      updatedWords.push('');
      setTypedWords(updatedWords);
      setCurrentWordIndex(nextWordIdx);
      setInputVal('');

      sendMyProgress(progressPercent);
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      totalKeystrokesRef.current += 1;
      const charIndex = inputVal.length;

      if (charIndex < currentTargetWord.length && e.key === currentTargetWord[charIndex]) {
        correctKeystrokesRef.current += 1;
      } else {
        incorrectKeystrokesRef.current += 1;
        if (soundEnabled) {
          soundController.playErrorSound();
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (roomState !== 'racing') return;
    const val = e.target.value;
    setInputVal(val);

    if (startTime) {
      const elapsedMinutes = Math.max(0.016, (Date.now() - startTime) / 60000);
      const computedWpm = Math.max(0, Math.round((correctKeystrokesRef.current / 5) / elapsedMinutes));
      setMyWpm(computedWpm);

      const totalTyped = correctKeystrokesRef.current + incorrectKeystrokesRef.current;
      const computedAcc = totalTyped > 0 ? Math.round((correctKeystrokesRef.current / totalTyped) * 100) : 100;
      setMyAccuracy(computedAcc);
    }
  };

  const finishRace = () => {
    setRoomState('finished');
    const finishTimestamp = Date.now();
    setEndTime(finishTimestamp);

    const elapsedMinutes = startTime ? Math.max(0.016, (finishTimestamp - startTime) / 60000) : 1;
    const finalWpm = Math.max(0, Math.round((correctKeystrokesRef.current / 5) / elapsedMinutes));
    setMyWpm(finalWpm);
    setMyProgress(100);

    const existingFinishes = (Object.values(players) as PlayerState[]).filter(p => p.status === 'finished').length;
    const rank = existingFinishes + 1;
    setMyFinishRank(rank);

    sendMyProgress(100, finalWpm, 'finished', finishTimestamp);

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const handlePlayAgain = () => {
    if (hostIdRef.current !== activeUser.id) return;

    const randomText = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setRaceText(randomText);
    raceTextRef.current = randomText;
    setWords(randomText.split(' '));

    broadcastEvent('reset_race', { raceText: randomText });

    setTypedWords(['']);
    setCurrentWordIndex(0);
    setInputVal('');
    setMyWpm(0);
    setMyAccuracy(100);
    setMyProgress(0);
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0);
    setMyFinishRank(null);
    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    incorrectKeystrokesRef.current = 0;
    setRoomState('waiting');
  };

  const sortedPlayers = useMemo(() => {
    const list = Object.values(players) as PlayerState[];
    return list.sort((a, b) => {
      if (a.status === 'finished' && b.status === 'finished') {
        return (a.finishTime || 0) - (b.finishTime || 0);
      }
      if (a.status === 'finished') return -1;
      if (b.status === 'finished') return 1;
      return b.progress - a.progress;
    });
  }, [players]);

  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [currentWordIndex]);

  // SCREEN 1: ROOM CREATION & JOINING SCREEN
  if (roomState === 'joining') {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 animate-in fade-in duration-300">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors shadow-md cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Synchronized Arena
              </span>
              <span className="text-xs font-mono text-slate-400">Department of Technical Training</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2.5">
              <Swords className="w-7 h-7 text-emerald-400" />
              Multiplayer Typing Arena
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-7 space-y-6 flex flex-col items-center justify-between text-center transition-all shadow-xl shadow-emerald-950/10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-100">Create Private Race</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an instant room code. Invite peers or add instant AI bot racers to compete in real-time.
              </p>
            </div>
            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Create New Room</span>
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-7 space-y-6 flex flex-col items-center justify-between text-center transition-all shadow-xl shadow-emerald-950/10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Users className="w-8 h-8" />
            </div>
            <div className="w-full space-y-3">
              <h2 className="text-xl font-black text-slate-100">Join Existing Race</h2>
              <input
                type="text"
                placeholder="6-LETTER CODE"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-xl text-emerald-300 font-mono font-black tracking-widest focus:outline-none focus:border-emerald-500 transition-colors uppercase placeholder:text-slate-700"
              />
            </div>
            <button
              disabled={joinCodeInput.trim().length < 6}
              onClick={handleJoinRoom}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Swords className="w-4 h-4" />
              <span>Enter Race Room</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: ACTIVE MULTIPLAYER ARENA (Lobby, Racing, Finished)
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Header bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onExit}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                <Swords className="w-6 h-6 text-emerald-400" />
                Multiplayer Arena
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">Room Code:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-emerald-300 border border-emerald-500/30 font-mono font-black tracking-widest text-sm select-all">
                {roomCode}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">• Share this code with peers</span>
            </div>
          </div>
        </div>

        {/* Room Action Control */}
        <div className="flex items-center gap-2.5">
          {roomState === 'waiting' && hostId === activeUser.id && (
            <>
              <button
                onClick={handleAddBots}
                className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>+ Add AI Racers</span>
              </button>

              <button
                onClick={handleStartRace}
                className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>Start Race For Everyone</span>
              </button>
            </>
          )}

          {roomState === 'waiting' && hostId !== activeUser.id && (
            <div className="px-5 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold flex items-center justify-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Waiting for room host to start...</span>
            </div>
          )}

          {(roomState === 'racing' || roomState === 'countdown') && (
            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <Gauge className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300">{myWpm} WPM</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-amber-300">{myAccuracy}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Race Track with Animated Racers */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
              Live Synchronized Race Track
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {sortedPlayers.length} Active Racer{sortedPlayers.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Dynamic Racer Tracks */}
        <div className="space-y-3.5 pt-2">
          {sortedPlayers.map((p, idx) => {
            const isMe = p.id === activeUser.id;
            const rankEmoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

            return (
              <div
                key={p.id}
                className={`relative h-16 rounded-2xl overflow-hidden border transition-all ${
                  isMe
                    ? 'bg-slate-950/80 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                {/* Finish Line Checkered Strip */}
                <div
                  className="absolute right-0 top-0 bottom-0 w-8 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(45deg, #fff 0, #fff 4px, #000 4px, #000 8px)'
                  }}
                />

                {/* Progress bar fill with racer icon */}
                <div
                  className={`absolute top-0 left-0 bottom-0 transition-all duration-300 ease-out flex items-center justify-end pr-2 ${
                    isMe
                      ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/20 to-emerald-500/30 border-r-2 border-emerald-400'
                      : 'bg-gradient-to-r from-slate-700/20 via-slate-600/30 to-slate-500/40 border-r-2 border-slate-400'
                  }`}
                  style={{ width: `${Math.max(8, p.progress)}%` }}
                >
                  <span className="text-2xl transform transition-transform filter drop-shadow-md select-none mr-1">
                    {p.avatarIcon || '🏎️'}
                  </span>
                </div>

                {/* Label Overlay */}
                <div className="absolute inset-0 px-4 flex items-center justify-between pointer-events-none z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5 drop-shadow">
                      {p.name} {isMe && <span className="text-emerald-400 font-mono text-xs">(You)</span>}
                      {p.id === hostId && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="font-bold text-emerald-300 drop-shadow">
                      {p.wpm} <span className="text-[10px] text-slate-400">WPM</span>
                    </span>
                    <span className="font-bold text-amber-400 drop-shadow">
                      {p.progress}%
                    </span>
                    {p.status === 'finished' && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 text-[11px]">
                        {rankEmoji} Finished
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Typing Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {roomState === 'waiting' && (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto animate-pulse">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Waiting in Staging Lobby</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {hostId === activeUser.id
                ? 'When ready, click "Start Race For Everyone" (or "+ Add AI Racers") to launch the countdown!'
                : 'The room host will start the race. Get your fingers ready on the keyboard!'}
            </p>
          </div>
        )}

        {roomState === 'countdown' && (
          <div className="py-12 text-center space-y-3 animate-in zoom-in duration-300">
            <div className="text-7xl font-black text-emerald-400 font-mono tracking-tight animate-bounce">
              {countdown > 0 ? countdown : 'GO!'}
            </div>
            <p className="text-sm font-mono text-slate-300 font-bold uppercase tracking-wider">
              {countdown > 0 ? 'Synchronizing Race Engines...' : 'Flooring The Accelerator!'}
            </p>
          </div>
        )}

        {(roomState === 'racing' || roomState === 'finished') && (
          <>
            {roomState === 'finished' ? (
              <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-500/20">
                  <Trophy className="w-10 h-10" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
                    Race Completed!
                  </h2>
                  <p className="text-xs font-mono text-slate-400">
                    You crossed the finish line in #{myFinishRank || 1} position!
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto font-mono">
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase block">Speed</span>
                    <span className="text-2xl font-bold text-emerald-400">{myWpm} <span className="text-xs text-slate-500">WPM</span></span>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase block">Accuracy</span>
                    <span className="text-2xl font-bold text-amber-400">{myAccuracy}%</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase block">Time</span>
                    <span className="text-2xl font-bold text-slate-200">{elapsedTime}s</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase block">Position</span>
                    <span className="text-2xl font-bold text-emerald-400">#{myFinishRank || 1}</span>
                  </div>
                </div>

                {hostId === activeUser.id && (
                  <button
                    onClick={handlePlayAgain}
                    className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Rematch / Play Again</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Passage Container */}
                <div
                  onClick={() => inputRef.current?.focus()}
                  className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 font-mono text-base sm:text-lg leading-relaxed max-h-56 overflow-y-auto cursor-text select-none shadow-inner"
                >
                  {words.map((w, idx) => (
                    <MultiplayerWordRenderer
                      key={idx}
                      rawWord={w}
                      wIdx={idx}
                      isActive={idx === currentWordIndex}
                      currentInput={inputVal}
                      typedWord={typedWords[idx]}
                      activeWordRef={idx === currentWordIndex ? activeWordRef : null}
                    />
                  ))}
                </div>

                {/* Input Field */}
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type the passage above at maximum velocity..."
                    autoFocus
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    className="w-full bg-slate-950 border-2 border-slate-800 focus:border-emerald-500 rounded-2xl px-5 py-4 text-slate-100 font-mono text-lg placeholder:text-slate-600 focus:outline-none transition-colors shadow-lg"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                    <span className="text-xs font-mono text-slate-500">
                      Word {currentWordIndex + 1} / {words.length}
                    </span>
                  </div>
                </div>

                {/* Live Keyboard */}
                <MechanicalKeyboard
                  activeKey={words[currentWordIndex]?.[inputVal.length] || null}
                  soundEnabled={soundEnabled}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
