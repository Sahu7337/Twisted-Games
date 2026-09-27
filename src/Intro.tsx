import React, { useState, useEffect } from 'react';
import { audio } from './audio';

const STICK = [
  " O ",
  "/|\\",
  "/ \\"
];

const DOOR_CLOSED = [
  "+---+",
  "|   |",
  "|  o|",
  "|   |",
  "+---+"
];

const DOOR_OPEN = [
  "+---+",
  "|    \\",
  "|     \\",
  "|      |",
  "+---+"
];

const FIGURE = [
  " O ",
  "/|\\",
  "/ \\"
];

const GUARDS = [
  " [G]   [G] ",
  " /|\\   /|\\ ",
  " / \\   / \\ "
];

const DESK = [
  "+-------+",
  "|   &   |",
  "+-------+",
  "  |   |  "
];

const PIPES = [
  "============================================================",
  "  ||                                                  ||    "
];

const getFan = (frame: number) => {
  const chars = ['|', '/', '-', '\\'];
  const c1 = chars[frame % 4];
  const c2 = chars[(frame + 2) % 4];
  return [
    ` ${c1} `,
    `-O-`,
    ` ${c2} `
  ];
};

const TEXTS = [
  "DARK ROOM, TIME - UNKNOWN\nI wake up in a dark room -- alone. [Press SPACE]", // 0
  "Finds a door. [Walk to the door on the right]", // 1
  "The door is locked. I need a key. There's a passage to the left. [Walk left]", // 2
  "STORAGE ROOM\nIt's freezing in here. I see something shiny. [Walk to the shiny object]", // 3
  "Got the KEY. [Walk back to the right]", // 4
  "Back in the dark room. [Walk to the door on the right]", // 5
  "Unlocks the door and opens it...", // 6
  "OFFICE\nI see another FIGURE standing in the middle of the room. [Approach]", // 7
  "FIGURE: Ho--how? Are you awake? [Press SPACE]", // 8
  "GUARDS!", // 9
  "Two GUARDS come to me. Hold me. [Press SPACE]", // 10
  "They throw me back. Door closes, locks. [Press SPACE]", // 11
  "Gas fills the room. [Press SPACE]", // 12
  "I get knocked out...", // 13
  "", // 14 (glitch)
  "LOBBY, 11:00 PM\nEmpty. I see a piece of paper on the left. [Walk left, press R to read]", // 15
  "Then, I hear a phone ringing. [Walk to the desk on the right]", // 16
  "I pick up. [Press SPACE]", // 17
  "VOICE: You are not the first. [Press SPACE]", // 18
  "Rules are simple: Survive. [Press SPACE]", // 19
  "Inside you have the security room, with cameras in front. [Press SPACE]", // 20
  "Monitoring the movement of -- [Voice glitches] [Press SPACE]", // 21
  "Two doors on both sides. Keep an eye on power usage. [Press SPACE]", // 22
  "The phone cuts off. [Press ENTER to start]" // 23
];

const drawSprite = (grid: string[][], sprite: string[], x: number, y: number) => {
  for (let i = 0; i < sprite.length; i++) {
    for (let j = 0; j < sprite[i].length; j++) {
      if (y + i >= 0 && y + i < grid.length && x + j >= 0 && x + j < grid[0].length) {
        grid[y + i][x + j] = sprite[i][j];
      }
    }
  }
};

export const IntroSequence = ({ onComplete, glitchEnabled, onAddNote }: { onComplete: () => void, glitchEnabled: boolean, onAddNote: (note: string) => void }) => {
  const [step, setStep] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 5, y: 6 });
  const [guardX, setGuardX] = useState(55);
  const [gasLevel, setGasLevel] = useState(0);
  const [frame, setFrame] = useState(0);
  const [hasStorageNote, setHasStorageNote] = useState(false);
  const [hasLobbyNote, setHasLobbyNote] = useState(false);
  const [popupNote, setPopupNote] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setFrame(f => f + 1), 100);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (popupNote) {
        if (e.key === ' ') {
          setPopupNote(null);
          audio.playClick();
        }
        return;
      }

      // Movement
      if ([1, 2, 3, 4, 5, 7, 15, 16].includes(step)) {
        let moved = false;
        if (e.key === 'w') { setPlayerPos(p => ({ ...p, y: Math.max(0, p.y - 1) })); moved = true; }
        if (e.key === 's') { setPlayerPos(p => ({ ...p, y: Math.min(9, p.y + 1) })); moved = true; }
        if (e.key === 'a') { setPlayerPos(p => ({ ...p, x: Math.max(0, p.x - 1) })); moved = true; }
        if (e.key === 'd') { setPlayerPos(p => ({ ...p, x: Math.min(55, p.x + 1) })); moved = true; }
        if (moved) {
          audio.playFootstep();
        }
        
        // Check for notes with 'r' key
        if (e.key === 'r' || e.key === 'R') {
          if ((step === 3 || step === 4) && !hasStorageNote) {
            if (Math.abs(playerPos.x - 20) <= 2 && Math.abs(playerPos.y - 8) <= 2) {
              setHasStorageNote(true);
              const note = "NOTE 1: Subject 42 showed signs of extreme paranoia. The shapes... they aren't just hallucinations. They are manifesting.";
              setPopupNote(note);
              onAddNote(note);
              audio.playClick();
            }
          }
          if ((step === 15 || step === 16) && !hasLobbyNote) {
            if (Math.abs(playerPos.x - 10) <= 2 && Math.abs(playerPos.y - 5) <= 2) {
              setHasLobbyNote(true);
              const note = "NOTE 2: Do not trust the voice on the phone. It is part of the test. They are watching how you react to the stress.";
              setPopupNote(note);
              onAddNote(note);
              audio.playClick();
            }
          }
        }
      }

      // Space to advance
      if (e.key === ' ' && [0, 8, 10, 11, 12, 17, 18, 19, 20, 21, 22].includes(step)) {
        audio.playClick();
        const nextStep = step + 1;
        setStep(nextStep);
        
        if (nextStep === 11) {
           audio.playDoor(false);
           setPlayerPos({ x: 25, y: 6 });
        }
        if (nextStep === 12) {
           audio.playGasHiss();
        }
        if (nextStep === 13) {
           audio.playHeartbeat();
           setTimeout(() => {
             setStep(14);
             audio.stopGasHiss();
             if (glitchEnabled) audio.playGlitch();
           }, 2000);
        }
      }

      // Enter to finish
      if (e.key === 'Enter' && step === 23) {
        audio.stopHeartbeat();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, onComplete]);

  // Triggers based on position or step
  useEffect(() => {
    if (step === 1 && playerPos.x >= 45) {
      audio.playDoor(false);
      setStep(2);
    }
    if (step === 2 && playerPos.x <= 5) {
      setStep(3);
      setPlayerPos({ x: 50, y: 6 });
    }
    if (step === 3 && playerPos.x <= 15) {
      audio.playClick();
      setStep(4);
    }
    if (step === 4 && playerPos.x >= 50) {
      setStep(5);
      setPlayerPos({ x: 5, y: 6 });
    }
    if (step === 5 && playerPos.x >= 45) {
      audio.playDoor(true);
      setStep(6);
      setTimeout(() => {
        setStep(7);
        setPlayerPos({ x: 5, y: 6 });
      }, 1000);
    }
    if (step === 7 && playerPos.x >= 35) {
      setStep(8);
    }
    if (step === 9) {
      const interval = setInterval(() => {
        setGuardX(gx => {
          if (gx <= playerPos.x + 5) {
            clearInterval(interval);
            setTimeout(() => setStep(10), 500);
            return gx;
          }
          return gx - 2;
        });
      }, 100);
      return () => clearInterval(interval);
    }
    if (step === 12) {
      const interval = setInterval(() => setGasLevel(g => g + 1), 200);
      return () => clearInterval(interval);
    }
    if (step === 14) {
      const timeout = setTimeout(() => {
        setStep(15);
        setPlayerPos({ x: 25, y: 6 });
      }, 2000);
      return () => clearTimeout(timeout);
    }
    if (step === 15 && playerPos.x >= 35) {
      setStep(16);
    }
    if (step === 16 && playerPos.x >= 45) {
      setStep(17);
    }
  }, [step, playerPos.x]);

  if (step === 14) {
    let s = "";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*()_+{}|:<>?~";
    for(let i=0; i<40; i++) {
      for(let j=0; j<80; j++) {
        s += chars[Math.floor(Math.random() * chars.length)];
      }
      s += "\n";
    }
    const isBgInverted = frame % 2 === 0;
    return (
      <div 
        className={`fixed inset-0 ${isBgInverted ? 'bg-green-500 text-black' : 'bg-black text-green-500'} font-mono text-xl overflow-hidden flex items-center justify-center whitespace-pre-wrap break-all leading-none z-50`}
      >
        {s}
      </div>
    );
  }

  const grid = Array(12).fill(null).map(() => Array(60).fill(' '));

  // Background elements
  if ([0, 1, 2, 5, 11, 12, 13].includes(step)) {
    drawSprite(grid, PIPES, 0, 0);
    drawSprite(grid, getFan(frame), 10, 2);
    drawSprite(grid, getFan(frame + 1), 40, 2);
  }

  if ([3, 4].includes(step)) {
    drawSprite(grid, ["STORAGE"], 25, 1);
    drawSprite(grid, ["====", "====", "===="], 5, 5);
    if (step === 3) {
      drawSprite(grid, ["*"], 10, 6);
    }
    if (!hasStorageNote) {
      drawSprite(grid, ["?"], 20, 8);
    }
  }

  let drawPlayer = true;
  if (step === 13) {
    drawPlayer = false;
    drawSprite(grid, ["--O-<"], playerPos.x, playerPos.y + 2);
  }

  if (drawPlayer) {
    drawSprite(grid, STICK, playerPos.x, playerPos.y);
  }

  if ([0, 1, 2, 5].includes(step)) {
    drawSprite(grid, DOOR_CLOSED, 50, 4);
  } else if (step === 6) {
    drawSprite(grid, DOOR_OPEN, 50, 4);
  } else if (step >= 7 && step <= 10) {
    drawSprite(grid, DOOR_OPEN, 0, 4);
    drawSprite(grid, FIGURE, 40, 6);
    if (step >= 9) {
      drawSprite(grid, GUARDS, guardX, 6);
    }
  } else if (step >= 11 && step <= 13) {
    drawSprite(grid, DOOR_CLOSED, 50, 4);
    for(let i=0; i<gasLevel * 10; i++) {
       const rx = Math.floor(Math.random() * 60);
       const ry = Math.floor(Math.random() * 12);
       grid[ry][rx] = '~';
    }
    
    // Elaborate glitch during gas scene
    if (step >= 12 && glitchEnabled) {
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          if (Math.random() < gasLevel * 0.01) {
            grid[y][x] = ['#','?','%','&','X','@'][Math.floor(Math.random()*6)];
          }
        }
      }
    }
  } else if (step >= 15) {
    drawSprite(grid, DESK, 45, 5);
    if (!hasLobbyNote) {
      drawSprite(grid, ["?"], 10, 5);
    }
    if (step === 16 && Math.floor(frame / 5) % 2 === 0) {
       drawSprite(grid, ["((( & )))"], 45, 3);
       if (frame % 10 === 0) audio.playPhoneRing();
    }
  }

  const displayStr = grid.map(row => row.join('')).join('\n');
  
  // Flickering lights effect
  const isFlickering = glitchEnabled && ([0, 1, 2, 5, 11, 12, 13].includes(step)) && Math.random() > 0.8;
  // Gas distortion effect
  const gasDistortion = step >= 12 && step <= 14 && glitchEnabled ? `opacity-${Math.max(20, 100 - gasLevel * 10)}` : '';
  
  const containerClass = `font-mono text-xl whitespace-pre mb-8 text-center min-h-[150px] bg-black border border-green-500/30 p-4 rounded transition-all duration-75 ${isFlickering ? 'opacity-40' : 'opacity-100'} ${gasDistortion}`;

  // Shake effect during gas
  const shakeClass = (step >= 12 && step <= 13) ? (frame % 2 === 0 ? 'translate-x-2 translate-y-2' : '-translate-x-2 -translate-y-2') : '';

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8 text-green-500 bg-black relative">
      <div className={`${containerClass} ${shakeClass}`}>
        {displayStr}
      </div>
      <div className={`font-mono text-lg whitespace-pre-wrap text-center min-h-[100px] max-w-2xl ${gasDistortion}`}>
        {TEXTS[step]}
      </div>
      
      {popupNote && (
        <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-8 border-4 border-green-500">
          <div className="max-w-xl text-green-400 text-2xl leading-relaxed border border-green-500/50 p-8 bg-green-900/20">
            {popupNote}
          </div>
          <div className="mt-8 animate-pulse text-green-500">
            [Press SPACE to close]
          </div>
        </div>
      )}
    </div>
  );
};
