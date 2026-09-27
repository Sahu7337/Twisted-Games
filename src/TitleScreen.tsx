import React, { useState, useEffect } from 'react';
import { audio } from './audio';

interface TitleScreenProps {
  onNewGame: () => void;
  onContinue: () => void;
  savedNight: number | null;
  glitchEnabled: boolean;
  setGlitchEnabled: (val: boolean) => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onNewGame,
  onContinue,
  savedNight,
  glitchEnabled,
  setGlitchEnabled
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [titleGlitch, setTitleGlitch] = useState('');
  const [musicVol, setMusicVol] = useState(audio.musicVolume);
  const [sfxVol, setSfxVol] = useState(audio.sfxVolume);

  // Title screen glitch effect
  useEffect(() => {
    if (glitchEnabled) {
      const interval = setInterval(() => {
        if (Math.random() < 0.1) {
          const chars = "!@#$%^&*()_+{}|:<>?~";
          let s = "TWISTED GAMES".split('');
          for (let i = 0; i < 3; i++) {
            const idx = Math.floor(Math.random() * s.length);
            s[idx] = chars[Math.floor(Math.random() * chars.length)];
          }
          setTitleGlitch(s.join(''));
          setTimeout(() => setTitleGlitch(''), 100);
        }
      }, 200);
      return () => clearInterval(interval);
    } else {
      setTitleGlitch('');
    }
  }, [glitchEnabled]);

  if (showSettings) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center text-center relative bg-black text-green-500 font-mono">
        <h2 className="text-4xl font-bold mb-8 tracking-widest">SETTINGS</h2>
        <div className="flex flex-col gap-6 w-64 text-left">
          <label className="flex flex-col gap-2">
            <span>MUSIC VOLUME: {Math.round(musicVol * 100)}%</span>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={musicVol} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMusicVol(val);
                audio.setMusicVolume(val);
              }}
              className="accent-green-500"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span>SFX VOLUME: {Math.round(sfxVol * 100)}%</span>
            <input 
              type="range" min="0" max="1" step="0.1" 
              value={sfxVol} 
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSfxVol(val);
                audio.setSfxVolume(val);
                audio.playClick();
              }}
              className="accent-green-500"
            />
          </label>
          <label className="flex items-center gap-4 cursor-pointer">
            <input 
              type="checkbox" 
              checked={glitchEnabled} 
              onChange={(e) => {
                setGlitchEnabled(e.target.checked);
                audio.playClick();
              }}
              className="accent-green-500 w-5 h-5"
            />
            <span>GLITCH EFFECTS</span>
          </label>
        </div>
        <button 
          className="mt-12 hover:text-green-300 hover:bg-green-900/30 hover:scale-110 transition-all cursor-pointer border border-green-500/50 px-6 py-3 rounded"
          onClick={() => {
            audio.playClick();
            setShowSettings(false);
          }}
        >
          [ BACK ]
        </button>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col items-center justify-center text-center relative bg-black text-green-500 font-mono" onClick={() => { audio.init(); audio.playTitleMusic(); }}>
      <h1 className="text-6xl font-bold mb-12 tracking-widest relative">
        {titleGlitch || "TWISTED GAMES"}
        {titleGlitch && <span className="absolute top-0 left-1 text-red-500 opacity-70 mix-blend-screen">{titleGlitch}</span>}
        {titleGlitch && <span className="absolute top-0 -left-1 text-blue-500 opacity-70 mix-blend-screen">{titleGlitch}</span>}
      </h1>
      <div className="flex flex-col gap-6 text-xl">
        <button 
          className="hover:text-green-300 hover:bg-green-900/30 hover:scale-110 transition-all cursor-pointer border border-green-500/50 px-6 py-3 rounded"
          onClick={(e) => {
            e.stopPropagation();
            audio.init();
            audio.playClick();
            audio.stopTitleMusic();
            onNewGame();
          }}
        >
          [ NEW GAME ]
        </button>
        {savedNight && savedNight > 1 && (
          <button 
            className="hover:text-green-300 hover:bg-green-900/30 hover:scale-110 transition-all cursor-pointer border border-green-500/50 px-6 py-3 rounded"
            onClick={(e) => {
              e.stopPropagation();
              audio.init();
              audio.playClick();
              audio.stopTitleMusic();
              onContinue();
            }}
          >
            [ CONTINUE NIGHT {savedNight} ]
          </button>
        )}
        <button 
          className="hover:text-green-300 hover:bg-green-900/30 hover:scale-110 transition-all cursor-pointer border border-green-500/50 px-6 py-3 rounded"
          onClick={(e) => {
            e.stopPropagation();
            audio.init();
            audio.playClick();
            setShowSettings(true);
          }}
        >
          [ SETTINGS ]
        </button>
      </div>
      <div className="absolute bottom-4 left-4 text-sm text-green-500/50">
        &copy; 2026 Asish Ranjan Sahu
      </div>
    </div>
  );
};
