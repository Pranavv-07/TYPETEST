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
  Bot,
  Play,
  Share2,
  Copy,
  Check,
  UserPlus
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
  "Typing speed is a superpower for modern creators. As your fingers glide effortlessly across mechanical keys, thoughts materialize directly onto the digital canvas with lightning velocity.",
  "Dedicated practice on keyboard ergonomics and key reaches transforms typing from a conscious effort into pure instinctive intuition. Keep your posture upright and your rhythm steady."
];

const RACER_ICONS = ['🏎️', '🚀', '⚡', '🐆', '🏍️', '🛸', '🏎️'];

export interface PlayerState {
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
  laneIndex?: number;
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
  const [copied, setCopied] = useState(false);

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
  const playersRef = useRef(players);
  playersRef.current = players;

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

  // Multichannel broadcast: Supabase Realtime + Local BroadcastChannel + LocalStorage Event
  const broadcastEvent = useCallback((event: string, payload: any) => {
    // 1. Supabase Realtime channel
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
    // 2. Local BroadcastChannel (same browser tabs)
    if (localBroadcastRef.current) {
      try {
        localBroadcastRef.current.postMessage({ event, payload });
      } catch (e) {
        console.error('Local BroadcastChannel failed', e);
      }
    }
    // 3. LocalStorage storage event fallback (cross-window)
    try {
      if (roomCode) {
        const storagePayload = {
          event,
          payload,
          timestamp: Date.now(),
          senderId: activeUser.id
        };
        localStorage.setItem(`testtype_mp_event_${roomCode}`, JSON.stringify(storagePayload));
      }
    } catch (e) {
      console.error('Storage sync failed', e);
    }
  }, [roomCode, activeUser.id]);

  const handleStartCountdownAt = useCallback((targetStartAt: number) => {
    setRoomState('countdown');
    clearInterval(countdownIntervalRef.current);
    setStartTime(null);
    setEndTime(null);
    setElapsedTime(0);
    setMyWpm(0);
    setMyAccuracy(100);
    setMyProgress(0);
    setMyFinishRank(null);
    setInputVal('');
    setTypedWords(['']);
    setCurrentWordIndex(0);
    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    incorrectKeystrokesRef.current = 0;

    // Reset all players and bots to 0 progress
    setPlayers(prev => {
      const next: Record<string, PlayerState> = {};
      (Object.values(prev) as PlayerState[]).forEach(p => {
        next[p.id] = {
          ...p,
          status: 'racing',
          progress: 0,
          wpm: 0,
          finishTime: undefined,
          finishRank: undefined
        };
      });
      return next;
    });

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
      if (!payload) return;
      const myId = activeUser.id;

      if (event === 'join_room') {
        // A new player joined the room!
        if (payload.player && payload.player.id) {
          setPlayers(prev => ({
            ...prev,
            [payload.player.id]: payload.player
          }));

          // If I am the host, immediately reply with full room_sync
          if (hostIdRef.current === myId) {
            const currentPlayersSnapshot = {
              ...playersRef.current,
              [payload.player.id]: payload.player
            };
            broadcastEvent('room_sync', {
              hostId: myId,
              raceText: raceTextRef.current,
              players: currentPlayersSnapshot,
              roomState: roomStateRef.current
            });
          }
        }
      } else if (event === 'room_sync') {
        // Full room snapshot received from host
        if (payload.hostId) {
          setHostId(payload.hostId);
          hostIdRef.current = payload.hostId;
        }
        if (payload.raceText) {
          setRaceText(payload.raceText);
          raceTextRef.current = payload.raceText;
          setWords(payload.raceText.split(' '));
        }
        if (payload.players) {
          setPlayers(prev => ({
            ...payload.players,
            // Retain my own active local state if already present
            [myId]: prev[myId] || payload.players[myId]
          }));
        }
        if (payload.roomState && roomStateRef.current === 'joining') {
          setRoomState(payload.roomState === 'racing' || payload.roomState === 'countdown' ? 'waiting' : payload.roomState);
        }
      } else if (event === 'add_bots') {
        // Bots added by host
        if (payload.bots && Array.isArray(payload.bots)) {
          setPlayers(prev => {
            const copy = { ...prev };
            payload.bots.forEach((b: PlayerState) => {
              copy[b.id] = b;
            });
            return copy;
          });
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
          raceTextRef.current = payload.raceText;
          setWords(payload.raceText.split(' '));
        }

        // Reset all players and bots to waiting
        setPlayers(prev => {
          const next: Record<string, PlayerState> = {};
          (Object.values(prev) as PlayerState[]).forEach(p => {
            next[p.id] = {
              ...p,
              status: 'waiting',
              progress: 0,
              wpm: 0,
              finishTime: undefined,
              finishRank: undefined
            };
          });
          return next;
        });

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

    setPlayers(prev => ({ ...prev, [myId]: initialPlayerState }));

    // 1. Setup Local BroadcastChannel for same-origin tabs
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

    // 2. Setup Storage Event Listener for Cross-Window / Iframe Sync
    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === `testtype_mp_event_${roomCode}` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.event && parsed.senderId !== myId) {
            handleIncomingMessage(parsed.event, parsed.payload);
          }
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 3. Supabase Realtime Channel for Cross-Device Sync
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
            if (p && p.id) {
              newPlayers[p.id] = p;
            }
          }
        });
        setPlayers(prev => ({ ...prev, ...newPlayers }));
      })
      .on('broadcast', { event: 'join_room' }, (e) => handleIncomingMessage('join_room', e.payload))
      .on('broadcast', { event: 'room_sync' }, (e) => handleIncomingMessage('room_sync', e.payload))
      .on('broadcast', { event: 'add_bots' }, (e) => handleIncomingMessage('add_bots', e.payload))
      .on('broadcast', { event: 'start_countdown' }, (e) => handleIncomingMessage('start_countdown', e.payload))
      .on('broadcast', { event: 'player_progress' }, (e) => handleIncomingMessage('player_progress', e.payload))
      .on('broadcast', { event: 'reset_race' }, (e) => handleIncomingMessage('reset_race', e.payload))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(initialPlayerState);
          setRoomState('waiting');

          // Broadcast join_room with my full player info so existing players and host register me
          broadcastEvent('join_room', {
            player: initialPlayerState
          });
        }
      });

    channelRef.current = channel;

    // Immediately announce presence over local channels too
    broadcastEvent('join_room', {
      player: initialPlayerState
    });

    return () => {
      clearInterval(countdownIntervalRef.current);
      channel.unsubscribe();
      if (localBc) localBc.close();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [roomCode, activeUser.id, activeUser.name, myAvatarIcon, handleIncomingMessage, broadcastEvent]);

  // AI Bots simulation during race (Smooth, progressive, realistic typing)
  useEffect(() => {
    // Crucial: Only simulate bots when race is strictly active and startTime is defined
    if (roomState !== 'racing' || !startTime) return;

    const botInterval = setInterval(() => {
      const now = Date.now();
      // Ensure non-negative elapsed time
      const elapsedSec = Math.max(0, (now - startTime) / 1000);

      setPlayers(prev => {
        let updated = false;
        const next = { ...prev };
        const totalWords = wordsRef.current.length || 35;

        Object.values(next).forEach((p: any) => {
          if (p.isBot && p.status === 'racing') {
            updated = true;
            const targetWpm = p.targetWpm || 55;
            // Progressive word speed calculation
            const wordsTyped = (targetWpm / 60) * elapsedSec;
            const rawProgress = Math.min(100, Math.max(0, Math.round((wordsTyped / totalWords) * 100)));

            const isDone = rawProgress >= 100;
            const finishTimestamp = isDone ? (p.finishTime || now) : undefined;
            const currentRank = isDone
              ? (p.finishRank || Object.values(next).filter((pl: any) => pl.status === 'finished').length + 1)
              : undefined;

            next[p.id] = {
              ...p,
              progress: rawProgress,
              wpm: targetWpm + Math.round((Math.sin(elapsedSec * 1.5) * 3)),
              status: isDone ? 'finished' : 'racing',
              finishTime: finishTimestamp,
              finishRank: currentRank
            };
          }
        });

        return updated ? next : prev;
      });
    }, 250);

    return () => clearInterval(botInterval);
  }, [roomState, startTime]);

  // Elapsed Time Timer
  useEffect(() => {
    if (roomState !== 'racing' || !startTime) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor(Math.max(0, (now - startTime) / 1000));
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
    setStartTime(null);
    setEndTime(null);
    setMyProgress(0);
    setMyWpm(0);
    setRoomCode(code);
  };

  const handleJoinRoom = () => {
    if (joinCodeInput.trim().length < 6) return;
    const code = joinCodeInput.trim().toUpperCase();
    setStartTime(null);
    setEndTime(null);
    setMyProgress(0);
    setMyWpm(0);
    setRoomCode(code);
  };

  // Instant Quick Race Mode (1 Human vs 3 AI Bots)
  const handleStartQuickRaceWithBots = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomText = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setHostId(activeUser.id);
    hostIdRef.current = activeUser.id;
    setRaceText(randomText);
    raceTextRef.current = randomText;
    setWords(randomText.split(' '));
    setRoomCode(code);

    const bots: Record<string, PlayerState> = {
      [activeUser.id]: {
        id: activeUser.id,
        name: activeUser.name,
        wpm: 0,
        accuracy: 100,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting',
        avatarIcon: myAvatarIcon
      },
      [`bot-titan`]: {
        id: `bot-titan`,
        name: '🤖 Titan AI (65 WPM)',
        wpm: 0,
        accuracy: 99,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting',
        avatarIcon: '⚡',
        isBot: true,
        targetWpm: 65
      },
      [`bot-velocity`]: {
        id: `bot-velocity`,
        name: '🤖 Velocity Racer (52 WPM)',
        wpm: 0,
        accuracy: 96,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting',
        avatarIcon: '🐆',
        isBot: true,
        targetWpm: 52
      },
      [`bot-falcon`]: {
        id: `bot-falcon`,
        name: '🤖 Falcon AI (44 WPM)',
        wpm: 0,
        accuracy: 94,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting',
        avatarIcon: '🚀',
        isBot: true,
        targetWpm: 44
      }
    };

    setPlayers(bots);
    const targetStartAt = Date.now() + 3500;
    handleStartCountdownAt(targetStartAt);
  };

  const handleAddBots = () => {
    const bots: PlayerState[] = [
      {
        id: `bot-titan-${Date.now()}`,
        name: '🤖 Titan AI (65 WPM)',
        wpm: 0,
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
        wpm: 0,
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
        wpm: 0,
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

    // Broadcast added bots to all other clients in the room
    broadcastEvent('add_bots', { bots });
  };

  const handleStartRace = () => {
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

    // Reset bot states
    setPlayers(prev => {
      const next: Record<string, PlayerState> = {};
      (Object.values(prev) as PlayerState[]).forEach(p => {
        next[p.id] = {
          ...p,
          status: 'waiting',
          progress: 0,
          wpm: 0,
          finishTime: undefined,
          finishRank: undefined
        };
      });
      return next;
    });

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

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
      <div className="max-w-4xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-300">
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
              <span className="text-xs font-mono text-slate-400">TYPETEST Global Arena</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-100 flex items-center gap-2.5">
              <Swords className="w-7 h-7 text-emerald-400" />
              Multiplayer Speed Arena
            </h1>
          </div>
        </div>

        {/* Featured Solo vs AI Quick Match Banner */}
        <div className="bg-gradient-to-r from-emerald-500/20 via-teal-900/40 to-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-2 z-10 max-w-lg">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Instant Solo Race Mode</span>
            </div>
            <h2 className="text-2xl font-black text-slate-100">
              ⚡ Quick Match vs 3 AI Competitors
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              No waiting! Jump straight into a 4-player high-speed race against calibrated AI racers (Titan 65 WPM, Velocity 52 WPM, Falcon 44 WPM) with real-time multi-lane track animations.
            </p>
          </div>

          <button
            onClick={handleStartQuickRaceWithBots}
            className="z-10 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-xl shadow-emerald-500/30 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Quick Race Now</span>
          </button>

          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Room Card */}
          <div className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-7 space-y-6 flex flex-col items-center justify-between text-center transition-all shadow-xl shadow-emerald-950/10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Zap className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-100">Host Custom Race</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Generate a 6-letter room code. Invite peers across devices or add bots to compete in real-time.
              </p>
            </div>
            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm transition-all border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-400 fill-current" />
              <span>Create Room Code</span>
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

  // SCREEN 2: ACTIVE MULTIPLAYER ARENA (Lobby, Countdown, Racing, Finished)
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setRoomState('joining');
              setRoomCode('');
            }}
            className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase text-slate-400">
                Room Code:
              </span>
              <button
                onClick={copyRoomCode}
                className="px-2.5 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono font-black text-sm flex items-center gap-1.5 cursor-pointer hover:bg-emerald-900/80"
              >
                <span>{roomCode}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {Object.keys(players).length} Racers in Lobby
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {roomState === 'waiting' && (
            <>
              <button
                onClick={handleAddBots}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-emerald-400" />
                <span>Add AI Bots (3 Racers)</span>
              </button>

              <button
                onClick={handleStartRace}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Race</span>
              </button>
            </>
          )}

          {roomState === 'finished' && (
            <button
              onClick={handlePlayAgain}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Race Again</span>
            </button>
          )}
        </div>
      </div>

      {/* Countdown Overlay */}
      {roomState === 'countdown' && (
        <div className="bg-slate-900/90 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-3 shadow-2xl backdrop-blur-md animate-pulse">
          <span className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-widest">
            RACE STARTING IN
          </span>
          <div className="text-6xl font-black font-mono text-emerald-300">
            {countdown > 0 ? countdown : 'GO!'}
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Get your fingers placed on home row keys!
          </p>
        </div>
      )}

      {/* MULTIPLAYER RACE TRACK */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center text-xs font-mono">
          <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Car className="w-4 h-4 text-emerald-400" />
            Live Race Distance & Speed
          </span>
          <div className="flex items-center gap-3 text-slate-400">
            <span>⏱️ {elapsedTime}s</span>
            <span>🏁 Finish Line (100%)</span>
          </div>
        </div>

        {/* Individual Player Lanes */}
        <div className="space-y-3">
          {sortedPlayers.map((player, idx) => {
            const isMe = player.id === activeUser.id;

            return (
              <div
                key={player.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'bg-slate-950 border-emerald-500/40 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-950/60 border-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-center text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{player.avatarIcon || '🏎️'}</span>
                    <span className={`font-bold ${isMe ? 'text-emerald-300' : 'text-slate-200'}`}>
                      {player.name} {isMe && '(You)'}
                    </span>
                    {player.isBot && (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                        AI BOT
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-emerald-400 font-bold">{player.wpm} WPM</span>
                    <span className="text-slate-400">{player.progress}%</span>
                    {player.status === 'finished' && (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold flex items-center gap-1">
                        <Trophy className="w-3 h-3" />
                        {player.finishRank ? `#${player.finishRank}` : 'Finished'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Asphalt Track Bar with Moving Racer Icon */}
                <div className="w-full h-8 bg-slate-900 rounded-xl overflow-hidden relative border border-slate-800 flex items-center px-1">
                  {/* Dashed Road Center Line */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-b border-dashed border-slate-700/50 pointer-events-none" />

                  {/* Progress Fill Trail */}
                  <div
                    className={`h-full absolute left-0 top-0 transition-all duration-300 rounded-l-xl ${
                      isMe
                        ? 'bg-gradient-to-r from-emerald-500/20 to-emerald-500/40'
                        : 'bg-gradient-to-r from-slate-700/20 to-slate-700/40'
                    }`}
                    style={{ width: `${player.progress}%` }}
                  />

                  {/* Moving Car / Racer Icon */}
                  <div
                    className="absolute transition-all duration-300 flex items-center gap-1"
                    style={{
                      left: `calc(${Math.min(94, Math.max(1, player.progress))}% - 12px)`
                    }}
                  >
                    <span className="text-lg filter drop-shadow-md">
                      {player.avatarIcon || '🏎️'}
                    </span>
                    {player.progress > 0 && player.status === 'racing' && (
                      <span className="text-[10px] text-orange-400 animate-pulse">🔥</span>
                    )}
                  </div>

                  {/* Finish Checkered Flag */}
                  <div className="absolute right-2 text-xs">🏁</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TYPING TEXT BOX & INPUT (When racing or finished) */}
      {(roomState === 'racing' || roomState === 'finished') && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Race Paragraph Box */}
          <div className="p-5 sm:p-6 bg-slate-950 border border-slate-800 rounded-2xl text-lg sm:text-xl font-mono leading-relaxed max-h-48 overflow-y-auto select-none shadow-inner">
            {words.map((w, idx) => (
              <MultiplayerWordRenderer
                key={idx}
                rawWord={w}
                wIdx={idx}
                isActive={idx === currentWordIndex && roomState === 'racing'}
                currentInput={inputVal}
                typedWord={typedWords[idx]}
                activeWordRef={idx === currentWordIndex ? activeWordRef : null}
              />
            ))}
          </div>

          {/* Active Typing Input */}
          {roomState === 'racing' && (
            <div className="space-y-2">
              <input
                ref={inputRef}
                type="text"
                autoFocus
                placeholder="Type here to race..."
                value={inputVal}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="w-full bg-slate-950 border-2 border-emerald-500/50 rounded-2xl px-5 py-4 text-slate-100 font-mono text-lg focus:outline-none focus:border-emerald-400 transition-colors shadow-lg"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400 px-2">
                <span>Speed: <strong className="text-emerald-400">{myWpm} WPM</strong></span>
                <span>Accuracy: <strong className="text-amber-400">{myAccuracy}%</strong></span>
                <span>Word: <strong>{currentWordIndex + 1} / {words.length}</strong></span>
              </div>
            </div>
          )}

          {/* Post-Race Podium Showcase */}
          {roomState === 'finished' && (
            <div className="p-6 bg-slate-950 border border-emerald-500/30 rounded-2xl text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-3xl shadow-lg">
                🏆
              </div>

              <div>
                <h3 className="text-2xl font-black text-slate-100">
                  {myFinishRank === 1 ? '🥇 1st Place Victory!' : myFinishRank === 2 ? '🥈 2nd Place Podium!' : myFinishRank === 3 ? '🥉 3rd Place Finish!' : '🏁 Race Completed!'}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  You completed the race in <strong>{elapsedTime}s</strong> with <strong>{myWpm} WPM</strong> at <strong>{myAccuracy}% Accuracy</strong>.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">Final Speed</span>
                  <span className="text-xl font-black font-mono text-emerald-400">{myWpm} WPM</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">Accuracy</span>
                  <span className="text-xl font-black font-mono text-emerald-400">{myAccuracy}%</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block">Finish Rank</span>
                  <span className="text-xl font-black font-mono text-amber-400">#{myFinishRank || 1}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
