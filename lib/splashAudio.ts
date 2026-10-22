/**
 * Procedural splash sounds (Web Audio API, no audio files):
 *   0.0 – 1.2 s  cool airflow: band-passed noise that swells and sweeps
 *   1.5 s        a faint glassy shimmer as the ice forms
 *   2.4 – 2.65 s ice cracking (sharp clicks + a low thud), then the shatter: a noise burst sweeping down and tinkling shards
 *
 * Browsers may block audio until the user taps. Nothing here throws: if the context is suspended we wait for the first
 * tap / key press and play whatever part of the sequence is still ahead; if audio is unavailable the splash is simply silent.
 */

export const SOUND_TIMES = { whoosh: 0, shimmer: 1.5, crackStart: 2.4, shatter: 2.65, end: 3.3 };

type Ctx = AudioContext;

export function createSplashAudio() {
  let ctx: Ctx | null = null;
  let master: GainNode | null = null;
  let noise: AudioBuffer | null = null;
  let t0 = 0;
  let stopped = false;
  let scheduledFrom = Infinity; // earliest timeline position already scheduled
  const unlockEvents = ["pointerdown", "keydown", "touchstart"] as const;

  const elapsed = () => (performance.now() - t0) / 1000;

  const build = (): Ctx | null => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      const c = new AC();
      const comp = c.createDynamicsCompressor(); // keeps the stacked transients from clipping
      master = c.createGain();
      master.gain.value = 0.7;
      master.connect(comp);
      comp.connect(c.destination);
      noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = noise.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return c;
    } catch {
      return null;
    }
  };

  const burst = (c: Ctx, at: number, dur: number, vol: number, filter: BiquadFilterType, f0: number, f1: number, q = 1) => {
    const src = c.createBufferSource();
    src.buffer = noise;
    const f = c.createBiquadFilter();
    f.type = filter;
    f.Q.value = q;
    f.frequency.setValueAtTime(f0, at);
    f.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), at + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(master!);
    src.start(at, Math.random());
    src.stop(at + dur + 0.05);
  };

  const tone = (c: Ctx, at: number, freq: number, dur: number, vol: number, type: OscillatorType = "sine", f1?: number) => {
    const o = c.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, at + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(master!);
    o.start(at);
    o.stop(at + dur + 0.05);
  };

  /** Schedules every part of the sequence that is still ahead of `from` seconds on the splash timeline. */
  const schedule = (from: number) => {
    const c = ctx;
    if (!c || !master || stopped || from >= scheduledFrom) return;
    scheduledFrom = from;
    const at = (t: number) => c.currentTime + Math.max(0, t - from); // timeline seconds -> context time
    const ahead = (t: number) => t >= from - 0.02;

    // airflow whoosh (only worth starting if most of it is still ahead)
    if (from < 0.6) {
      const start = at(0);
      const dur = 1.25 - from;
      const src = c.createBufferSource();
      src.buffer = noise;
      src.loop = true;
      const bp = c.createBiquadFilter();
      bp.type = "bandpass";
      bp.Q.value = 0.9;
      bp.frequency.setValueAtTime(320, start);
      bp.frequency.exponentialRampToValueAtTime(1900, start + dur * 0.55);
      bp.frequency.exponentialRampToValueAtTime(750, start + dur);
      const lp = c.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 4200;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, start);
      g.gain.linearRampToValueAtTime(0.42, start + Math.min(0.5, dur * 0.45));
      g.gain.linearRampToValueAtTime(0.0001, start + dur);
      src.connect(bp).connect(lp).connect(g).connect(master);
      src.start(start);
      src.stop(start + dur + 0.05);
    }

    // ice forming: a faint glassy shimmer
    if (ahead(SOUND_TIMES.shimmer)) {
      const s = at(SOUND_TIMES.shimmer);
      tone(c, s, 2400, 0.5, 0.05);
      tone(c, s + 0.03, 3600, 0.45, 0.035);
      tone(c, s + 0.06, 5200, 0.35, 0.02);
    }

    // cracking: thud + three sharpening clicks
    if (ahead(SOUND_TIMES.crackStart)) {
      const s = at(SOUND_TIMES.crackStart);
      tone(c, s, 110, 0.16, 0.22, "sine", 55);
      [0, 0.07, 0.15].forEach((o, i) => burst(c, s + o, 0.07, 0.3 + i * 0.12, "highpass", 2600 + i * 700, 2600 + i * 700));
    }

    // shatter: bright burst sweeping down + tinkling shards
    if (ahead(SOUND_TIMES.shatter)) {
      const s = at(SOUND_TIMES.shatter);
      burst(c, s, 0.6, 0.6, "bandpass", 9500, 2400, 1.1);
      burst(c, s, 0.18, 0.35, "highpass", 5000, 5000);
      for (let i = 0; i < 14; i++) {
        const when = s + 0.02 + (i / 14) * 0.5 + Math.random() * 0.03;
        tone(c, when, 3000 + Math.random() * 5200, 0.07 + Math.random() * 0.09, 0.03 + Math.random() * 0.05, "sine", 1800 + Math.random() * 1500);
      }
    }
  };

  const unlock = () => {
    const c = ctx;
    if (!c || stopped) return;
    c.resume().then(
      () => {
        for (const e of unlockEvents) window.removeEventListener(e, unlock);
        schedule(elapsed());
      },
      () => {},
    );
  };

  return {
    start() {
      t0 = performance.now();
      ctx = build();
      if (!ctx) return;
      try {
        // Runs immediately when autoplay is allowed (e.g. a WebView with autoplay enabled, or after any prior tap).
        // If the browser allows it (now or after a tap), the pending resume joins the timeline at its real position.
        void ctx.resume().then(() => schedule(elapsed()), () => {});
      } catch {
        /* ignore */
      }
      if (ctx.state === "running") schedule(0);
      else {
        // Autoplay policy: stay silent for now (nothing is queued on the frozen clock), then join the timeline
        // at its real position on the first tap / key press.
        for (const e of unlockEvents) window.addEventListener(e, unlock, { passive: true });
      }
    },
    stop() {
      stopped = true;
      for (const e of unlockEvents) window.removeEventListener(e, unlock);
      try {
        void ctx?.close();
      } catch {
        /* ignore */
      }
      ctx = null;
    },
  };
}
