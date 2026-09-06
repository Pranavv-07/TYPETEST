import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Trophy, Swords, Zap, Users, Loader2, ArrowLeft, Flag } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

const RACE_TEXT = "The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging errant code. Multiplayer typing races are fun and engaging for everyone involved.";

interface PlayerState {
  id: string;
  name: string;
  wpm: number;
  progress: number;
  status: 'waiting' | 'racing' | 'finished';
}

export const MultiplayerArena: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { currentUser } = useApp();
  
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [roomState, setRoomState] = useState<'joining' | 'waiting' | 'countdown' | 'racing' | 'finished'>('joining');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [countdown, setCountdown] = useState(5);
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Typing state
  const [inputVal, setInputVal] = useState('');
  const [words] = useState<string[]>(RACE_TEXT.split(' '));
  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [myWpm, setMyWpm] = useState(0);
  const [myProgress, setMyProgress] = useState(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser || !roomCode) return;
    
    const myId = currentUser.id;
    const initialPlayerState: PlayerState = {
      id: myId,
      name: currentUser.name,
      wpm: 0,
      progress: 0,
      status: 'waiting'
    };

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
        setPlayers(newPlayers);
      })
      .on('broadcast', { event: 'start_race' }, () => {
        setRoomState('countdown');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(initialPlayerState);
          setRoomState('waiting');
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser, roomCode]);

  // Countdown logic
  useEffect(() => {
    if (roomState === 'countdown') {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setRoomState('racing');
        setStartTime(Date.now());
        if (inputRef.current) inputRef.current.focus();
      }
    }
  }, [roomState, countdown]);

  // Broadcast progress
  useEffect(() => {
    if (roomState === 'racing' && channelRef.current && currentUser) {
      const updateInterval = setInterval(() => {
        const state: PlayerState = {
          id: currentUser.id,
          name: currentUser.name,
          wpm: myWpm,
          progress: myProgress,
          status: myProgress >= 100 ? 'finished' : 'racing'
        };
        channelRef.current?.track(state);
      }, 1000);
      return () => clearInterval(updateInterval);
    }
  }, [roomState, myWpm, myProgress, currentUser]);

  const handleStartRace = () => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'start_race',
        payload: {}
      });
      // Also start for self
      setRoomState('countdown');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (roomState !== 'racing') return;
    
    const val = e.target.value;
    
    if (val.endsWith(' ')) {
      const wordTyped = val.trim();
      const newTypedWords = [...typedWords];
      newTypedWords[currentWordIndex] = wordTyped;
      
      setTypedWords([...newTypedWords, '']);
      setCurrentWordIndex(prev => prev + 1);
      setInputVal('');
      
      const progress = Math.min(100, Math.round(((currentWordIndex + 1) / words.length) * 100));
      setMyProgress(progress);
      
      if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const wpmCount = Math.round(((currentWordIndex + 1) * 5) / 5 / elapsedMinutes);
        setMyWpm(wpmCount);
      }
      
      if (currentWordIndex + 1 >= words.length) {
        setRoomState('finished');
        if (channelRef.current && currentUser) {
          channelRef.current.track({
            id: currentUser.id,
            name: currentUser.name,
            wpm: myWpm,
            progress: 100,
            status: 'finished'
          });
        }
      }
    } else {
      const newTypedWords = [...typedWords];
      newTypedWords[currentWordIndex] = val;
      setTypedWords(newTypedWords);
      setInputVal(val);
    }
  };

  const sortedPlayers = (Object.values(players) as PlayerState[]).sort((a, b) => b.progress - a.progress);

  if (roomState === 'joining') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onExit} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <Swords className="w-6 h-6 text-amber-500" />
              Multiplayer Arena
            </h1>
            <p className="text-sm text-slate-400">Join or create a private typing race</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-500 mb-2">
              <Zap className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-200">Create New Race</h2>
              <p className="text-xs text-slate-400 mt-2">Generate a unique room code and invite others to race against you.</p>
            </div>
            <button
              onClick={() => {
                const code = Math.random().toString(36).substring(2, 8).toUpperCase();
                setRoomCode(code);
                setRoomState('waiting');
              }}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20"
            >
              Create Room
            </button>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-500 mb-2">
              <Users className="w-8 h-8" />
            </div>
            <div className="w-full">
              <h2 className="text-xl font-bold text-slate-200 mb-4">Join Race</h2>
              <input
                type="text"
                placeholder="Enter 6-letter code"
                value={joinCodeInput}
                onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
                maxLength={6}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-center text-xl text-slate-100 font-mono font-bold tracking-widest focus:outline-none focus:border-cyan-500/60"
              />
            </div>
            <button
              disabled={joinCodeInput.length < 6}
              onClick={() => {
                setRoomCode(joinCodeInput);
                setRoomState('waiting');
              }}
              className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:hover:bg-cyan-500 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20"
            >
              Join Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-xl shadow-amber-900/10">
        <div className="flex items-center gap-4">
          <button onClick={onExit} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-100 flex items-center gap-2">
              <Swords className="w-6 h-6 text-amber-500" />
              Multiplayer Arena
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-slate-400">Room Code:</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-bold tracking-widest text-xs">
                {roomCode}
              </span>
            </div>
          </div>
        </div>
        
        {roomState === 'waiting' && Object.keys(players).length > 1 && (
          <button onClick={handleStartRace} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Start Race Now
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Race Track */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Flag className="w-4 h-4" /> Live Race
            </h2>
            
            <div className="space-y-4 relative">
              {sortedPlayers.map((p, idx) => (
                <div key={p.id} className="relative h-12 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out flex items-center justify-end px-3
                      ${p.id === currentUser?.id ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/80 border-r-2 border-amber-400' : 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/80 border-r-2 border-cyan-400'}
                    `}
                    style={{ width: `${Math.max(5, p.progress)}%` }}
                  >
                    <span className="text-xs font-black text-slate-950 shadow-sm bg-white/90 px-2 py-0.5 rounded">
                      {p.wpm} WPM
                    </span>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center px-4 pointer-events-none">
                    <span className="font-bold text-sm text-white drop-shadow-md z-10">{p.name} {p.id === currentUser?.id && '(You)'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typing Area */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            {roomState === 'waiting' && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto" />
                <h3 className="text-xl font-bold text-slate-200">Waiting for players...</h3>
                <p className="text-slate-400">At least 2 players are required to start a race.</p>
              </div>
            )}

            {roomState === 'countdown' && (
              <div className="py-12 text-center space-y-2">
                <div className="text-6xl font-black text-amber-500 animate-pulse">{countdown}</div>
                <p className="text-xl font-bold text-slate-300">Get Ready!</p>
              </div>
            )}

            {(roomState === 'racing' || roomState === 'finished') && (
              <>
                <div className="text-lg sm:text-xl leading-relaxed text-slate-400 font-medium select-none p-4 bg-slate-950 rounded-xl border border-slate-800">
                  {words.map((word, wIdx) => {
                    const typed = typedWords[wIdx];
                    let wordClass = '';
                    
                    if (wIdx < currentWordIndex) {
                      wordClass = typed === word ? 'text-emerald-400' : 'text-rose-400 underline decoration-rose-500/50';
                    } else if (wIdx === currentWordIndex) {
                      wordClass = 'text-slate-100 bg-slate-800 rounded px-1 -mx-1';
                    }

                    return (
                      <span key={wIdx} className={`${wordClass} mr-1 inline-block`}>
                        {word.split('').map((char, cIdx) => {
                          if (wIdx === currentWordIndex && typed !== undefined) {
                            if (cIdx < typed.length) {
                              return <span key={cIdx} className={typed[cIdx] === char ? 'text-emerald-400' : 'text-rose-400 bg-rose-500/20'}>{char}</span>;
                            }
                          }
                          return <span key={cIdx}>{char}</span>;
                        })}
                      </span>
                    );
                  })}
                </div>

                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputVal}
                    onChange={handleInputChange}
                    disabled={roomState !== 'racing'}
                    placeholder={roomState === 'racing' ? 'Type the text above...' : 'Race finished!'}
                    className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-5 py-4 text-xl text-slate-100 font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" /> Connected Players ({Object.keys(players).length})
            </h3>
            <div className="space-y-3">
              {(Object.values(players) as PlayerState[]).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                      {p.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{p.name} {p.id === currentUser?.id && '(You)'}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase">{p.status}</div>
                    </div>
                  </div>
                  {p.status === 'finished' && <Trophy className="w-4 h-4 text-amber-500" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
