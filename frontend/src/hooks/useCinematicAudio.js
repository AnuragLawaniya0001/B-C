import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Procedural Web Audio Ambient Soundscape Generator
 * Creates a subtle, atmospheric cinema soundbed (deep golden drone + subtle harmonic shimmer)
 * Zero external audio files required, zero latency, works smoothly offline.
 */
export function useCinematicAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef(null);
  const masterGainRef = useRef(null);
  const nodesRef = useRef([]);

  const stopAudio = useCallback(() => {
    if (!audioCtxRef.current || !masterGainRef.current) return;
    try {
      const now = audioCtxRef.current.currentTime;
      masterGainRef.current.gain.linearRampToValueAtTime(0.0001, now + 0.5);
      setTimeout(() => {
        nodesRef.current.forEach((n) => {
          try {
            n.stop?.();
            n.disconnect?.();
          } catch (e) {}
        });
        nodesRef.current = [];
        setIsPlaying(false);
      }, 550);
    } catch (e) {
      setIsPlaying(false);
    }
  }, []);

  const startAudio = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
        audioCtxRef.current = new AudioContextClass();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;

      // Master Gain
      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.linearRampToValueAtTime(0.12, now + 1.2); // subtle, not overwhelming
      master.connect(ctx.destination);
      masterGainRef.current = master;

      // Layer 1: Sub Bass Warmth (55Hz Root note - A1)
      const osc1 = ctx.createOscillator();
      const osc1Gain = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(55, now);
      osc1Gain.gain.setValueAtTime(0.4, now);
      osc1.connect(osc1Gain);
      osc1Gain.connect(master);
      osc1.start(now);

      // Layer 2: Warm Fifth Harmonic (82.4Hz - E2)
      const osc2 = ctx.createOscillator();
      const osc2Gain = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(82.41, now);
      osc2Gain.gain.setValueAtTime(0.2, now);
      osc2.connect(osc2Gain);
      osc2Gain.connect(master);
      osc2.start(now);

      // Layer 3: Subtle High-end Shimmer Air (Filter sweep)
      const osc3 = ctx.createOscillator();
      const osc3Filter = ctx.createBiquadFilter();
      const osc3Gain = ctx.createGain();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(110, now);
      osc3Filter.type = 'lowpass';
      osc3Filter.frequency.setValueAtTime(320, now);
      osc3Filter.Q.setValueAtTime(2.5, now);
      osc3Gain.gain.setValueAtTime(0.06, now);
      osc3.connect(osc3Filter);
      osc3Filter.connect(osc3Gain);
      osc3Gain.connect(master);
      osc3.start(now);

      nodesRef.current = [osc1, osc2, osc3, osc1Gain, osc2Gain, osc3Gain, osc3Filter];
      setIsPlaying(true);
    } catch (err) {
      console.warn('Web Audio could not start:', err);
      setIsPlaying(false);
    }
  }, []);

  const toggleSound = useCallback(() => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  }, [isPlaying, startAudio, stopAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        try {
          audioCtxRef.current.close();
        } catch (e) {}
      }
    };
  }, [stopAudio]);

  return {
    isPlaying,
    toggleSound,
    startAudio,
    stopAudio,
  };
}

export default useCinematicAudio;

