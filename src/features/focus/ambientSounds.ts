/**
 * Pure Web Audio API Ambient Sound Generator
 * Synthesizes peaceful soundscapes locally without external audio assets.
 */

export type AmbientSoundType = 'none' | 'rain' | 'whitenoise' | 'binaural' | 'stream';

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private currentType: AmbientSoundType = 'none';
  private gainNode: GainNode | null = null;
  private noiseNode: AudioNode | null = null;
  private isRunning = false;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public play(type: AmbientSoundType, volume = 0.5) {
    this.stop();
    if (type === 'none') return;

    try {
      const ctx = this.getAudioContext();
      this.currentType = type;
      this.gainNode = ctx.createGain();
      this.gainNode.gain.setValueAtTime(Math.min(Math.max(volume, 0), 1), ctx.currentTime);
      this.gainNode.connect(ctx.destination);

      if (type === 'whitenoise' || type === 'rain' || type === 'stream') {
        // Generate continuous white/pink noise buffer
        const bufferSize = 2 * ctx.sampleRate;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          // Pink-ish noise filter
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          output[i] = (b0 + b1 + b2 + white * 0.05) * 0.11;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        if (type === 'rain') {
          // Low-pass filter for rainfall rumble
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, ctx.currentTime);
          whiteNoise.connect(filter);
          filter.connect(this.gainNode);
        } else if (type === 'stream') {
          // Band-pass for rushing water
          const filter = ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(500, ctx.currentTime);
          filter.Q.setValueAtTime(1.5, ctx.currentTime);
          whiteNoise.connect(filter);
          filter.connect(this.gainNode);
        } else {
          whiteNoise.connect(this.gainNode);
        }

        whiteNoise.start();
        this.noiseNode = whiteNoise;
      } else if (type === 'binaural') {
        // Binaural Alpha waves (e.g. 200Hz left, 210Hz right = 10Hz Alpha beat for focus)
        const oscLeft = ctx.createOscillator();
        const oscRight = ctx.createOscillator();
        const merger = ctx.createChannelMerger(2);

        oscLeft.type = 'sine';
        oscLeft.frequency.setValueAtTime(216, ctx.currentTime);

        oscRight.type = 'sine';
        oscRight.frequency.setValueAtTime(226, ctx.currentTime);

        oscLeft.connect(merger, 0, 0);
        oscRight.connect(merger, 0, 1);
        merger.connect(this.gainNode);

        oscLeft.start();
        oscRight.start();
        this.noiseNode = merger;
      }

      this.isRunning = true;
    } catch (err) {
      console.warn('Web Audio Ambient error:', err);
    }
  }

  public setVolume(vol: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.min(Math.max(vol, 0), 1), this.ctx.currentTime);
    }
  }

  public stop() {
    if (this.noiseNode) {
      try {
        if ('stop' in this.noiseNode && typeof (this.noiseNode as AudioScheduledSourceNode).stop === 'function') {
          (this.noiseNode as AudioScheduledSourceNode).stop();
        }
        this.noiseNode.disconnect();
      } catch {
        // ignore
      }
      this.noiseNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.currentType = 'none';
    this.isRunning = false;
  }

  public getStatus() {
    return { isRunning: this.isRunning, type: this.currentType };
  }
}

export const ambientSoundEngine = new AmbientSoundEngine();
