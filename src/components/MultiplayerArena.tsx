import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useApp } from '../context/AppContext';
import { Trophy, Swords, Zap, Users, Loader2, ArrowLeft, Flag, Crown, CheckCircle2, XCircle } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';

const PASSAGES = [
  "The quick brown fox jumps over the lazy dog. Programming is the art of algorithm design and the craft of debugging errant code. Multiplayer typing races are fun and engaging for everyone involved.",
  "In the world of software engineering, clean code is a sign of a true professional. Always remember to comment your complex logic and write comprehensive unit tests to ensure long-term maintainability.",
  "The greatest glory in living lies not in never falling, but in rising every time we fall. Success is a journey, not a destination. Keep typing fast and accurately to improve your skills daily."
];

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
}

export const MultiplayerArena: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const { currentUser } = useApp();
  
  const [players, setPlayers] = useState<Record<string, PlayerState>>({});
  const [roomState, setRoomState] = useState<'joining' | 'waiting' | 'countdown' | 'racing' | 'finished'>('joining');
  const [roomCode, setRoomCode] = useState<string>('');
  const [joinCodeInput, setJoinCodeInput] = useState<string>('');
  const [countdown, setCountdown] = useState(3);
  
  const [hostId, setHostId] = useState<string>('');
  const [raceText, setRaceText] = useState<string>('');
  
  const channelRef = useRef<RealtimeChannel | null>(null);
  
  // Typing state
  const [inputVal, setInputVal] = useState('');
  const [words, setWords] = useState<string[]>([]);
  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [myWpm, setMyWpm] = useState(0);
  const [myAccuracy, setMyAccuracy] = useState(100);
  const [myProgress, setMyProgress] = useState(0);
  
  const totalKeystrokesRef = useRef(0);
  const correctKeystrokesRef = useRef(0);
  const incorrectKeystrokesRef = useRef(0);
  
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser || !roomCode) return;
    
    const myId = currentUser.id;
    const initialPlayerState: PlayerState = {
      id: myId,
      name: currentUser.name,
      wpm: 0,
      accuracy: 100,
      progress: 0,
      correctChars: 0,
      incorrectChars: 0,
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
      .on('broadcast', { event: 'request_room_info' }, (payload) => {
        if (hostId === myId) {
          channel.send({
            type: 'broadcast',
            event: 'room_info',
            payload: { hostId, raceText }
          });
        }
      })
      .on('broadcast', { event: 'room_info' }, (payload) => {
        if (payload.payload.hostId) setHostId(payload.payload.hostId);
        if (payload.payload.raceText) {
          setRaceText(payload.payload.raceText);
          setWords(payload.payload.raceText.split(' '));
        }
      })
      .on('broadcast', { event: 'countdown' }, (payload) => {
        setRoomState('countdown');
        setCountdown(payload.payload.count);
      })
      .on('broadcast', { event: 'start_race' }, () => {
        setRoomState('racing');
        setStartTime(Date.now());
        if (inputRef.current) inputRef.current.focus();
      })
      .on('broadcast', { event: 'reset_race' }, () => {
        setTypedWords(['']);
        setCurrentWordIndex(0);
        setInputVal('');
        setMyWpm(0);
        setMyAccuracy(100);
        setMyProgress(0);
        setStartTime(null);
        setEndTime(null);
        setElapsedTime(0);
        totalKeystrokesRef.current = 0;
        correctKeystrokesRef.current = 0;
        incorrectKeystrokesRef.current = 0;
        
        setRoomState('waiting');
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track(initialPlayerState);
          setRoomState('waiting');
          
          if (hostId !== myId) {
            channel.send({
              type: 'broadcast',
              event: 'request_room_info',
              payload: {}
            });
          }
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [currentUser, roomCode, hostId, raceText]);

  // Broadcast progress
  useEffect(() => {
    if ((roomState === 'racing' || roomState === 'finished') && channelRef.current && currentUser) {
      const updateInterval = setInterval(() => {
        if (roomState === 'racing' && startTime) {
           setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }
        const state: PlayerState = {
          id: currentUser.id,
          name: currentUser.name,
          wpm: myWpm,
          accuracy: myAccuracy,
          progress: myProgress,
          correctChars: correctKeystrokesRef.current,
          incorrectChars: incorrectKeystrokesRef.current,
          status: myProgress >= 100 ? 'finished' : 'racing',
          finishTime: myProgress >= 100 && roomState === 'finished' ? Date.now() : undefined
        };
        channelRef.current?.track(state);
      }, 1000);
      return () => clearInterval(updateInterval);
    }
  }, [roomState, myWpm, myAccuracy, myProgress, currentUser, startTime]);

  const handleCreateRoom = () => {
    if (!currentUser) return;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const randomText = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
    setHostId(currentUser.id);
    setRaceText(randomText);
    setWords(randomText.split(' '));
    setRoomCode(code);
    // roomState will change to 'waiting' in useEffect after subscription
  };

  const handleJoinRoom = () => {
    if (!currentUser || joinCodeInput.length < 6) return;
    setRoomCode(joinCodeInput);
    // roomState will change to 'waiting' in useEffect after subscription
  };

  const handleStartRace = () => {
    if (channelRef.current && hostId === currentUser?.id) {
      let count = 3;
      
      const tick = () => {
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'countdown',
            payload: { count }
          });
          setRoomState('countdown');
          setCountdown(count);
          
          if (count > 0) {
            count--;
            setTimeout(tick, 1000);
          } else {
            channelRef.current.send({
              type: 'broadcast',
              event: 'start_race',
              payload: {}
            });
            setRoomState('racing');
            setStartTime(Date.now());
            if (inputRef.current) inputRef.current.focus();
          }
        }
      };
      
      tick();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (roomState !== 'racing') return;
    
    const val = e.target.value;
    totalKeystrokesRef.current += 1;
    
    if (val.endsWith(' ')) {
      const wordTyped = val.trim();
      const expectedWord = words[currentWordIndex];
      
      if (wordTyped === expectedWord) {
        correctKeystrokesRef.current += expectedWord.length + 1; // +1 for space
      } else {
        incorrectKeystrokesRef.current += Math.max(wordTyped.length, expectedWord.length);
      }
      
      const newTypedWords = [...typedWords];
      newTypedWords[currentWordIndex] = wordTyped;
      
      setTypedWords([...newTypedWords, '']);
      setCurrentWordIndex(prev => prev + 1);
      setInputVal('');
      
      const progress = Math.min(100, Math.round(((currentWordIndex + 1) / words.length) * 100));
      setMyProgress(progress);
      
      if (startTime) {
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const wpmCount = Math.round((correctKeystrokesRef.current / 5) / elapsedMinutes);
        setMyWpm(wpmCount);
        
        const accuracy = Math.round((correctKeystrokesRef.current / (correctKeystrokesRef.current + incorrectKeystrokesRef.current)) * 100) || 100;
        setMyAccuracy(accuracy);
      }
      
      if (currentWordIndex + 1 >= words.length) {
        setRoomState('finished');
        const finishTime = Date.now();
        setEndTime(finishTime);
        
        if (channelRef.current && currentUser) {
          const finalState: PlayerState = {
            id: currentUser.id,
            name: currentUser.name,
            wpm: myWpm,
            accuracy: myAccuracy,
            progress: 100,
            correctChars: correctKeystrokesRef.current,
            incorrectChars: incorrectKeystrokesRef.current,
            status: 'finished',
            finishTime: finishTime
          };
          channelRef.current.track(finalState);
        }
      }
    } else {
      const newTypedWords = [...typedWords];
      newTypedWords[currentWordIndex] = val;
      setTypedWords(newTypedWords);
      setInputVal(val);
    }
  };

  const handlePlayAgain = () => {
    if (channelRef.current && currentUser && hostId === currentUser.id) {
      const randomText = PASSAGES[Math.floor(Math.random() * PASSAGES.length)];
      setRaceText(randomText);
      setWords(randomText.split(' '));
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'room_info',
        payload: { hostId, raceText: randomText }
      });
      
      channelRef.current.send({
        type: 'broadcast',
        event: 'reset_race',
        payload: {}
      });
      
      // Also apply locally
      setTypedWords(['']);
      setCurrentWordIndex(0);
      setInputVal('');
      setMyWpm(0);
      setMyAccuracy(100);
      setMyProgress(0);
      setStartTime(null);
      setEndTime(null);
      setElapsedTime(0);
      totalKeystrokesRef.current = 0;
      correctKeystrokesRef.current = 0;
      incorrectKeystrokesRef.current = 0;
      
      setRoomState('waiting');
      
      channelRef.current.track({
        id: currentUser.id,
        name: currentUser.name,
        wpm: 0,
        accuracy: 100,
        progress: 0,
        correctChars: 0,
        incorrectChars: 0,
        status: 'waiting'
      });
    }
  };

  const sortedPlayers = (Object.values(players) as PlayerState[]).sort((a, b) => {
    if (a.status === 'finished' && b.status === 'finished') {
      return (a.finishTime || Number.MAX_SAFE_INTEGER) - (b.finishTime || Number.MAX_SAFE_INTEGER);
    }
    if (a.status === 'finished') return -1;
    if (b.status === 'finished') return 1;
    return b.progress - a.progress;
  });

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
              onClick={handleCreateRoom}
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
              onClick={handleJoinRoom}
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
        
        {roomState === 'waiting' && currentUser?.id === hostId && (
          <button onClick={handleStartRace} className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Start Race Now
          </button>
        )}
        {roomState === 'waiting' && currentUser?.id !== hostId && (
          <div className="px-6 py-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-cyan-500" />
            Waiting for host to start...
          </div>
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
                <div key={p.id} className="relative h-14 bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700/50">
                  <div 
                    className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-out flex items-center justify-end px-3
                      ${p.id === currentUser?.id ? 'bg-gradient-to-r from-amber-500/20 to-amber-500/80 border-r-2 border-amber-400' : 'bg-gradient-to-r from-cyan-500/20 to-cyan-500/80 border-r-2 border-cyan-400'}
                      ${p.status === 'finished' ? 'opacity-80' : ''}
                    `}
                    style={{ width: `${Math.max(5, p.progress)}%` }}
                  >
                    <span className="text-xs font-black text-slate-950 shadow-sm bg-white/90 px-2 py-0.5 rounded">
                      {p.wpm} WPM
                    </span>
                  </div>
                  <div className="absolute top-0 left-0 w-full h-full flex items-center px-4 pointer-events-none justify-between">
                    <span className="font-bold text-sm text-white drop-shadow-md z-10 flex items-center gap-2">
                      {p.name} {p.id === currentUser?.id && '(You)'}
                      {p.id === hostId && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                    </span>
                    {p.status === 'finished' && (
                      <span className="font-bold text-amber-400 drop-shadow-md z-10 text-sm italic">
                        #{idx + 1} Finish
                      </span>
                    )}
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
                <h3 className="text-xl font-bold text-slate-200">Waiting in Lobby</h3>
                <p className="text-slate-400">Get ready to race. {hostId === currentUser?.id ? 'Start when everyone is here.' : 'Waiting for the host to begin.'}</p>
              </div>
            )}

            {roomState === 'countdown' && (
              <div className="py-12 text-center space-y-2">
                <div className="text-6xl font-black text-amber-500 animate-pulse">
                  {countdown > 0 ? countdown : 'GO!'}
                </div>
                <p className="text-xl font-bold text-slate-300">Get Ready!</p>
              </div>
            )}

            {(roomState === 'racing' || roomState === 'finished') && (
              <>
                <div className="flex items-center justify-between text-sm font-mono text-slate-400 border-b border-slate-800 pb-4">
                  <div className="flex gap-6">
                    <div>
                      <span className="text-slate-500 mr-2">WPM</span>
                      <span className="text-xl font-bold text-cyan-400">{myWpm}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 mr-2">ACC</span>
                      <span className="text-xl font-bold text-amber-400">{myAccuracy}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500 mr-2">TIME</span>
                    <span className="text-xl font-bold text-slate-200">
                      {roomState === 'finished' ? (startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0) : elapsedTime}s
                    </span>
                  </div>
                </div>

                {roomState === 'finished' ? (
                   <div className="py-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                     <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-500 mx-auto">
                       <Trophy className="w-10 h-10" />
                     </div>
                     <div>
                       <h2 className="text-3xl font-black text-slate-100">Race Finished!</h2>
                       <p className="text-slate-400 mt-2">You completed the passage.</p>
                     </div>
                     <div className="flex justify-center gap-6 sm:gap-8 flex-wrap">
                       <div className="text-center">
                         <div className="text-3xl font-bold text-cyan-400">{myWpm}</div>
                         <div className="text-xs font-mono text-slate-500 mt-1">WPM</div>
                       </div>
                       <div className="text-center">
                         <div className="text-3xl font-bold text-amber-400">{myAccuracy}%</div>
                         <div className="text-xs font-mono text-slate-500 mt-1">ACCURACY</div>
                       </div>
                       <div className="text-center">
                         <div className="text-3xl font-bold text-emerald-400">{correctKeystrokesRef.current}</div>
                         <div className="text-xs font-mono text-slate-500 mt-1">CORRECT</div>
                       </div>
                       <div className="text-center">
                         <div className="text-3xl font-bold text-rose-400">{incorrectKeystrokesRef.current}</div>
                         <div className="text-xs font-mono text-slate-500 mt-1">INCORRECT</div>
                       </div>
                       <div className="text-center">
                         <div className="text-3xl font-bold text-slate-200">{startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0}s</div>
                         <div className="text-xs font-mono text-slate-500 mt-1">TIME</div>
                       </div>
                     </div>
                     
                     <div className="pt-6 border-t border-slate-800">
                        {hostId === currentUser?.id ? (
                          <button 
                            onClick={handlePlayAgain}
                            className="px-8 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-colors"
                          >
                            Play Again (Back to Lobby)
                          </button>
                        ) : (
                          <p className="text-sm text-slate-400 italic">Waiting for host to restart the race...</p>
                        )}
                     </div>
                   </div>
                ) : (
                  <>
                    <div className="text-lg sm:text-xl leading-relaxed text-slate-400 font-medium select-none p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono tracking-wide">
                      {words.map((word, wIdx) => {
                        const typed = typedWords[wIdx];
                        let wordClass = '';
                        
                        if (wIdx < currentWordIndex) {
                          wordClass = typed === word ? 'text-emerald-400' : 'text-rose-400 underline decoration-rose-500/50';
                        } else if (wIdx === currentWordIndex) {
                          wordClass = 'text-slate-100 bg-slate-800 rounded px-1 -mx-1';
                        }

                        return (
                          <span key={wIdx} className={`${wordClass} mr-2 inline-block`}>
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
                        placeholder={roomState === 'racing' ? 'Type the text above...' : 'Wait...'}
                        className="w-full bg-slate-950 border-2 border-slate-700 rounded-xl px-5 py-4 text-xl text-slate-100 font-mono focus:outline-none focus:border-amber-500 disabled:opacity-50"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between mb-4">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4" /> Players ({Object.keys(players).length})
              </span>
            </h3>
            <div className="space-y-3">
              {sortedPlayers.map((p, idx) => (
                <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${p.id === currentUser?.id ? 'bg-amber-500/10 border-amber-500/30' : 'bg-slate-800/50 border-slate-700/50'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 relative">
                      {p.name.charAt(0)}
                      {p.id === hostId && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                          <Crown className="w-2.5 h-2.5 text-slate-950" />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-slate-200 text-sm">{p.name} {p.id === currentUser?.id && '(You)'}</div>
                      <div className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-2">
                        <span>{p.status}</span>
                        {p.status === 'finished' && <span>| #{idx + 1}</span>}
                      </div>
                    </div>
                  </div>
                  {p.status === 'finished' ? (
                    <Trophy className="w-4 h-4 text-amber-500" />
                  ) : p.status === 'racing' ? (
                    <div className="text-xs font-bold text-cyan-400">{p.wpm} <span className="text-[10px] text-slate-500">WPM</span></div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
