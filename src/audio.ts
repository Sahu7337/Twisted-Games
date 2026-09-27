export class AudioEngine {
  ctx: AudioContext | null = null;
  humOsc: OscillatorNode | null = null;
  humGain: GainNode | null = null;
  gasNoise: AudioBufferSourceNode | null = null;
  gasGain: GainNode | null = null;
  heartbeatOsc: OscillatorNode | null = null;
  heartbeatGain: GainNode | null = null;
  heartbeatInterval: any = null;
  
  masterSfxGain: GainNode | null = null;
  masterMusicGain: GainNode | null = null;
  musicVolume = 1.0;
  sfxVolume = 1.0;

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.masterSfxGain = this.ctx.createGain();
      this.masterSfxGain.gain.value = this.sfxVolume;
      this.masterSfxGain.connect(this.ctx.destination);
      
      this.masterMusicGain = this.ctx.createGain();
      this.masterMusicGain.gain.value = this.musicVolume;
      this.masterMusicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  loadSettings() {
    const mv = localStorage.getItem('twisted_music_vol');
    if (mv) this.musicVolume = parseFloat(mv);
    const sv = localStorage.getItem('twisted_sfx_vol');
    if (sv) this.sfxVolume = parseFloat(sv);
    if (this.masterMusicGain) this.masterMusicGain.gain.value = this.musicVolume;
    if (this.masterSfxGain) this.masterSfxGain.gain.value = this.sfxVolume;
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.masterMusicGain) {
      this.masterMusicGain.gain.value = v;
    }
    localStorage.setItem('twisted_music_vol', v.toString());
  }

  setSfxVolume(v: number) {
    this.sfxVolume = v;
    if (this.masterSfxGain) {
      this.masterSfxGain.gain.value = v;
    }
    localStorage.setItem('twisted_sfx_vol', v.toString());
  }

  startHum() {
    if (!this.ctx) return;
    if (this.humOsc) return;
    this.humOsc = this.ctx.createOscillator();
    this.humOsc.type = 'sine';
    this.humOsc.frequency.value = 55; // Low hum
    this.humGain = this.ctx.createGain();
    this.humGain.gain.value = 0.15;
    this.humOsc.connect(this.humGain);
    this.humGain.connect(this.masterMusicGain!);
    this.humOsc.start();
  }

  stopHum() {
    if (this.humOsc) {
      this.humOsc.stop();
      this.humOsc.disconnect();
      this.humOsc = null;
    }
    if (this.humGain) {
      this.humGain.disconnect();
      this.humGain = null;
    }
  }

  playDoor(open: boolean) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    
    if (open) {
      osc.frequency.setValueAtTime(100, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.3);
    } else {
      osc.frequency.setValueAtTime(300, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.3);
    }
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterSfxGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playStatic() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfxGain!);
    noise.start();
  }

  playEnemyMove(distance: number = 5) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Metallic clank
    osc.type = 'square';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.15);
    
    // Closer = louder
    const maxGain = Math.max(0.05, 0.4 - (distance * 0.06));
    
    gain.gain.setValueAtTime(maxGain, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1200;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfxGain!);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playAmbientWind(intensity: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 3; // 3 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200 + (intensity * 150);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.03 * intensity, this.ctx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfxGain!);
    noise.start();
  }

  playCreak() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.8);
    
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.8);
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfxGain!);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.8);
  }

  playThunder() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 4; // 4 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 150; // Muffled thunder
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 4);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfxGain!);
    noise.start();
  }

  playHeavyWind(intensity: number) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 5; // 5 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 100 + (intensity * 100); // Very muffled heavy wind
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15 * intensity, this.ctx.currentTime + 2.5);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 5);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterSfxGain!);
    noise.start();
  }

  playJumpscare() {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    
    osc1.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc1.frequency.linearRampToValueAtTime(500, this.ctx.currentTime + 0.1);
    osc1.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 2);
    
    osc2.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.1);
    osc2.frequency.linearRampToValueAtTime(150, this.ctx.currentTime + 2);
    
    gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 2);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterSfxGain!);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 2);
    osc2.stop(this.ctx.currentTime + 2);
  }

  playPhoneRing() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.2);
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.setValueAtTime(0, this.ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterSfxGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  playGlitch() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(Math.random() * 1000 + 200, this.ctx.currentTime);
    osc.frequency.setValueAtTime(Math.random() * 1000 + 200, this.ctx.currentTime + 0.1);
    osc.frequency.setValueAtTime(Math.random() * 1000 + 200, this.ctx.currentTime + 0.2);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterSfxGain!);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playBell() {
    if (!this.ctx) return;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const gain2 = this.ctx.createGain();
    
    // Calm bell sound (C5 and C6)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, this.ctx.currentTime);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.50, this.ctx.currentTime);
    
    gain1.gain.setValueAtTime(0, this.ctx.currentTime);
    gain1.gain.linearRampToValueAtTime(0.4, this.ctx.currentTime + 0.05);
    gain1.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 4);
    
    gain2.gain.setValueAtTime(0, this.ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 3);
    
    osc1.connect(gain1);
    osc2.connect(gain2);
    
    gain1.connect(this.masterSfxGain!);
    gain2.connect(this.masterSfxGain!);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.ctx.currentTime + 4);
    osc2.stop(this.ctx.currentTime + 4);
  }

  playTitleMusic() {
    if (!this.ctx) return;
    if (this.humOsc) return; // Don't play if already playing something
    
    this.humOsc = this.ctx.createOscillator();
    this.humGain = this.ctx.createGain();
    
    // Spooky low drone
    this.humOsc.type = 'sawtooth';
    this.humOsc.frequency.value = 40;
    
    // LFO for eerie wobble
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 5;
    lfo.connect(lfoGain);
    lfoGain.connect(this.humOsc.frequency);
    
    this.humGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.humGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 2);
    
    this.humOsc.connect(this.humGain);
    this.humGain.connect(this.masterMusicGain!);
    
    this.humOsc.start();
    lfo.start();
  }

  stopTitleMusic() {
    this.stopHum();
  }

  playCameraAlert() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    
    osc.connect(gain);
    gain.connect(this.masterSfxGain!);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  playFootstep() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(100, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(this.masterSfxGain!);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.1);
  }

  playClick() {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterSfxGain!);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playGasHiss() {
    if (!this.ctx) return;
    if (this.gasNoise) return;

    const bufferSize = this.ctx.sampleRate * 2; // 2 seconds
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    this.gasNoise = this.ctx.createBufferSource();
    this.gasNoise.buffer = buffer;
    this.gasNoise.loop = true;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    
    this.gasGain = this.ctx.createGain();
    this.gasGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.gasGain.gain.linearRampToValueAtTime(0.1, this.ctx.currentTime + 2); // Fade in
    
    this.gasNoise.connect(filter);
    filter.connect(this.gasGain);
    this.gasGain.connect(this.masterSfxGain!);
    
    this.gasNoise.start();
  }

  stopGasHiss() {
    if (this.gasGain) {
      this.gasGain.gain.linearRampToValueAtTime(0, this.ctx?.currentTime || 0 + 1);
    }
    setTimeout(() => {
      if (this.gasNoise) {
        this.gasNoise.stop();
        this.gasNoise.disconnect();
        this.gasNoise = null;
      }
      if (this.gasGain) {
        this.gasGain.disconnect();
        this.gasGain = null;
      }
    }, 1000);
  }

  playHeartbeat() {
    if (!this.ctx) return;
    
    const playSingleBeat = (timeOffset: number, freq: number, dur: number, vol: number) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime + timeOffset);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, this.ctx.currentTime + timeOffset + dur);
      
      gain.gain.setValueAtTime(0, this.ctx.currentTime + timeOffset);
      gain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + timeOffset + dur * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + timeOffset + dur);
      
      osc.connect(gain);
      gain.connect(this.masterSfxGain!);
      
      osc.start(this.ctx.currentTime + timeOffset);
      osc.stop(this.ctx.currentTime + timeOffset + dur);
    };

    let beatCount = 0;
    const maxBeats = 10;
    
    const beat = () => {
      if (beatCount >= maxBeats) {
        clearInterval(this.heartbeatInterval);
        return;
      }
      
      // Heartbeat gets slower and deeper
      const rateMultiplier = 1 + (beatCount * 0.1);
      const freq = Math.max(30, 60 - (beatCount * 3));
      const vol = Math.max(0.1, 0.5 - (beatCount * 0.04));
      
      playSingleBeat(0, freq, 0.15, vol);
      playSingleBeat(0.2 * rateMultiplier, freq * 0.8, 0.3, vol * 0.8);
      
      beatCount++;
    };

    beat(); // Play first beat immediately
    this.heartbeatInterval = setInterval(beat, 1000); // Base interval, will effectively slow down as beats fade
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

export const audio = new AudioEngine();
