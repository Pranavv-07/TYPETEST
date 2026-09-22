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
  Rocket
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

const RACER_ICONS = ['🏎️', '🚀', '⚡', '🐆', '🏎️', '🏍️', '🛸'];

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
}

// Word renderer matching the standard TypingArena character-by-character flow
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
        isActive ? 'bg-slate-800/80 px-1.5 ring-1 ring-amber-400/40' : ''
      }`}
    >
      {word.split('').map((char, cIdx) => {
        let charColor = 'text-slate-500'; // untyped
        let bg = '';

        if (isActive) {
          if (cIdx < currentInput.length) {
            if (currentInput[cIdx] === char) {
              charColor = 'text-emerald-400 font-semibold'; // correct
            } else {
              charColor = 'text-rose-400 font-semibold';
              bg = 'bg-rose-500/25'; // incorrect
            }
          }
        } else if (typedWord !== undefined) {
          // Previously typed word
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
              <span className="absolute -left-[1px] top-1 bottom-1 w-[2.5px] bg-amber-400 animate-pulse rounded-full shadow-[0_0_8px_#f59e0b]" />
            )}
            <span className={`${charColor} ${bg} rounded-sm px-[0.5px]`}>{char}</span>
          </span>
        );
      })}

      {/* Extra characters typed beyond word length */}
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

  // Create a persistent guest racer if not logged in
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

  // References to prevent closure tearing
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

  // Unique avatar icon for this session
  const myAvatarIcon = useMemo(() => {
    const hash = (activeUser.name || 'player')
      .split('')
      .reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return RACER_ICONS[hash % RACER_ICONS.length];
  }, [activeUser.name]);

  // Dual-layer broadcaster: Supabase Realtime + local BroadcastChannel (for 0ms multi-tab testing)
  const broadcastEvent = useCallback((event: string, payload: any) => {
    // 1. Send via Supabase Realtime
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
    // 2. Send via local BroadcastChannel
    if (localBroadcastRef.current) {
      try {
        localBroadcastRef.current.postMessage({ event, payload });
      } catch (e) {
        console.error('Local BroadcastChannel failed', e);
      }
    }
  }, []);

  // Synchronized countdown trigger using authoritative timestamp
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

  // Shared event dispatcher for incoming messages
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

  // Set up Channel Subscription - ONLY dependent on roomCode and activeUser.id
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

    // 1. Local BroadcastChannel for instant cross-tab sync
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

    // 2. Supabase Realtime Channel
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

          // Request room text if we are a joiner
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

  // Periodic elapsed time & state broadcast while racing
  useEffect(() => {
    if (roomState !== 'racing' || !startTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedTime(elapsed);
    }, 200);

    return () => clearInterval(timer);
  }, [roomState, startTime]);

  // Handle Room Creation
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

  // Handle Room Joining
  const handleJoinRoom = () => {
    if (joinCodeInput.trim().length < 6) return;
    setRoomCode(joinCodeInput.trim().toUpperCase());
  };

  // Synchronized Start Race Handler
  const handleStartRace = () => {
    if (hostIdRef.current !== activeUser.id) return;

    // Start 3.5 seconds in the future so all peers synchronize smoothly
    const targetStartAt = Date.now() + 3500;
    broadcastEvent('start_countdown', { targetStartAt });
    handleStartCountdownAt(targetStartAt);
  };

  // Broadcast current player state
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

      // Update local state immediately
      setPlayers(prev => ({ ...prev, [activeUser.id]: state }));

      // Broadcast to other peers
      broadcastEvent('player_progress', { player: state });

      // Track in presence
      if (channelRef.current) {
        channelRef.current.track(state);
      }
    },
    [activeUser.id, activeUser.name, myProgress, myWpm, myAccuracy, myAvatarIcon, broadcastEvent]
  );

  // Keyboard Handlers - Exactly matching TypingArena
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (roomState !== 'racing') return;

    // Audio feedback
    if (soundEnabled) {
      if (e.key === 'Backspace' || e.key.length === 1) {
        soundController.playKeyClick();
      }
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    const currentTargetWord = (words[currentWordIndex] || '').trim();

    // Backspace Handling
    if (e.key === 'Backspace') {
      totalKeystrokesRef.current += 1;

      // If at start of word and can go back to previous word
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

    // Space bar advances to next word
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!inputVal.trim() && inputVal !== '') {
        return;
      }

      totalKeystrokesRef.current += 1;

      if (inputVal === currentTargetWord) {
        correctKeystrokesRef.current += currentTargetWord.length + 1; // +1 space
      } else {
        incorrectKeystrokesRef.current += 1;
      }

      const updatedWords = [...typedWords];
      updatedWords[currentWordIndex] = inputVal;

      // Calculate progress based on words completed
      const nextWordIdx = currentWordIndex + 1;
      const progressPercent = Math.min(100, Math.round((nextWordIdx / words.length) * 100));
      setMyProgress(progressPercent);

      // Check if race finished!
      if (nextWordIdx >= words.length) {
        setTypedWords(updatedWords);
        finishRace();
        return;
      }

      updatedWords.push('');
      setTypedWords(updatedWords);
      setCurrentWordIndex(nextWordIdx);
      setInputVal('');

      // Send live progress broadcast
      sendMyProgress(progressPercent);
      return;
    }

    // Printable Characters
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

    // Calculate current live WPM and Accuracy
    if (startTime) {
      const elapsedMinutes = Math.max(0.016, (Date.now() - startTime) / 60000);
      const computedWpm = Math.max(0, Math.round((correctKeystrokesRef.current / 5) / elapsedMinutes));
      setMyWpm(computedWpm);

      const totalTyped = correctKeystrokesRef.current + incorrectKeystrokesRef.current;
      const computedAcc = totalTyped > 0 ? Math.round((correctKeystrokesRef.current / totalTyped) * 100) : 100;
      setMyAccuracy(computedAcc);
    }
  };

  // Finish Race Handler
  const finishRace = () => {
    setRoomState('finished');
    const finishTimestamp = Date.now();
    setEndTime(finishTimestamp);

    // Calculate final metrics
    const elapsedMinutes = startTime ? Math.max(0.016, (finishTimestamp - startTime) / 60000) : 1;
    const finalWpm = Math.max(0, Math.round((correctKeystrokesRef.current / 5) / elapsedMinutes));
    setMyWpm(finalWpm);
    setMyProgress(100);

    // Calculate place rank
    const existingFinishes = (Object.values(players) as PlayerState[]).filter(p => p.status === 'finished').length;
    const rank = existingFinishes + 1;
    setMyFinishRank(rank);

    // Broadcast finished status
    sendMyProgress(100, finalWpm, 'finished', finishTimestamp);

    // Confetti celebration!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  // Play Again Handler (Host restarts the room for all players)
  const handlePlayAgain = () => {
    if (hostIdRef.current !== activeUser.id) return;

    const randomText = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setRaceText(randomText);
    raceTextRef.current = randomText;
    setWords(randomText.split(' '));

    broadcastEvent('reset_race', { raceText: randomText });

    // Local reset
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

  // Sorted players by progress or finish rank
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

  // Auto-scroll active word into view during race
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
            className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Peer-to-Peer
              </span>
              <span className="text-xs font-mono text-slate-400">Zero-Latency Sync</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2.5">
              <Swords className="w-7 h-7 text-amber-400" />
              Multiplayer Typing Arena
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-7 space-y-6 flex flex-col items-center justify-between text-center transition-all shadow-xl shadow-amber-950/10">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-100">Create Private Race</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate an instant room code. Share it with friends or classmates to race head-to-head on the same text.
              </p>
            </div>
            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Create New Room</span>
            </button>
          </div>

          {/* Join Room Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-3xl p-7 space-y-6 flex flex-col items-center justify-between text-center transition-all shadow-xl shadow-cyan-950/10">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
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
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-center text-xl text-cyan-300 font-mono font-black tracking-widest focus:outline-none focus:border-cyan-500 transition-colors uppercase placeholder:text-slate-700"
              />
            </div>
            <button
              disabled={joinCodeInput.trim().length < 6}
              onClick={handleJoinRoom}
              className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 font-black text-sm transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
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
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
                <Swords className="w-6 h-6 text-amber-400" />
                Multiplayer Arena
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-400 font-mono">Room Code:</span>
              <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 text-amber-300 border border-amber-500/30 font-mono font-black tracking-widest text-sm select-all">
                {roomCode}
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">• Share this code with peers</span>
            </div>
          </div>
        </div>

        {/* Room Action Control */}
        <div>
          {roomState === 'waiting' && hostId === activeUser.id && (
            <button
              onClick={handleStartRace}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Start Race For Everyone</span>
            </button>
          )}
          {roomState === 'waiting' && hostId !== activeUser.id && (
            <div className="px-5 py-3 rounded-2xl bg-slate-800 border border-slate-700 text-slate-300 font-mono text-xs font-semibold flex items-center justify-center gap-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Waiting for room host to start...</span>
            </div>
          )}
          {(roomState === 'racing' || roomState === 'countdown') && (
            <div className="flex items-center gap-3 font-mono text-xs text-slate-400">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-cyan-300">{myWpm} WPM</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <Target className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300">{myAccuracy}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Race Track with Animated Racers */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-amber-400" />
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
                    ? 'bg-slate-950/80 border-amber-500/40 shadow-md shadow-amber-950/20'
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
                      ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/30 border-r-2 border-amber-400'
                      : 'bg-gradient-to-r from-cyan-500/10 via-cyan-500/20 to-cyan-500/30 border-r-2 border-cyan-400'
                  }`}
                  style={{ width: `${Math.max(8, p.progress)}%` }}
                >
                  {/* Moving Racer Avatar */}
                  <span className="text-2xl transform transition-transform filter drop-shadow-md select-none mr-1">
                    {p.avatarIcon || '🏎️'}
                  </span>
                </div>

                {/* Label Overlay */}
                <div className="absolute inset-0 px-4 flex items-center justify-between pointer-events-none z-10">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-100 flex items-center gap-1.5 drop-shadow">
                      {p.name} {isMe && <span className="text-amber-400 font-mono text-xs">(You)</span>}
                      {p.id === hostId && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="font-bold text-cyan-300 drop-shadow">
                      {p.wpm} <span className="text-[10px] text-slate-400">WPM</span>
                    </span>
                    <span className="font-bold text-emerald-400 drop-shadow">
                      {p.progress}%
                    </span>
                    {p.status === 'finished' && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[11px]">
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

      {/* Synchronous Countdown Overlay or Interactive Typing Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {roomState === 'waiting' && (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto animate-pulse">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-200">Waiting in Staging Lobby</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              {hostId === activeUser.id
                ? 'When all participants are visible in the race track, click "Start Race For Everyone" above to launch the synchronized countdown.'
                : 'The room host will start the race. Get your fingers ready on the keyboard!'}
            </p>
          </div>
        )}

        {roomState === 'countdown' && (
          <div className="py-12 text-center space-y-3 animate-in zoom-in duration-300">
            <div className="text-7xl font-black text-amber-400 font-mono tracking-tight animate-bounce">
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
                <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-500/20">
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
                    <span className="text-2xl font-bold text-cyan-400">{myWpm} <span className="text-xs text-slate-500">WPM</span></span>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase block">Accuracy</span>
                    <span className="text-2xl font-bold text-emerald-400">{myAccuracy}%</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase block">Duration</span>
                    <span className="text-2xl font-bold text-slate-200">
                      {startTime && endTime ? Math.floor((endTime - startTime) / 1000) : elapsedTime}s
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl">
                    <span className="text-[10px] text-slate-500 uppercase block">Errors</span>
                    <span className="text-2xl font-bold text-rose-400">{incorrectKeystrokesRef.current}</span>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-center gap-3">
                  {hostId === activeUser.id ? (
                    <button
                      onClick={handlePlayAgain}
                      className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Rematch (Restart Race Lobby)</span>
                    </button>
                  ) : (
                    <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                      <span>Waiting for room host to initiate rematch...</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div
                onClick={() => inputRef.current?.focus()}
                className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 cursor-text select-none shadow-inner min-h-[200px] flex flex-col justify-center"
              >
                {/* Hidden input field for smooth native typing */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputVal}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                  className="absolute inset-0 opacity-0 cursor-default"
                  aria-label="Multiplayer race input"
                />

                {/* Words Container with Character-by-Character Styling */}
                <div
                  className="font-mono text-lg sm:text-2xl leading-relaxed tracking-wide text-left relative transition-all"
                  style={{ fontFamily: "'Fira Code', monospace" }}
                >
                  {words.map((rawWord, wIdx) => {
                    const isActive = wIdx === currentWordIndex;
                    const currentInput = isActive ? inputVal : typedWords[wIdx] || '';
                    const typedWord = wIdx < currentWordIndex ? typedWords[wIdx] : undefined;

                    return (
                      <MultiplayerWordRenderer
                        key={wIdx}
                        rawWord={rawWord}
                        wIdx={wIdx}
                        isActive={isActive}
                        currentInput={currentInput}
                        typedWord={typedWord}
                        activeWordRef={isActive ? activeWordRef : null}
                      />
                    );
                  })}
                </div>

                <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-mono pt-4 border-t border-slate-800/80">
                  <span>Space to advance word • Backspace to correct letters</span>
                  <span className="text-amber-400/90 font-bold">Word {currentWordIndex + 1} of {words.length}</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mechanical Keyboard Section (Always visible beneath race arena) */}
      <div className="space-y-2">
        <MechanicalKeyboard
          interactive={true}
          compact={false}
          className="shadow-2xl"
        />
      </div>
    </div>
  );
};
