import React, { useState, useEffect, useCallback } from 'react';
import { audio } from './audio';
import { IntroSequence } from './Intro';
import { TitleScreen } from './TitleScreen';

type GameState = 'title' | 'intro' | 'playing' | 'jumpscare' | 'night_clear' | 'game_over' | 'win';

const CAMERAS = [1, 2, 3, 4, 5, 6, 7, 8];

// 1 in-game hour = 2 minutes IRL = 120 seconds.
// Time increments by 1/120th of an hour every second.
const TIME_INCREMENT = 1 / 120; 

export default function App() {
  const [gameState, setGameState] = useState<GameState>('title');
  const [savedNight, setSavedNight] = useState<number | null>(null);
  
  const [night, setNight] = useState(1);
  const [time, setTime] = useState(0); // 0 = 12AM, 6 = 6AM
  const [power, setPower] = useState(100);
  
  const [leftDoor, setLeftDoor] = useState(false); // false = open
  const [rightDoor, setRightDoor] = useState(false);
  const [cctvOn, setCctvOn] = useState(false);
  const [currentCam, setCurrentCam] = useState(1);
  
  const [triangle, setTriangle] = useState({ active: true, distance: 5, side: 'left', cam: 3 });
  const [circle, setCircle] = useState({ active: false, distance: 5, side: 'right', cam: 4 });
  
  const [jumpscareBy, setJumpscareBy] = useState('');
  const [isSwitching, setIsSwitching] = useState(false);

  const [phoneState, setPhoneState] = useState<'idle' | 'ringing' | 'talking'>('idle');
  const [phoneMessage, setPhoneMessage] = useState('');

  const PHONE_MESSAGES = [
    "VOICE: You are doing well. Good Job.",
    "VOICE: The experiment is proceeding as expected.",
    "VOICE: Don't let them in. We need more data.",
    "VOICE: Fascinating... your heart rate is elevated.",
    "VOICE: Just a few more hours. Survive.",
    "VOICE: We are monitoring your every move.",
    "VOICE: The subjects are getting restless.",
    "VOICE: Subject 42 showed similar resilience... before the incident.",
    "VOICE: Note: Fear response is optimal. Keep the cameras active.",
    "VOICE: Do not attempt to leave the observation area.",
    "VOICE: The shapes are drawn to your vital signs.",
    "VOICE: We adjusted the gas mixture. Let's see how you adapt.",
    "VOICE: Your predecessor lasted until 4 AM. Try to beat that.",
    "VOICE: The facility is sealed. There is no rescue, only the test."
  ];

  // Night 5 dodging mechanics
  const isNight5Dodging = night === 5 && time >= 3 && time < 5;
  const [playerPos, setPlayerPos] = useState({ x: 15, y: 15 }); // 30x30 grid
  const [enemyProjectiles, setEnemyProjectiles] = useState<{x: number, y: number, dx: number, dy: number, type: string}[]>([]);
  const [playerHealth, setPlayerHealth] = useState(3);

  const [glitchEnabled, setGlitchEnabled] = useState(true);
  const [inventory, setInventory] = useState<string[]>([]);
  const [showInventory, setShowInventory] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowInventory(prev => !prev);
        audio.playClick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const save = localStorage.getItem('twisted_games_save');
    if (save) {
      setSavedNight(parseInt(save, 10));
    }
    const glitchSetting = localStorage.getItem('twisted_glitch');
    if (glitchSetting !== null) {
      setGlitchEnabled(glitchSetting === 'true');
    }
    audio.loadSettings();
  }, []);

  const handleSetGlitchEnabled = (val: boolean) => {
    setGlitchEnabled(val);
    localStorage.setItem('twisted_glitch', val.toString());
  };

  const saveGame = useCallback((n: number) => {
    localStorage.setItem('twisted_games_save', n.toString());
    setSavedNight(n);
  }, []);

  const switchCamera = useCallback((cam: number) => {
    if (cam === currentCam) return;
    audio.playStatic();
    setIsSwitching(true);
    setCurrentCam(cam);
    setTimeout(() => setIsSwitching(false), 200);
  }, [currentCam]);

  const getUsage = () => {
    let u = 1;
    if (leftDoor) u += 1;
    if (rightDoor) u += 1;
    if (cctvOn) u += 1;
    return u;
  };

  // Ambient Sounds
  useEffect(() => {
    if (gameState !== 'playing') return;
    
    const ambientInterval = setInterval(() => {
      // Wind intensity increases with night and time
      const intensity = Math.min(1, (night * 0.1) + (time * 0.1));
      
      if (cctvOn) {
        // When CCTV is on, play muffled underground sounds
        if (Math.random() < 0.2) {
          audio.playHeavyWind(intensity);
        }
        if (Math.random() < 0.1) {
          audio.playThunder();
        }
      } else {
        // Normal room ambiance
        if (Math.random() < 0.3) {
          audio.playAmbientWind(intensity);
        }
        if (Math.random() < 0.15) {
          audio.playCreak();
        }
      }
    }, 5000);
    
    return () => clearInterval(ambientInterval);
  }, [gameState, night, time, cctvOn]);

  // Game Loop
  useEffect(() => {
    if (gameState === 'title') {
      // Try to play title music if audio context is initialized
      // (Browsers might block this until first interaction, but we try)
      if (audio.ctx && audio.ctx.state === 'running') {
        audio.playTitleMusic();
      }
    } else {
      audio.stopTitleMusic();
    }

    if (gameState !== 'playing') {
      audio.stopHum();
      return;
    }
    
    if (power > 0 && !isNight5Dodging) {
      audio.startHum();
    } else {
      audio.stopHum();
    }
    
    const timer = setInterval(() => {
      setTime(t => {
        const newTime = t + TIME_INCREMENT;
        if (newTime >= 6) {
          setGameState('night_clear');
          audio.stopHum();
          audio.playBell();
          return 6;
        }
        return newTime;
      });

      if (isNight5Dodging) {
        // Force doors open and CCTV off
        setLeftDoor(false);
        setRightDoor(false);
        setCctvOn(false);

        // Move projectiles
        setEnemyProjectiles(projs => {
          return projs.map(p => ({ x: p.x + p.dx, y: p.y + p.dy }))
            .filter(p => p.x >= 0 && p.x < 30 && p.y >= 0 && p.y < 30);
        });

        // Spawn new projectiles
        if (Math.random() < 0.3) {
          setEnemyProjectiles(projs => [
            ...projs,
            {
              x: Math.random() > 0.5 ? 0 : 29,
              y: Math.floor(Math.random() * 30),
              dx: Math.random() > 0.5 ? 1 : -1,
              dy: (Math.random() - 0.5) * 0.5,
              type: Math.random() > 0.5 ? 'TRIANGLE' : 'CIRCLE'
            }
          ]);
        }
        return; // Skip normal mechanics during dodging
      }
      
      setPower(p => {
        if (p <= 0) return 0;
        const usage = getUsage();
        // Adjust drain rate for the 12-minute night
        // 100 power over 12 minutes (720 seconds) = ~0.14 per second base
        const drain = usage * 0.05; 
        const newPower = p - drain;
        if (newPower <= 0) {
          setLeftDoor(false);
          setRightDoor(false);
          setCctvOn(false);
          return 0;
        }
        return newPower;
      });
      
      const moveEnemy = (enemy: any, setEnemy: any, name: string) => {
        if (!enemy.active) return;
        
        // Adjust move chance for the longer night
        const moveChance = 0.05 + (night * 0.01);
        if (Math.random() < moveChance) {
          setEnemy((prev: any) => {
            const newDist = prev.distance - 1;
            let newCam = prev.cam;
            
            if (name === 'TRIANGLE') {
              if (newDist === 5) newCam = 7;
              if (newDist === 4) newCam = 5;
              if (newDist === 3) newCam = 1;
              if (newDist === 2) newCam = 2;
              if (newDist === 1) newCam = 2;
            } else if (name === 'CIRCLE') {
              if (newDist === 5) newCam = 8;
              if (newDist === 4) newCam = 6;
              if (newDist === 3) newCam = 4;
              if (newDist === 2) newCam = 3;
              if (newDist === 1) newCam = 3;
            }

            if (newDist === 0) {
              audio.playEnemyMove(newDist);
              return { ...prev, distance: 0, cam: newCam };
            } else if (newDist < 0) {
              const doorClosed = prev.side === 'left' ? leftDoor : rightDoor;
              if (doorClosed) {
                audio.playEnemyMove(5);
                return { ...prev, distance: 5, side: prev.side, cam: prev.side === 'left' ? 7 : 8 };
              } else {
                setJumpscareBy(name);
                setGameState('jumpscare');
                audio.playJumpscare();
                return prev;
              }
            }
            audio.playEnemyMove(newDist);
            return { ...prev, distance: newDist, cam: newCam };
          });
        }
      };
      
      if (power > 0) {
        moveEnemy(triangle, setTriangle, 'TRIANGLE');
        if (night >= 2) {
          if (!circle.active) setCircle(c => ({ ...c, active: true }));
          moveEnemy(circle, setCircle, 'CIRCLE');
        }
        
        // Random phone ring
        setPhoneState(prev => {
          if (prev === 'idle' && Math.random() < 0.01 && !isNight5Dodging) {
            audio.playPhoneRing();
            return 'ringing';
          }
          return prev;
        });
      } else {
        if (Math.random() < 0.05) { // Lower chance due to longer night
           setJumpscareBy('TRIANGLE');
           setGameState('jumpscare');
           audio.playJumpscare();
        }
      }
      
    }, 1000);
    
    return () => clearInterval(timer);
  }, [gameState, leftDoor, rightDoor, cctvOn, night, power, triangle, circle, isNight5Dodging]);

  // Phone ringing interval
  useEffect(() => {
    let interval: any;
    let timeout: any;
    if (phoneState === 'ringing') {
      interval = setInterval(() => {
        audio.playPhoneRing();
      }, 3000);
      
      timeout = setTimeout(() => {
        setPhoneState('idle');
      }, 12000);
    }
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [phoneState]);

  // Collision detection for dodging
  useEffect(() => {
    if (!isNight5Dodging) return;

    const hit = enemyProjectiles.some(p => Math.abs(p.x - playerPos.x) < 1 && Math.abs(p.y - playerPos.y) < 1);
    if (hit) {
      setPlayerHealth(h => {
        const newHealth = h - 1;
        if (newHealth <= 0) {
          setJumpscareBy('BOTH');
          setGameState('jumpscare');
          audio.playJumpscare();
        } else {
          audio.playGlitch();
          // Clear projectiles to give a brief safe window
          setEnemyProjectiles([]);
        }
        return newHealth;
      });
    }
  }, [playerPos, enemyProjectiles, isNight5Dodging]);

  useEffect(() => {
    if (gameState === 'jumpscare') {
      const timer = setTimeout(() => {
        setGameState('game_over');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'title') {
        return;
      }
      if (gameState === 'night_clear') {
        if (e.key === ' ') {
          audio.playClick();
          if (night === 5) {
            setGameState('win');
          } else {
            const nextNight = night + 1;
            setNight(nextNight);
            saveGame(nextNight);
            startNight();
          }
        }
        return;
      }
      if (gameState === 'game_over') {
        if (e.key === ' ') {
          audio.playClick();
          setGameState('title');
          saveGame(night);
        }
        return;
      }
      if (gameState === 'win') {
        if (e.key === ' ') {
          audio.playClick();
          setGameState('title');
          setNight(1);
          saveGame(1);
        }
        return;
      }
      
      if (gameState === 'playing') {
        if (isNight5Dodging) {
          // Dodging controls
          setPlayerPos(pos => {
            let { x, y } = pos;
            let moved = false;
            if (e.key === 'w' || e.key === 'W') { y = Math.max(0, y - 1); moved = true; }
            if (e.key === 's' || e.key === 'S') { y = Math.min(29, y + 1); moved = true; }
            if (e.key === 'a' || e.key === 'A') { x = Math.max(0, x - 1); moved = true; }
            if (e.key === 'd' || e.key === 'D') { x = Math.min(29, x + 1); moved = true; }
            if (moved) audio.playFootstep();
            return { x, y };
          });
        } else if (power > 0) {
          // Normal controls
          if (e.key === 'a' || e.key === 'A') {
            setLeftDoor(d => {
              audio.playDoor(!d);
              return !d;
            });
          }
          if (e.key === 'd' || e.key === 'D') {
            setRightDoor(d => {
              audio.playDoor(!d);
              return !d;
            });
          }
          if (e.key === 'c' || e.key === 'C') {
            setCctvOn(c => {
              audio.playStatic();
              return !c;
            });
          }
          
          if (cctvOn) {
            if (e.key >= '1' && e.key <= '8') {
              switchCamera(parseInt(e.key));
            }
          }
          
          if (e.key === 'p' || e.key === 'P') {
            setPhoneState(prev => {
              if (prev === 'ringing') {
                setPhoneMessage(PHONE_MESSAGES[Math.floor(Math.random() * PHONE_MESSAGES.length)]);
                setTimeout(() => setPhoneState('idle'), 4000);
                return 'talking';
              }
              return prev;
            });
          }
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, cctvOn, power, night, isNight5Dodging, saveGame, switchCamera]);

  const startNight = () => {
    setTime(0);
    setPower(100);
    setLeftDoor(false);
    setRightDoor(false);
    setCctvOn(false);
    setTriangle({ active: true, distance: 5, side: 'left', cam: 7 });
    setCircle({ active: night >= 2, distance: 5, side: 'right', cam: 8 });
    setPlayerHealth(3);
    setEnemyProjectiles([]);
    setPhoneState('idle');
    setGameState('playing');
  };

  const renderTime = () => {
    const hour = Math.floor(time);
    const displayHour = hour === 0 ? 12 : hour;
    const minutes = Math.floor((time % 1) * 60);
    return `${displayHour}:${minutes.toString().padStart(2, '0')} AM`;
  };

  const renderUsage = () => {
    const usage = getUsage();
    return (
      <div className="flex items-center gap-2">
        <span>USAGE:</span>
        <span className="font-bold tracking-widest">
          {'='.repeat(usage)}
        </span>
      </div>
    );
  };

  // Camera Alert Effect
  useEffect(() => {
    if (gameState === 'playing' && cctvOn && power > 0 && !isNight5Dodging) {
      const hasEnemy = (triangle.active && triangle.cam === currentCam) || (circle.active && circle.cam === currentCam);
      if (hasEnemy) {
        audio.playCameraAlert();
      }
    }
  }, [currentCam, triangle.cam, circle.cam, cctvOn, power, gameState, isNight5Dodging, triangle.active, circle.active]);

  const renderCCTV = () => {
    let view = `CAM ${currentCam}\n\n`;
    
    let hasEnemy = false;
    const isAudioOnly = currentCam === 7 || currentCam === 8;

    if (isSwitching) {
      view = `\n\n    [ SIGNAL LOST ]\n    [ RECONNECTING... ]\n\n`;
    } else if (isAudioOnly) {
      view += `\n\n    [ AUDIO ONLY ]\n    [   STATIC   ]\n\n`;
      if ((triangle.active && triangle.cam === currentCam) || (circle.active && circle.cam === currentCam)) {
        view += `\n  ! MOTION DETECTED !\n`;
        hasEnemy = true;
      }
    } else {
      if (triangle.active && triangle.distance > 0 && triangle.cam === currentCam) {
        view += `        /\\\n       /__\\\n`;
        hasEnemy = true;
      }
      if (circle.active && circle.distance > 0 && circle.cam === currentCam) {
        view += `        OO\n       OOOO\n        OO\n`;
        hasEnemy = true;
      }
    }
    
    if (!hasEnemy && !isAudioOnly && !isSwitching) {
      view += `\n\n    [ STATIC ]\n\n`;
    }

    const MapButton = ({ cam, top, left, right }: { cam: number, top: string, left?: string, right?: string }) => (
      <button 
        onClick={() => switchCamera(cam)}
        className={`absolute px-2 py-1 text-xs font-bold border transition-colors z-20 ${currentCam === cam ? 'bg-green-500 text-black border-green-500' : 'bg-black text-green-500 border-green-500/50 hover:border-green-500 hover:bg-green-500/20'}`}
        style={{ top, left, right }}
      >
        CAM {cam}
      </button>
    );
    
    return (
      <div className="flex flex-col w-full h-full border border-green-500 p-4 relative overflow-hidden text-green-500">
        <div className="absolute top-4 left-4 right-8 z-10 pointer-events-none flex justify-between">
          <span>CCTV PANEL - ACTIVE</span>
          <span className="animate-pulse text-green-500">● REC</span>
        </div>
        
        <div className={`flex-grow flex items-center justify-center pr-[220px] whitespace-pre font-mono text-xl md:text-2xl relative transition-all duration-150 ${isSwitching ? 'opacity-50 blur-[2px] scale-95' : 'opacity-100 blur-0 scale-100'}`}>
          {view}
          {hasEnemy && !isSwitching && <div className="absolute top-12 right-[250px] text-green-500 animate-pulse text-xl">! ALERT !</div>}
        </div>

        {/* Overlapping Map on Bottom Right */}
        <div className="absolute bottom-12 right-4 w-[250px] aspect-[4/3] border border-green-500/20 bg-black/80 z-10">
          {/* Security Room */}
          <div className="absolute top-[30%] left-[40%] w-[20%] h-[20%] border border-green-500 bg-black flex items-center justify-center text-[10px] z-10 text-green-500">YOU</div>
          {/* Lobby */}
          <div className="absolute top-[60%] left-[35%] w-[30%] h-[30%] border border-green-500/50 flex items-center justify-center text-[10px] text-green-500/50">LOBBY</div>
          
          {/* Lines */}
          {/* Left path */}
          <div className="absolute top-[15%] left-[15%] w-[25%] border-t border-green-500/30" />
          <div className="absolute top-[15%] left-[15%] h-[30%] border-l border-green-500/30" />
          <div className="absolute top-[45%] left-[15%] w-[25%] border-t border-green-500/30" />
          <div className="absolute top-[45%] left-[15%] h-[30%] border-l border-green-500/30" />
          <div className="absolute top-[75%] left-[15%] w-[20%] border-t border-green-500/30" />
          
          {/* Right path */}
          <div className="absolute top-[15%] right-[15%] w-[25%] border-t border-green-500/30" />
          <div className="absolute top-[15%] right-[15%] h-[30%] border-r border-green-500/30" />
          <div className="absolute top-[45%] right-[15%] w-[25%] border-t border-green-500/30" />
          <div className="absolute top-[45%] right-[15%] h-[30%] border-r border-green-500/30" />
          <div className="absolute top-[75%] right-[15%] w-[20%] border-t border-green-500/30" />

          <MapButton cam={7} top="10%" left="5%" />
          <MapButton cam={5} top="40%" left="5%" />
          <MapButton cam={1} top="70%" left="5%" />
          <MapButton cam={2} top="70%" left="25%" />
          
          <MapButton cam={8} top="10%" right="5%" />
          <MapButton cam={6} top="40%" right="5%" />
          <MapButton cam={4} top="70%" right="5%" />
          <MapButton cam={3} top="70%" right="25%" />
          
          <div className="absolute -bottom-6 w-full text-[10px] text-green-500/50 text-center">
            * CAM 7 & 8 AUDIO ONLY
          </div>
        </div>

        <div className="absolute bottom-4 left-4 text-xs opacity-50">Press 1-8 to switch cameras</div>
      </div>
    );
  };

  const renderDodging = () => {
    const grid = Array(30).fill(null).map(() => Array(30).fill(' '));
    
    // Draw player
    grid[playerPos.y][playerPos.x] = 'O';

    // Draw projectiles
    enemyProjectiles.forEach(p => {
      const px = Math.floor(p.x);
      const py = Math.floor(p.y);
      if (px >= 0 && px < 30 && py >= 0 && py < 30) {
        grid[py][px] = p.type === 'TRIANGLE' ? '^' : 'o';
      }
    });

    const displayStr = grid.map(row => row.join('')).join('\n');

    return (
      <div className="flex flex-col items-center justify-center w-full h-full border border-red-500 p-4 relative">
        <div className="absolute top-4 left-4 text-red-500 animate-pulse">
          SYSTEM OVERRIDE
        </div>
        <div className="absolute top-4 right-4 text-red-500">
          HEALTH: {'♥'.repeat(playerHealth)}
        </div>
        
        <pre className="whitespace-pre font-mono text-sm leading-none tracking-widest text-red-500">
          {displayStr}
        </pre>
        
        <div className="absolute bottom-4 text-center w-full text-red-500">
          [W,A,S,D] to Dodge
        </div>
      </div>
    );
  };

  const renderRoom = () => {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full border border-green-500 p-4 relative text-green-500">
        <div className="absolute top-4 left-4">
          LEFT DOOR<br/>
          {leftDoor ? '[ CLOSED ]' : '[  OPEN  ]'}
        </div>
        <div className="absolute top-4 right-4 text-right">
          RIGHT DOOR<br/>
          {rightDoor ? '[ CLOSED ]' : '[  OPEN  ]'}
        </div>
        
        <div className="whitespace-pre font-mono text-2xl mt-10">
          {`   O   \n  /|\\  \n  / \\  `}
        </div>
        
        <div className="absolute bottom-20 left-4 animate-pulse">
          {triangle.distance === 0 && triangle.side === 'left' ? '! MOVEMENT LEFT !' : ''}
          {circle.distance === 0 && circle.side === 'left' ? '! MOVEMENT LEFT !' : ''}
        </div>
        <div className="absolute bottom-20 right-4 animate-pulse">
          {triangle.distance === 0 && triangle.side === 'right' ? '! MOVEMENT RIGHT !' : ''}
          {circle.distance === 0 && circle.side === 'right' ? '! MOVEMENT RIGHT !' : ''}
        </div>
        
        <div className="absolute bottom-24 text-center w-full text-green-400 font-bold">
          {phoneState === 'ringing' && "RING RING... [Press P to answer]"}
          {phoneState === 'talking' && phoneMessage}
        </div>

        <div className="absolute bottom-4 text-center w-full">
          [A] Toggle Left Door | [D] Toggle Right Door<br/>
          [C] Toggle CCTV
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center font-mono p-4 select-none">
      
      <div className="w-full max-w-4xl h-[600px] border border-green-500 flex flex-col relative overflow-hidden">
        {gameState === 'title' && (
          <TitleScreen 
            onNewGame={() => {
              setNight(1);
              saveGame(1);
              setGameState('intro');
            }}
            onContinue={() => {
              setNight(savedNight || 1);
              startNight();
            }}
            savedNight={savedNight}
            glitchEnabled={glitchEnabled}
            setGlitchEnabled={handleSetGlitchEnabled}
          />
        )}
        
        {gameState === 'intro' && (
          <IntroSequence 
            onComplete={startNight} 
            glitchEnabled={glitchEnabled} 
            onAddNote={(note) => setInventory(prev => [...prev, note])}
          />
        )}
        
        {gameState === 'playing' && (
          <div className="flex-grow flex flex-col p-4 text-green-500">
            <div className={`flex justify-between items-center border ${isNight5Dodging ? 'border-red-500 text-red-500' : 'border-green-500'} p-2 mb-4`}>
              <div>TIME: {renderTime()}</div>
              <div>NIGHT: {night}</div>
              <div className="flex flex-col items-end">
                <div className={`${power < 20 ? 'animate-pulse' : ''}`}>
                  POWER: {isNight5Dodging ? 'ERR' : `${Math.ceil(power)}%`}
                </div>
                {!isNight5Dodging && renderUsage()}
              </div>
            </div>
            
            <div className="flex-grow relative">
              {power <= 0 && !isNight5Dodging && <div className="absolute inset-0 bg-black z-10 opacity-90"></div>}
              {isNight5Dodging ? renderDodging() : (cctvOn && power > 0 ? renderCCTV() : renderRoom())}
            </div>
          </div>
        )}
        
        {gameState === 'jumpscare' && (
          <div className={`absolute inset-0 bg-black flex items-center justify-center z-50 ${glitchEnabled ? 'animate-pulse' : ''}`}>
            <div className={`text-9xl font-bold text-white animate-bounce ${glitchEnabled ? 'mix-blend-difference text-red-500' : ''}`}>
              {jumpscareBy === 'TRIANGLE' ? '/\\' : (jumpscareBy === 'CIRCLE' ? 'OO' : 'XXX')}
            </div>
          </div>
        )}
        
        {gameState === 'night_clear' && (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-green-500">
            <h2 className="text-4xl mb-4">6:00 AM</h2>
            <p className="text-xl mb-8">Night {night} Completed</p>
            <p className="animate-pulse">Press SPACE to continue</p>
          </div>
        )}
        
        {gameState === 'game_over' && (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-green-500">
            <h2 className="text-4xl mb-4">GAME OVER</h2>
            <p className="animate-pulse">Press SPACE to return to title</p>
          </div>
        )}
        
        {gameState === 'win' && (
          <div className="flex-grow flex flex-col items-center justify-center text-center text-green-500">
            <h2 className="text-4xl mb-4">A CHEQUE appears on screen.</h2>
            <p className="text-xl mb-8">And the credits roll.</p>
            <p className="animate-pulse">Press SPACE to return to title</p>
          </div>
        )}

        {gameState !== 'title' && (
          <div className="absolute bottom-12 left-8 text-green-500/50 text-xs z-40">
            [TAB] INVENTORY
          </div>
        )}

        {showInventory && (
          <div className="absolute inset-0 bg-black/95 z-[100] flex flex-col items-center justify-center p-8 border-4 border-green-500 font-mono">
            <h2 className="text-4xl font-bold text-green-500 mb-8 tracking-widest">INVENTORY</h2>
            <div className="flex flex-col gap-4 w-full max-w-2xl overflow-y-auto">
              {inventory.length === 0 ? (
                <p className="text-green-500/50 text-center">No items collected.</p>
              ) : (
                inventory.map((note, i) => (
                  <div key={i} className="border border-green-500/50 p-4 text-green-400 bg-green-900/20 leading-relaxed">
                    {note}
                  </div>
                ))
              )}
            </div>
            <div className="absolute bottom-4 text-green-500/50 animate-pulse">
              [Press TAB to close]
            </div>
          </div>
        )}
      </div>
      
    </div>
  );
}