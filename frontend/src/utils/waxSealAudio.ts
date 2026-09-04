// ============================================
// WAX SEAL & PARCHMENT PROCEDURAL AUDIO SYNTHESIS
// HTML5 Web Audio API with Master Warm Acoustic Bus & Soft Dynamic Curve
// Redesigned for silky, soothing, organic warmth (50% volume, zero ear fatigue / harsh treble)
// ============================================

class WaxSealAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;
  private masterWarmFilter: BiquadFilterNode | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        
        // 1. Master Dynamics Compressor - Soft gentle acoustic smoothing
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(20, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(2.5, this.ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.015, this.ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.28, this.ctx.currentTime);

        // 2. Master Warm Lowpass Filter - Curls off piercing high frequencies above 2.4kHz
        this.masterWarmFilter = this.ctx.createBiquadFilter();
        this.masterWarmFilter.type = 'lowpass';
        this.masterWarmFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
        this.masterWarmFilter.Q.setValueAtTime(0.6, this.ctx.currentTime);

        // 3. Master Gain: Calibrated to 50% of original volume (0.34 desktop, 0.19 mobile)
        const isMobileDevice = typeof window !== 'undefined' && (
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          window.matchMedia('(pointer: coarse)').matches ||
          window.innerWidth <= 768
        );
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(isMobileDevice ? 0.19 : 0.34, this.ctx.currentTime);

        // Route: Audio Node -> Master Compressor -> Master Warm Filter -> Master Gain -> Destination
        this.masterCompressor.connect(this.masterWarmFilter);
        this.masterWarmFilter.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.ctx && this.masterGain) {
      const isMobile = typeof window !== 'undefined' && (
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth <= 768
      );
      this.masterGain.gain.setValueAtTime(isMobile ? 0.19 : 0.34, this.ctx.currentTime);
    }
    return this.ctx;
  }

  private getDestination(ctx: AudioContext): AudioNode {
    return this.masterCompressor || ctx.destination;
  }

  /**
   * Mellow, authentic brittle wax crackle & fracture (Warm, deep snap without sharp treble)
   */
  public playWaxCrack(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Warm brittle crackle texture (filtered at 1200Hz down to 400Hz)
      const bufferSize = ctx.sampleRate * 0.07;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1150, now);
      filter.frequency.exponentialRampToValueAtTime(420, now + 0.07);
      filter.Q.setValueAtTime(1.1, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.07);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);
      noise.start(now);

      // 2. Mellow snap body (warm low-mid punch: 360Hz -> 110Hz)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(360, now + 0.005);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.065);

      oscGain.gain.setValueAtTime(0.42, now + 0.005);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      osc.connect(oscGain);
      oscGain.connect(dest);

      osc.start(now + 0.005);
      osc.stop(now + 0.075);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Soothing parchment scroll unrolling / soft paper unfolding rustle
   */
  public playParchmentUnroll(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 0.42;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Soft textured paper friction
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.98 * b0 + white * 0.05;
        b1 = 0.92 * b1 + white * 0.12;
        b2 = 0.80 * b2 + white * 0.22;
        const envelope = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (b0 + b1 + b2) * 0.45 * envelope;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(880, now);
      bandpass.frequency.exponentialRampToValueAtTime(450, now + duration);
      bandpass.Q.setValueAtTime(1.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(dest);

      noise.start(now);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Heavy brass seal matrix stamping down on hot molten wax (Velvety desk thud & soft squish)
   */
  public playWaxStampThud(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Velvet desk impact thud (160Hz -> 55Hz)
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(160, now);
      thudOsc.frequency.exponentialRampToValueAtTime(55, now + 0.16);

      thudGain.gain.setValueAtTime(0.65, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      thudOsc.connect(thudGain);
      thudGain.connect(dest);

      thudOsc.start(now);
      thudOsc.stop(now + 0.20);

      // 2. Mellow brass stamp ring (soft sine overtone at 520Hz -> 380Hz)
      const ringOsc = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(520, now);
      ringOsc.frequency.exponentialRampToValueAtTime(380, now + 0.12);

      ringGain.gain.setValueAtTime(0.16, now);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      ringOsc.connect(ringGain);
      ringGain.connect(dest);

      ringOsc.start(now);
      ringOsc.stop(now + 0.14);

      // 3. Hot wax squish friction (gentle lowpass at 850Hz)
      const bufferSize = ctx.sampleRate * 0.10;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.03));
      }

      const sizzle = ctx.createBufferSource();
      sizzle.buffer = buffer;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(850, now);

      const sizzleGain = ctx.createGain();
      sizzleGain.gain.setValueAtTime(0.25, now);
      sizzleGain.gain.exponentialRampToValueAtTime(0.005, now + 0.10);

      sizzle.connect(lowpass);
      lowpass.connect(sizzleGain);
      sizzleGain.connect(dest);

      sizzle.start(now);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Mailman Saddlebag Packing: Soft leather pouch thud, gentle brass latch, and warm fanfare chime
   */
  public playSaddlebagDispatch(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Leather saddlebag pack thud
      const thud = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(150, now);
      thud.frequency.exponentialRampToValueAtTime(55, now + 0.16);
      thudGain.gain.setValueAtTime(0.55, now);
      thudGain.gain.exponentialRampToValueAtTime(0.005, now + 0.18);
      thud.connect(thudGain);
      thudGain.connect(dest);
      thud.start(now);
      thud.stop(now + 0.20);

      // 2. Mellow brass latch click (gentle triangle 750Hz -> 280Hz)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(750, now + 0.04);
      snapOsc.frequency.exponentialRampToValueAtTime(280, now + 0.10);
      snapGain.gain.setValueAtTime(0.18, now + 0.04);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.10);
      snapOsc.connect(snapGain);
      snapGain.connect(dest);
      snapOsc.start(now + 0.04);
      snapOsc.stop(now + 0.11);

      // 3. Warm Royal Postman Dispatch Fanfare Chime (Soft mellow octave triad: C4, E4, G4, C5)
      const notes = [261.63, 329.63, 392.00, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.12 + i * 0.07);
        g.gain.setValueAtTime(0.22, now + 0.12 + i * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + i * 0.07);
        osc.connect(g);
        g.connect(dest);
        osc.start(now + 0.12 + i * 0.07);
        osc.stop(now + 0.50 + i * 0.07);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Unsealing Delivery Celebration: Soft wax crackle, parchment unroll, and gentle harmonic warmth
   */
  public playUnsealingDelivery(): void {
    try {
      this.playWaxCrack();
      setTimeout(() => this.playParchmentUnroll(), 90);

      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // Warm calming harmonic chimes (A3, C#4, E4, A4)
      const chords = [220.00, 277.18, 329.63, 440.00];
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.18 + idx * 0.06);
        gain.gain.setValueAtTime(0.20, now + 0.18 + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65 + idx * 0.06);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + 0.18 + idx * 0.06);
        osc.stop(now + 0.75 + idx * 0.06);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Dybbuk Spectral Astral Whisper & Gentle Phantom Resonance (Atmospheric & warm)
   */
  public playDybbukWhisper(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 1.4;

      // 1. Astral sub-drone (95Hz -> 110Hz -> 85Hz)
      const drone = ctx.createOscillator();
      const droneGain = ctx.createGain();
      drone.type = 'sine';
      drone.frequency.setValueAtTime(95, now);
      drone.frequency.linearRampToValueAtTime(110, now + duration * 0.5);
      drone.frequency.linearRampToValueAtTime(85, now + duration);

      droneGain.gain.setValueAtTime(0.005, now);
      droneGain.gain.exponentialRampToValueAtTime(0.35, now + 0.25);
      droneGain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      drone.connect(droneGain);
      droneGain.connect(dest);
      drone.start(now);
      drone.stop(now + duration);

      // 2. Soft ghostly ethereal pad (380Hz -> 440Hz -> 360Hz)
      const ghostly = ctx.createOscillator();
      const ghostlyGain = ctx.createGain();
      ghostly.type = 'sine';
      ghostly.frequency.setValueAtTime(380, now + 0.05);
      ghostly.frequency.linearRampToValueAtTime(440, now + 0.6);
      ghostly.frequency.linearRampToValueAtTime(360, now + duration);

      ghostlyGain.gain.setValueAtTime(0.005, now + 0.05);
      ghostlyGain.gain.exponentialRampToValueAtTime(0.22, now + 0.35);
      ghostlyGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      ghostly.connect(ghostlyGain);
      ghostlyGain.connect(dest);
      ghostly.start(now + 0.05);
      ghostly.stop(now + duration);

      // 3. Gentle whispering wind breeze (warm bandpass at 650Hz)
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(550, now);
      bandpass.frequency.linearRampToValueAtTime(850, now + 0.6);
      bandpass.frequency.linearRampToValueAtTime(400, now + duration);
      bandpass.Q.setValueAtTime(1.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.20, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(dest);

      noise.start(now);
    } catch (e) {
      console.warn('Dybbuk audio error:', e);
    }
  }

  /**
   * Schrödinger Quantum Superposition Oscillation (Gentle orbital hum)
   */
  public playQuantumHum(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.linearRampToValueAtTime(230, now + 0.35);
      osc1.frequency.linearRampToValueAtTime(220, now + 0.7);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(330, now);
      osc2.frequency.linearRampToValueAtTime(320, now + 0.35);
      osc2.frequency.linearRampToValueAtTime(330, now + 0.7);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(850, now);

      gain.gain.setValueAtTime(0.20, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.7);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.75);
      osc2.stop(now + 0.75);
    } catch (e) {
      console.warn('Quantum audio error:', e);
    }
  }

  /**
   * Schrödinger Wavefunction Collapse Surge & Reality Chime (Smooth, warm crystalline chime)
   */
  public playWavefunctionCollapse(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Quantum particle collapse transition (triangle 650Hz -> 90Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.28);

      gain.gain.setValueAtTime(0.38, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + 0.28);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.30);

      // 2. Crystal Reality Commitment Bell Chime (Warm E5 Note 659.25Hz)
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'sine';
      bell.frequency.setValueAtTime(659.25, now + 0.18);
      bell.frequency.exponentialRampToValueAtTime(523.25, now + 0.75);

      bellGain.gain.setValueAtTime(0.28, now + 0.18);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.80);

      bell.connect(bellGain);
      bellGain.connect(dest);

      bell.start(now + 0.18);
      bell.stop(now + 0.85);
    } catch (e) {
      console.warn('Collapse audio error:', e);
    }
  }

  /**
   * Message in a Bottle: Soft Wooden Cork Pop & Mild Decompression
   */
  public playCorkPop(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Soft cork plop tone (triangle 520Hz -> 130Hz)
      const pop = ctx.createOscillator();
      const popGain = ctx.createGain();
      pop.type = 'triangle';
      pop.frequency.setValueAtTime(520, now);
      pop.frequency.exponentialRampToValueAtTime(130, now + 0.05);

      popGain.gain.setValueAtTime(0.65, now);
      popGain.gain.exponentialRampToValueAtTime(0.005, now + 0.06);

      pop.connect(popGain);
      popGain.connect(dest);

      pop.start(now);
      pop.stop(now + 0.07);

      // 2. Mild air release (filtered bandpass at 950Hz)
      const bufferSize = ctx.sampleRate * 0.08;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.025));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(950, now + 0.01);
      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.24, now + 0.01);
      hissGain.gain.exponentialRampToValueAtTime(0.005, now + 0.08);

      noise.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(dest);

      noise.start(now + 0.01);
    } catch (e) {
      console.warn('Cork audio error:', e);
    }
  }

  /**
   * Soft Paper / Parchment Tearing Sound
   */
  public playPaperTear(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 0.40;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = white * env * Math.exp(-i / (ctx.sampleRate * 0.25));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1100, now);
      bandpass.frequency.exponentialRampToValueAtTime(450, now + duration);
      bandpass.Q.setValueAtTime(1.2, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(dest);
      noise.start(now);

      // Micro tear body
      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'triangle';
      snap.frequency.setValueAtTime(420, now);
      snap.frequency.exponentialRampToValueAtTime(100, now + 0.07);

      snapGain.gain.setValueAtTime(0.35, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      snap.connect(snapGain);
      snapGain.connect(dest);
      snap.start(now);
      snap.stop(now + 0.09);
    } catch (e) {
      console.warn('Tear audio error:', e);
    }
  }

  /**
   * Tactile Parchment Paper Touch / Soft Quill Friction
   * Gentle, silky, ASMR-grade paper slide with zero synthetic or high-pitch sting.
   * Completely comfortable on headphones and laptop speakers.
   */
  public playUiTap(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 0.045; // ultra-short subtle tactile tick

      const isMobile = typeof window !== 'undefined' && (
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth <= 768
      );

      const baseGain = isMobile ? 0.08 : 0.18;

      // 1. Soft organic paper fiber friction (warm bandpass at 950Hz -> 520Hz)
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = white * env * Math.exp(-i / (ctx.sampleRate * 0.018));
      }

      const scratchSource = ctx.createBufferSource();
      scratchSource.buffer = buffer;

      const scratchFilter = ctx.createBiquadFilter();
      scratchFilter.type = 'bandpass';
      scratchFilter.frequency.setValueAtTime(980, now);
      scratchFilter.frequency.exponentialRampToValueAtTime(480, now + duration);
      scratchFilter.Q.setValueAtTime(0.9, now);

      const scratchGain = ctx.createGain();
      scratchGain.gain.setValueAtTime(baseGain, now);
      scratchGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      scratchSource.connect(scratchFilter);
      scratchFilter.connect(scratchGain);
      scratchGain.connect(dest);
      scratchSource.start(now);

      // 2. Micro wood desk tap body (warm round triangle at 240Hz -> 90Hz)
      const tapOsc = ctx.createOscillator();
      const tapGain = ctx.createGain();
      tapOsc.type = 'triangle';
      tapOsc.frequency.setValueAtTime(240, now);
      tapOsc.frequency.exponentialRampToValueAtTime(90, now + duration);

      tapGain.gain.setValueAtTime(baseGain * 0.85, now);
      tapGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      tapOsc.connect(tapGain);
      tapGain.connect(dest);

      tapOsc.start(now);
      tapOsc.stop(now + duration + 0.005);
    } catch (e) {
      console.warn('Paper tap audio error:', e);
    }
  }

  /**
   * Message in a Bottle: Soft Ocean Swell & Liquid Tide
   */
  public playOceanSplash(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 0.85;

      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.frequency.linearRampToValueAtTime(950, now + 0.3);
      filter.frequency.exponentialRampToValueAtTime(220, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.005, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start(now);
    } catch (e) {
      console.warn('Splash audio error:', e);
    }
  }

  /**
   * Letter Handover / Soft Aerodynamic Envelope Glide & Warm Chime
   */
  public playLetterHandoverGlide(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Soft parchment whoosh glide (0.35s)
      const bufferSize = ctx.sampleRate * 0.35;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.6;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const whooshFilter = ctx.createBiquadFilter();
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.setValueAtTime(450, now);
      whooshFilter.frequency.linearRampToValueAtTime(850, now + 0.15);
      whooshFilter.frequency.exponentialRampToValueAtTime(250, now + 0.35);
      whooshFilter.Q.setValueAtTime(1.1, now);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.30, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

      noise.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(dest);
      noise.start(now);

      // 2. Soft Golden Arrival Chime (at 0.22s)
      setTimeout(() => {
        try {
          const ctx2 = this.getAudioContext();
          if (!ctx2) return;
          const now2 = ctx2.currentTime;
          const chime = ctx2.createOscillator();
          const chimeGain = ctx2.createGain();
          chime.type = 'sine';
          chime.frequency.setValueAtTime(523.25, now2); // C5 Note
          chime.frequency.exponentialRampToValueAtTime(659.25, now2 + 0.22); // E5

          chimeGain.gain.setValueAtTime(0.18, now2);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.28);

          chime.connect(chimeGain);
          chimeGain.connect(this.getDestination(ctx2));
          chime.start(now2);
          chime.stop(now2 + 0.30);
        } catch (_) {}
      }, 200);
    } catch (e) {
      console.warn('Handover audio error:', e);
    }
  }

  /**
   * Royal Postal Bell & Horn Chime: Warm, comforting Victorian postman proximity chime
   */
  public playCourierProximityChime(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 3-Tone Warm Victorian Postal Fanfare Notes (F4 349Hz, A4 440Hz, C5 523Hz)
      const notes = [
        { freq: 349.23, time: 0.00, dur: 0.24, gain: 0.22 }, // F4
        { freq: 440.00, time: 0.12, dur: 0.24, gain: 0.24 }, // A4
        { freq: 523.25, time: 0.25, dur: 0.42, gain: 0.26 }  // C5
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const t = now + note.time;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(note.freq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.exponentialRampToValueAtTime(note.gain, t + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.dur);

        osc.connect(gain);
        gain.connect(dest);

        osc.start(t);
        osc.stop(t + note.dur + 0.05);
      });
    } catch (e) {
      console.warn('Postman proximity chime error:', e);
    }
  }
}

export const waxSealAudio = new WaxSealAudioEngine();

/**
 * Automatically attaches tactile paper scrolling acoustic feedback to interactive click elements
 * Uses native 'click' event so touch scrolling/sliding on mobile does NOT trigger any sound!
 */
export function initGlobalUiClickSound(): void {
  if (typeof window === 'undefined') return;

  let lastTapTime = 0;
  const handleClick = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTime < 70) return; // 70ms debounce

    const target = e.target as HTMLElement | null;
    if (!target) return;

    // Check if clicked element or its parent is interactive
    const isInteractive = target.closest(
      'button, a, input[type="button"], input[type="submit"], [role="button"], [role="tab"], .cursor-pointer, .btn-gold-saloon, .btn-velvet-burgundy, .theatrical-card, .btn-quantum-ghost, .btn-astral, .nav-link-literary'
    );

    if (isInteractive && !target.closest('[data-no-click-sound]')) {
      lastTapTime = now;
      waxSealAudio.playUiTap();
    }
  };

  window.addEventListener('click', handleClick, { passive: true, capture: true });
}
