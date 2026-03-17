/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Music, Trophy, Gamepad2, RefreshCw, Terminal, Activity, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- SYSTEM_TYPES ---
interface Point {
  x: number;
  y: number;
}

interface Track {
  id: number;
  title: string;
  artist: string;
  url: string;
  color: string;
}

// --- CORE_CONSTANTS ---
const GRID_SIZE = 20;
const INITIAL_SNAKE: Point[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };
const GAME_SPEED = 120;

const TRACKS: Track[] = [
  {
    id: 1,
    title: "SYNTH_VOID_01",
    artist: "NULL_POINTER",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    color: "#0ff",
  },
  {
    id: 2,
    title: "NEON_GLITCH_02",
    artist: "BUFFER_OVERFLOW",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    color: "#f0f",
  },
  {
    id: 3,
    title: "GRID_PULSE_03",
    artist: "KERNEL_PANIC",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    color: "#0f0",
  },
];

export default function App() {
  // --- AUDIO_SUBSYSTEM ---
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- GRID_SUBSYSTEM ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);

  const currentTrack = TRACKS[currentTrackIndex];

  // --- AUDIO_INTERRUPT_HANDLERS ---
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("SIGNAL_FAILURE", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  const skipTrack = (dir: 'next' | 'prev') => {
    let nextIndex = currentTrackIndex + (dir === 'next' ? 1 : -1);
    if (nextIndex >= TRACKS.length) nextIndex = 0;
    if (nextIndex < 0) nextIndex = TRACKS.length - 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("SIGNAL_FAILURE", e));
      }
    }
  }, [currentTrackIndex]);

  // --- GRID_LOGIC_ENGINE ---
  const generateFood = useCallback((currentSnake: Point[]) => {
    let newFood: Point;
    while (true) {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      if (!currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y)) {
        break;
      }
    }
    return newFood;
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setFood({ x: 5, y: 5 });
    setScore(0);
    setGameOver(false);
    setGameStarted(true);
  };

  const moveSnake = useCallback(() => {
    if (gameOver || !gameStarted) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      const newHead = {
        x: (head.x + direction.x + GRID_SIZE) % GRID_SIZE,
        y: (head.y + direction.y + GRID_SIZE) % GRID_SIZE,
      };

      if (prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        setGameOver(true);
        if (score > highScore) setHighScore(score);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood(newSnake));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, gameStarted, generateFood, score, highScore]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          if (direction.y === 0) setDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
          if (direction.y === 0) setDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
          if (direction.x === 0) setDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
          if (direction.x === 0) setDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  useEffect(() => {
    const interval = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(interval);
  }, [moveSnake]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 crt-flicker relative overflow-hidden">
      {/* SCANLINE_OVERLAY */}
      <div className="scanline" />
      
      {/* BACKGROUND_STATIC */}
      <div className="fixed inset-0 pointer-events-none opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* LEFT_TERMINAL: AUDIO_STATUS */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-4"
        >
          <div className="p-4 border-2 border-[#0ff] bg-black/80 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <div className="flex items-center gap-2 mb-4 border-b border-[#0ff]/30 pb-2">
              <Terminal size={16} className="text-[#f0f]" />
              <h2 className="text-xs font-bold tracking-[0.2em] glitch-text uppercase">Audio_Stream</h2>
            </div>

            <div className="space-y-4">
              <div className="aspect-square border border-[#0ff]/50 bg-[#111] flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,#0ff_3px)]" />
                
                <motion.div 
                  animate={{ 
                    scale: isPlaying ? [1, 1.05, 1] : 1,
                    rotate: isPlaying ? [0, 1, -1, 0] : 0
                  }}
                  transition={{ duration: 0.2, repeat: Infinity }}
                  className="relative z-10"
                >
                  <Music size={64} className="text-[#f0f] drop-shadow-[0_0_10px_#f0f]" />
                </motion.div>

                <div className="absolute bottom-2 left-2 right-2 flex items-end gap-0.5 h-12 opacity-50">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: isPlaying ? `${Math.random() * 100}%` : '10%' }}
                      transition={{ duration: 0.1, repeat: Infinity }}
                      className="flex-1 bg-[#0ff]"
                    />
                  ))}
                </div>
              </div>

              <div className="font-mono text-[10px] space-y-1">
                <div className="flex justify-between"><span className="text-[#f0f]">FILE:</span> <span className="truncate">{currentTrack.title}</span></div>
                <div className="flex justify-between"><span className="text-[#f0f]">SRC:</span> <span className="truncate">{currentTrack.artist}</span></div>
                <div className="flex justify-between"><span className="text-[#f0f]">BITRATE:</span> <span>320KBPS</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 border-2 border-[#f0f] bg-black/80 shadow-[0_0_15px_rgba(255,0,255,0.3)]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#0ff] mb-2">Playlist_Queue</div>
            <div className="space-y-1 font-mono text-[10px]">
              {TRACKS.map((track, idx) => (
                <button
                  key={track.id}
                  onClick={() => {
                    setCurrentTrackIndex(idx);
                    setIsPlaying(true);
                  }}
                  className={`w-full flex items-center gap-2 p-1 transition-all border ${
                    currentTrackIndex === idx ? 'border-[#0ff] bg-[#0ff]/10 text-[#0ff]' : 'border-transparent hover:border-[#f0f]/50 text-white/40'
                  }`}
                >
                  <span>[{idx}]</span>
                  <span className="truncate">{track.title}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* CENTER_GRID: EXECUTION_ENVIRONMENT */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-6 flex flex-col items-center gap-4"
        >
          <div className="w-full flex justify-between px-4 font-mono text-xs">
            <div className="flex flex-col">
              <span className="text-[#f0f] glitch-text">SCORE_VAL</span>
              <span className="text-xl text-[#0ff]">{String(score).padStart(6, '0')}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[#f0f] glitch-text">MAX_RECORD</span>
              <span className="text-xl text-[#0ff]">{String(highScore).padStart(6, '0')}</span>
            </div>
          </div>

          <div className="relative p-2 border-4 border-[#0ff] bg-[#000] shadow-[0_0_30px_rgba(0,255,255,0.2)]">
            <div 
              className="relative overflow-hidden"
              style={{ 
                width: 'min(85vw, 440px)', 
                height: 'min(85vw, 440px)',
                display: 'grid',
                gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
                gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`,
              }}
            >
              {/* GRID_LINES */}
              <div className="absolute inset-0 grid grid-cols-20 grid-rows-20 opacity-20 pointer-events-none">
                {[...Array(GRID_SIZE * GRID_SIZE)].map((_, i) => (
                  <div key={i} className="border-[0.5px] border-[#0ff]/30" />
                ))}
              </div>

              {/* SNAKE_ENTITIES */}
              {snake.map((segment, i) => (
                <div
                  key={`${i}-${segment.x}-${segment.y}`}
                  className="absolute"
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    backgroundColor: i === 0 ? '#f0f' : '#0ff',
                    boxShadow: i === 0 ? '0 0 10px #f0f' : 'none',
                    clipPath: 'polygon(10% 0, 90% 0, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0 90%, 0 10%)',
                    zIndex: 10,
                  }}
                />
              ))}

              {/* FOOD_ENTITY */}
              <motion.div
                animate={{ 
                  opacity: [1, 0.5, 1],
                  scale: [1, 1.2, 1],
                  rotate: [0, 90, 180, 270, 360]
                }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bg-[#ffff00] shadow-[0_0_15px_#ffff00]"
                style={{
                  width: `${100 / GRID_SIZE}%`,
                  height: `${100 / GRID_SIZE}%`,
                  left: `${(food.x / GRID_SIZE) * 100}%`,
                  top: `${(food.y / GRID_SIZE) * 100}%`,
                  clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
                  zIndex: 5,
                }}
              />

              {/* ERROR_OVERLAY: GAME_OVER */}
              <AnimatePresence>
                {gameOver && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 bg-[#f00]/20 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="p-8 border-4 border-[#f0f] bg-black space-y-6 shadow-[0_0_50px_rgba(255,0,255,0.5)]">
                      <h2 className="text-3xl font-black text-[#f0f] glitch-text tracking-tighter">FATAL_ERROR</h2>
                      <p className="text-[#0ff] font-mono text-[10px] uppercase tracking-widest">System Integrity Compromised</p>
                      <div className="font-mono text-2xl text-white">
                        FINAL_SCORE: {score}
                      </div>
                      <button 
                        onClick={resetGame}
                        className="w-full py-3 border-2 border-[#0ff] text-[#0ff] font-bold hover:bg-[#0ff] hover:text-black transition-all uppercase tracking-widest text-xs"
                      >
                        REBOOT_SYSTEM
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* INIT_OVERLAY: START */}
              {!gameStarted && !gameOver && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                  <div className="space-y-8">
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="text-[#0ff]"
                    >
                      <Cpu size={64} />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-[#f0f] glitch-text">INITIALIZE_GRID</h2>
                    <button 
                      onClick={resetGame}
                      className="px-10 py-4 border-2 border-[#0ff] text-[#0ff] font-black hover:bg-[#0ff] hover:text-black shadow-[0_0_20px_rgba(0,255,255,0.3)] transition-all uppercase tracking-widest"
                    >
                      EXECUTE
                    </button>
                    <div className="text-[8px] text-[#0ff]/40 uppercase tracking-[0.4em]">Input: Arrow_Keys_Required</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* RIGHT_TERMINAL: SYSTEM_CONTROLS */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 space-y-4"
        >
          <div className="p-4 border-2 border-[#0ff] bg-black/80 shadow-[0_0_15px_rgba(0,255,255,0.3)]">
            <div className="flex items-center gap-2 mb-6 border-b border-[#0ff]/30 pb-2">
              <Activity size={16} className="text-[#f0f]" />
              <h2 className="text-xs font-bold tracking-[0.2em] glitch-text uppercase">System_IO</h2>
            </div>

            <div className="flex flex-col items-center gap-6">
              <div className="grid grid-cols-3 gap-2 w-full">
                <button 
                  onClick={() => skipTrack('prev')}
                  className="p-2 border border-[#0ff]/50 text-[#0ff] hover:bg-[#0ff]/20 flex items-center justify-center"
                >
                  <SkipBack size={16} />
                </button>
                
                <button 
                  onClick={togglePlay}
                  className="p-2 border-2 border-[#f0f] text-[#f0f] hover:bg-[#f0f]/20 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,255,0.2)]"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>

                <button 
                  onClick={() => skipTrack('next')}
                  className="p-2 border border-[#0ff]/50 text-[#0ff] hover:bg-[#0ff]/20 flex items-center justify-center"
                >
                  <SkipForward size={16} />
                </button>
              </div>

              <div className="w-full space-y-1">
                <div className="flex justify-between text-[8px] text-[#0ff]/60 uppercase font-bold tracking-widest">
                  <span>Buffer_Load</span>
                  <span>100%</span>
                </div>
                <div className="h-1 w-full bg-[#111] border border-[#0ff]/20 overflow-hidden">
                  <motion.div 
                    animate={{ width: isPlaying ? '100%' : '0%' }}
                    transition={{ duration: 180, ease: "linear" }}
                    className="h-full bg-[#f0f]" 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-2 border-[#f0f] bg-black/80 shadow-[0_0_15px_rgba(255,0,255,0.3)]">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#0ff] mb-4">Hardware_Status</div>
            <div className="space-y-3 font-mono text-[9px]">
              <div className="flex justify-between"><span>CPU_TEMP:</span> <span className="text-[#f0f]">42°C</span></div>
              <div className="flex justify-between"><span>MEM_USAGE:</span> <span className="text-[#f0f]">1.2GB</span></div>
              <div className="flex justify-between"><span>NET_LINK:</span> <span className="text-[#0f0]">ACTIVE</span></div>
              <div className="flex justify-between"><span>OS_VER:</span> <span className="text-[#f0f]">GLITCH_OS_v4.2</span></div>
            </div>
          </div>
        </motion.div>
      </div>

      <audio 
        ref={audioRef} 
        onEnded={() => skipTrack('next')}
        className="hidden"
      />

      {/* SYSTEM_FOOTER */}
      <div className="mt-8 text-center space-y-1 opacity-40 font-mono">
        <p className="text-[8px] uppercase tracking-[0.5em] text-[#0ff] glitch-text">TERMINAL_ID: {Math.random().toString(36).substring(7).toUpperCase()}</p>
        <p className="text-[6px] text-white/40">WARNING: UNAUTHORIZED ACCESS TO THE GRID IS PROHIBITED</p>
      </div>
    </div>
  );
}
