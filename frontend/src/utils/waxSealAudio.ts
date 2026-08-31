// ============================================
// WAX SEAL & PARCHMENT PROCEDURAL AUDIO SYNTHESIS
// Uses HTML5 Web Audio API with Master Compressor Bus for loud, crisp PC & mobile fidelity
// ============================================

class WaxSealAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private masterCompressor: DynamicsCompressorNode | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
        
        // Master Dynamics Compressor
        this.masterCompressor = this.ctx.createDynamicsCompressor();
        this.masterCompressor.threshold.setValueAtTime(-10, this.ctx.currentTime);
        this.masterCompressor.knee.setValueAtTime(12, this.ctx.currentTime);
        this.masterCompressor.ratio.setValueAtTime(4.5, this.ctx.currentTime);
        this.masterCompressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.masterCompressor.release.setValueAtTime(0.18, this.ctx.currentTime);

        // Master Gain: Calibrated for desktop volume (0.90) and audible pleasant mobile volume (0.52)
        const isMobileDevice = typeof window !== 'undefined' && (
          /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
          window.matchMedia('(pointer: coarse)').matches ||
          window.innerWidth <= 768
        );
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(isMobileDevice ? 0.52 : 0.90, this.ctx.currentTime);

        this.masterCompressor.connect(this.masterGain);
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
      this.masterGain.gain.setValueAtTime(isMobile ? 0.52 : 0.90, this.ctx.currentTime);
    }
    return this.ctx;
  }

  private getDestination(ctx: AudioContext): AudioNode {
    return this.masterCompressor || ctx.destination;
  }

  /**
   * Sharp, realistic brittle wax fracturing and snapping sound (Loud & punchy)
   */
  public playWaxCrack(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. High frequency crack burst
      const bufferSize = ctx.sampleRate * 0.09;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.016));
      }

      const whiteNoise = ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(700, now + 0.09);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      whiteNoise.start(now);

      // 2. Audible snap body (240Hz-900Hz punch for laptop speakers)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(680, now + 0.01);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.08);

      oscGain.gain.setValueAtTime(0.9, now + 0.01);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(oscGain);
      oscGain.connect(dest);

      osc.start(now + 0.01);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn('Audio playback not supported:', e);
    }
  }

  /**
   * Tactile parchment scroll unrolling / paper unfolding rustle
   */
  public playParchmentUnroll(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 0.5;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Textured paper friction noise
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.06;
        b1 = 0.95 * b1 + white * 0.18;
        b2 = 0.85 * b2 + white * 0.35;
        const envelope = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (b0 + b1 + b2) * 0.65 * envelope;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1600, now);
      bandpass.frequency.exponentialRampToValueAtTime(750, now + duration);
      bandpass.Q.setValueAtTime(1.4, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(dest);

      noise.start(now);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Heavy brass seal matrix stamping down on hot molten wax (deep impact thud & sizzle)
   */
  public playWaxStampThud(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Solid desk impact thud (audible harmonics at 220Hz -> 80Hz)
      const thudOsc = ctx.createOscillator();
      const thudGain = ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(240, now);
      thudOsc.frequency.exponentialRampToValueAtTime(70, now + 0.18);

      thudGain.gain.setValueAtTime(1.5, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      thudOsc.connect(thudGain);
      thudGain.connect(dest);

      thudOsc.start(now);
      thudOsc.stop(now + 0.22);

      // 2. Metallic brass stamp ring
      const ringOsc = ctx.createOscillator();
      const ringGain = ctx.createGain();
      ringOsc.type = 'sine';
      ringOsc.frequency.setValueAtTime(950, now);
      ringOsc.frequency.exponentialRampToValueAtTime(580, now + 0.15);

      ringGain.gain.setValueAtTime(0.45, now);
      ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      ringOsc.connect(ringGain);
      ringGain.connect(dest);

      ringOsc.start(now);
      ringOsc.stop(now + 0.16);

      // 3. Hot wax squish / sizzle friction
      const bufferSize = ctx.sampleRate * 0.14;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.035));
      }

      const sizzle = ctx.createBufferSource();
      sizzle.buffer = buffer;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(1800, now);

      const sizzleGain = ctx.createGain();
      sizzleGain.gain.setValueAtTime(0.7, now);
      sizzleGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

      sizzle.connect(lowpass);
      lowpass.connect(sizzleGain);
      sizzleGain.connect(dest);

      sizzle.start(now);
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  /**
   * Mailman Saddlebag Packing: Heavy leather pouch thud, brass buckle click, and royal dispatch fanfare chime
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
      thud.frequency.setValueAtTime(220, now);
      thud.frequency.exponentialRampToValueAtTime(75, now + 0.18);
      thudGain.gain.setValueAtTime(1.3, now);
      thudGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
      thud.connect(thudGain);
      thudGain.connect(dest);
      thud.start(now);
      thud.stop(now + 0.22);

      // 2. Brass buckle snap
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'square';
      snapOsc.frequency.setValueAtTime(1900, now + 0.05);
      snapOsc.frequency.exponentialRampToValueAtTime(450, now + 0.12);
      snapGain.gain.setValueAtTime(0.5, now + 0.05);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      snapOsc.connect(snapGain);
      snapGain.connect(dest);
      snapOsc.start(now + 0.05);
      snapOsc.stop(now + 0.13);

      // 3. Royal Courier Dispatch Fanfare Chime (Triad arpeggio)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + 0.14 + i * 0.08);
        g.gain.setValueAtTime(0.55, now + 0.14 + i * 0.08);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.5 + i * 0.08);
        osc.connect(g);
        g.connect(dest);
        osc.start(now + 0.14 + i * 0.08);
        osc.stop(now + 0.55 + i * 0.08);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Unsealing Delivery Celebration: Crisp wax fracture, ribbon unfurl, and celebratory harmonic resonance
   */
  public playUnsealingDelivery(): void {
    try {
      this.playWaxCrack();
      setTimeout(() => this.playParchmentUnroll(), 110);

      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // Golden harmonic chimes
      const chords = [440, 554.37, 659.25, 880, 1108.73]; // A Major 9th
      chords.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + 0.2 + idx * 0.06);
        gain.gain.setValueAtTime(0.45, now + 0.2 + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75 + idx * 0.06);
        osc.connect(gain);
        gain.connect(dest);
        osc.start(now + 0.2 + idx * 0.06);
        osc.stop(now + 0.85 + idx * 0.06);
      });
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  /**
   * Dybbuk Spectral Astral Whisper & Phantom Resonance (Loud, atmospheric & haunting)
   */
  public playDybbukWhisper(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 1.8;

      // 1. Astral sub-drone + audible low-mid harmonics (110Hz -> 130Hz)
      const drone = ctx.createOscillator();
      const droneGain = ctx.createGain();
      drone.type = 'triangle';
      drone.frequency.setValueAtTime(110, now);
      drone.frequency.exponentialRampToValueAtTime(130, now + duration * 0.5);
      drone.frequency.exponentialRampToValueAtTime(95, now + duration);

      droneGain.gain.setValueAtTime(0.01, now);
      droneGain.gain.exponentialRampToValueAtTime(0.8, now + 0.25);
      droneGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      drone.connect(droneGain);
      droneGain.connect(dest);
      drone.start(now);
      drone.stop(now + duration);

      // 2. Spectral phantom pad
      const ghostly = ctx.createOscillator();
      const ghostlyGain = ctx.createGain();
      ghostly.type = 'sine';
      ghostly.frequency.setValueAtTime(680, now + 0.05);
      ghostly.frequency.linearRampToValueAtTime(760, now + 0.7);
      ghostly.frequency.linearRampToValueAtTime(640, now + duration);

      ghostlyGain.gain.setValueAtTime(0.01, now + 0.05);
      ghostlyGain.gain.exponentialRampToValueAtTime(0.5, now + 0.4);
      ghostlyGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      ghostly.connect(ghostlyGain);
      ghostlyGain.connect(dest);
      ghostly.start(now + 0.05);
      ghostly.stop(now + duration);

      // 3. Whispering wind texture (bandpass noise)
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
      bandpass.frequency.setValueAtTime(900, now);
      bandpass.frequency.exponentialRampToValueAtTime(1800, now + 0.7);
      bandpass.frequency.exponentialRampToValueAtTime(450, now + duration);
      bandpass.Q.setValueAtTime(3.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.45, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(dest);

      noise.start(now);
    } catch (e) {
      console.warn('Dybbuk audio error:', e);
    }
  }

  /**
   * Schrödinger Quantum Superposition Oscillation
   */
  public playQuantumHum(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // Dual oscillating atom orbital frequencies
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(280, now);
      osc1.frequency.linearRampToValueAtTime(290, now + 0.4);
      osc1.frequency.linearRampToValueAtTime(280, now + 0.8);

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(560, now);
      osc2.frequency.linearRampToValueAtTime(550, now + 0.4);
      osc2.frequency.linearRampToValueAtTime(560, now + 0.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.85);
      osc2.stop(now + 0.85);
    } catch (e) {
      console.warn('Quantum audio error:', e);
    }
  }

  /**
   * Schrödinger Wavefunction Collapse Surge & Reality Chime (Punchy & loud)
   */
  public playWavefunctionCollapse(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Quantum particle collapse zap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.35);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      osc.start(now);
      osc.stop(now + 0.38);

      // 2. Crystal Reality Commitment Bell Chime
      const bell = ctx.createOscillator();
      const bellGain = ctx.createGain();
      bell.type = 'triangle';
      bell.frequency.setValueAtTime(1046.50, now + 0.22); // High C6
      bell.frequency.exponentialRampToValueAtTime(880, now + 0.85);

      bellGain.gain.setValueAtTime(0.7, now + 0.22);
      bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      bell.connect(bellGain);
      bellGain.connect(dest);

      bell.start(now + 0.22);
      bell.stop(now + 0.95);
    } catch (e) {
      console.warn('Collapse audio error:', e);
    }
  }

  /**
   * Message in a Bottle: Wooden Cork Pop & Decompression Suction (Loud & crisp)
   */
  public playCorkPop(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Cork pop tone (sharp downward cavitation plop with punchy audible body)
      const pop = ctx.createOscillator();
      const popGain = ctx.createGain();
      pop.type = 'triangle';
      pop.frequency.setValueAtTime(1100, now);
      pop.frequency.exponentialRampToValueAtTime(180, now + 0.05);

      popGain.gain.setValueAtTime(1.8, now);
      popGain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

      pop.connect(popGain);
      popGain.connect(dest);

      pop.start(now);
      pop.stop(now + 0.07);

      // 2. Air decompression release hiss
      const bufferSize = ctx.sampleRate * 0.1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.02));
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2600, now + 0.01);
      const hissGain = ctx.createGain();
      hissGain.gain.setValueAtTime(0.65, now + 0.01);
      hissGain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);

      noise.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(dest);

      noise.start(now + 0.01);
    } catch (e) {
      console.warn('Cork audio error:', e);
    }
  }

  /**
   * Violent Paper / Parchment Tearing & Fiber Shearing (Used for failed riddle unsend)
   */
  public playPaperTear(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 0.55;

      // 1. Granular tearing noise with ripping fiber friction
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Modulated random fiber snaps
        const fiberRip = Math.sin(i * 0.05) * 0.3;
        const white = Math.random() * 2 - 1;
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (white + fiberRip) * env * Math.exp(-i / (ctx.sampleRate * 0.35));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(3200, now);
      bandpass.frequency.exponentialRampToValueAtTime(800, now + 0.3);
      bandpass.frequency.exponentialRampToValueAtTime(350, now + duration);
      bandpass.Q.setValueAtTime(2.8, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(bandpass);
      bandpass.connect(gain);
      gain.connect(dest);
      noise.start(now);

      // 2. Tear snap transient (micro fiber pop)
      const snap = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snap.type = 'sawtooth';
      snap.frequency.setValueAtTime(800, now);
      snap.frequency.exponentialRampToValueAtTime(120, now + 0.08);

      snapGain.gain.setValueAtTime(1.1, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      snap.connect(snapGain);
      snapGain.connect(dest);
      snap.start(now);
      snap.stop(now + 0.1);

      // 3. Secondary delayed tear shudder
      setTimeout(() => {
        try {
          const ctx2 = this.getAudioContext();
          if (!ctx2) return;
          const now2 = ctx2.currentTime;
          const snap2 = ctx2.createOscillator();
          const snapGain2 = ctx2.createGain();
          snap2.type = 'triangle';
          snap2.frequency.setValueAtTime(550, now2);
          snap2.frequency.exponentialRampToValueAtTime(90, now2 + 0.12);

          snapGain2.gain.setValueAtTime(0.9, now2);
          snapGain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.12);

          snap2.connect(snapGain2);
          snapGain2.connect(this.getDestination(ctx2));
          snap2.start(now2);
          snap2.stop(now2 + 0.13);
        } catch (_) {}
      }, 140);
    } catch (e) {
      console.warn('Tear audio error:', e);
    }
  }

  /**
   * Crisp Paper Movement / Parchment Scratching Sound
   * Pure acoustic parchment fiber friction & dry quill scratch with zero synthetic tones.
   * Calibrated for loud, crisp presence on PC/laptop speakers and soft presence on mobile.
   */
  public playUiTap(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 0.085;

      // Detect mobile vs PC/laptop for tailored acoustic volume
      const isMobile = typeof window !== 'undefined' && (
        /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
        window.matchMedia('(pointer: coarse)').matches ||
        window.innerWidth <= 768
      );

      // Volume: calibrated for desktop (0.55) and audible tactile feedback for mobile (0.16)
      const baseGain = isMobile ? 0.16 : 0.55;

      // 1. High-frequency crisp paper surface scratch / quill nib friction
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Procedural paper grain & fiber chatter
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Paper grain jitter: micro tooth texture
        const grainJitter = Math.sin(i * 0.45) * 0.35 + (Math.random() * 0.4 - 0.2);
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (white * 0.75 + grainJitter) * env * Math.exp(-i / (ctx.sampleRate * 0.035));
      }

      const scratchSource = ctx.createBufferSource();
      scratchSource.buffer = buffer;

      // Sharp paper scratch bandpass filter (2800Hz - 4200Hz)
      const scratchFilter = ctx.createBiquadFilter();
      scratchFilter.type = 'bandpass';
      scratchFilter.frequency.setValueAtTime(3600, now);
      scratchFilter.frequency.exponentialRampToValueAtTime(1900, now + duration);
      scratchFilter.Q.setValueAtTime(2.6, now);

      const scratchGain = ctx.createGain();
      scratchGain.gain.setValueAtTime(baseGain * 1.5, now);
      scratchGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      scratchSource.connect(scratchFilter);
      scratchFilter.connect(scratchGain);
      scratchGain.connect(dest);
      scratchSource.start(now);

      // 2. Paper slide body / parchment movement rustle (mid-range drag: 1100Hz -> 650Hz)
      const bodyBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const bodyData = bodyBuffer.getChannelData(0);
      let b0 = 0, b1 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.94 * b0 + white * 0.15;
        b1 = 0.85 * b1 + white * 0.28;
        const env = Math.pow(Math.sin((i / bufferSize) * Math.PI), 1.4);
        bodyData[i] = (b0 + b1) * env * 0.85;
      }

      const bodySource = ctx.createBufferSource();
      bodySource.buffer = bodyBuffer;

      const bodyFilter = ctx.createBiquadFilter();
      bodyFilter.type = 'bandpass';
      bodyFilter.frequency.setValueAtTime(1400, now);
      bodyFilter.frequency.exponentialRampToValueAtTime(650, now + duration);
      bodyFilter.Q.setValueAtTime(1.4, now);

      const bodyGain = ctx.createGain();
      bodyGain.gain.setValueAtTime(baseGain * 0.9, now);
      bodyGain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      bodySource.connect(bodyFilter);
      bodyFilter.connect(bodyGain);
      bodyGain.connect(dest);
      bodySource.start(now);
    } catch (e) {
      console.warn('Paper scratch audio error:', e);
    }
  }

  /**
   * Message in a Bottle: Ocean Wave Splash & Tidal Liquid Swell
   */
  public playOceanSplash(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;
      const duration = 1.1;

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
      filter.frequency.setValueAtTime(650, now);
      filter.frequency.linearRampToValueAtTime(1800, now + 0.4);
      filter.frequency.exponentialRampToValueAtTime(320, now + duration);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(dest);

      noise.start(now);
    } catch (e) {
      console.warn('Splash audio error:', e);
    }
  }

  /**
   * Letter Handover / Aerodynamic Envelope Flight & Wax Seal Ring Chime
   */
  public playLetterHandoverGlide(): void {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const dest = this.getDestination(ctx);
      const now = ctx.currentTime;

      // 1. Aerodynamic parchment whoosh glide (0.45s)
      const bufferSize = ctx.sampleRate * 0.45;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const env = Math.sin((i / bufferSize) * Math.PI);
        data[i] = (Math.random() * 2 - 1) * env * 0.8;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const whooshFilter = ctx.createBiquadFilter();
      whooshFilter.type = 'bandpass';
      whooshFilter.frequency.setValueAtTime(600, now);
      whooshFilter.frequency.linearRampToValueAtTime(1600, now + 0.2);
      whooshFilter.frequency.exponentialRampToValueAtTime(350, now + 0.45);
      whooshFilter.Q.setValueAtTime(1.6, now);

      const whooshGain = ctx.createGain();
      whooshGain.gain.setValueAtTime(0.7, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

      noise.connect(whooshFilter);
      whooshFilter.connect(whooshGain);
      whooshGain.connect(dest);
      noise.start(now);

      // 2. Royal Seal Golden Arrival Chime (at 0.28s)
      setTimeout(() => {
        try {
          const ctx2 = this.getAudioContext();
          if (!ctx2) return;
          const now2 = ctx2.currentTime;
          const chime = ctx2.createOscillator();
          const chimeGain = ctx2.createGain();
          chime.type = 'sine';
          chime.frequency.setValueAtTime(1046.5, now2); // C6 Note
          chime.frequency.exponentialRampToValueAtTime(1318.5, now2 + 0.25); // E6

          chimeGain.gain.setValueAtTime(0.45, now2);
          chimeGain.gain.exponentialRampToValueAtTime(0.001, now2 + 0.35);

          chime.connect(chimeGain);
          chimeGain.connect(this.getDestination(ctx2));
          chime.start(now2);
          chime.stop(now2 + 0.36);
        } catch (_) {}
      }, 260);
    } catch (e) {
      console.warn('Handover audio error:', e);
    }
  }
}

export const waxSealAudio = new WaxSealAudioEngine();

/**
 * Automatically attaches tactile paper scrolling acoustic feedback to all interactive click elements
 * Uses native 'click' event so touch scrolling/sliding on mobile does NOT trigger any sound!
 */
export function initGlobalUiClickSound(): void {
  if (typeof window === 'undefined') return;

  let lastTapTime = 0;
  const handleClick = (e: MouseEvent) => {
    const now = Date.now();
    if (now - lastTapTime < 60) return; // 60ms debounce

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
