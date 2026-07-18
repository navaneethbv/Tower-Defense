export type SoundName = "deploy" | "ability" | "wave" | "boss" | "hatch" | "purchase" | "victory" | "defeat";

const SOUNDS: Record<SoundName, { frequency: number; duration: number; volume: number }> = {
  deploy: { frequency: 330, duration: 0.08, volume: 0.025 },
  ability: { frequency: 620, duration: 0.14, volume: 0.035 },
  wave: { frequency: 440, duration: 0.1, volume: 0.025 },
  boss: { frequency: 130, duration: 0.24, volume: 0.04 },
  hatch: { frequency: 760, duration: 0.22, volume: 0.035 },
  purchase: { frequency: 520, duration: 0.09, volume: 0.025 },
  victory: { frequency: 880, duration: 0.3, volume: 0.04 },
  defeat: { frequency: 110, duration: 0.28, volume: 0.035 },
};

let audioContext: AudioContext | null = null;

export function playSound(name: SoundName, muted: boolean): void {
  if (muted || typeof AudioContext === "undefined") return;
  try {
    audioContext ??= new AudioContext();
    const sound = SOUNDS[name];
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(sound.frequency, now);
    gain.gain.setValueAtTime(sound.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + sound.duration);
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + sound.duration);
  } catch {
    // Audio is optional and must never interrupt play.
  }
}
