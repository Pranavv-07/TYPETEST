export type MechanicalSwitchType = 'blue' | 'brown' | 'red' | 'panda' | 'topre';

export interface SwitchProfileInfo {
  id: MechanicalSwitchType;
  name: string;
  category: 'Clicky' | 'Tactile' | 'Linear' | 'Thocky' | 'Electrostatic';
  description: string;
  color: string;
}

export const SWITCH_PROFILES: SwitchProfileInfo[] = [
  { id: 'blue', name: 'Cherry MX Blue', category: 'Clicky', description: 'Crisp, high-pitched mechanical click with tactile snap', color: '#38bdf8' },
  { id: 'brown', name: 'Cherry MX Brown', category: 'Tactile', description: 'Balanced tactile bump with medium clack', color: '#b45309' },
  { id: 'red', name: 'Cherry MX Red', category: 'Linear', description: 'Smooth linear actuation, soft bottom-out', color: '#ef4444' },
  { id: 'panda', name: 'Holy Panda U4T', category: 'Thocky', description: 'Deep acoustic resonance and satisfying bass thock', color: '#f59e0b' },
  { id: 'topre', name: 'Topre 45g', category: 'Electrostatic', description: 'Silky smooth raindrop pop with muffled bottom-out', color: '#a855f7' }
];

// Web Audio API mechanical keyboard sound synthesizer
class SoundController {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;
  public activeSwitch: MechanicalSwitchType = 'panda';
  public volume: number = 0.8;

  private init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
  }

  public setSwitch(switchType: MechanicalSwitchType) {
    this.activeSwitch = switchType;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playKeyClick(overrideSwitch?: MechanicalSwitchType) {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const sw = overrideSwitch || this.activeSwitch;
      const t = this.ctx.currentTime;
      const baseVol = 0.1 * this.volume;

      // Master gain for this click
      const masterGain = this.ctx.createGain();
      masterGain.connect(this.ctx.destination);

      if (sw === 'blue') {
        // High click transient + bottom out clack
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.type = 'triangle';
        const clickFreq = 2400 + Math.random() * 400;
        clickOsc.frequency.setValueAtTime(clickFreq, t);
        clickOsc.frequency.exponentialRampToValueAtTime(400, t + 0.015);
        clickGain.gain.setValueAtTime(baseVol * 1.2, t);
        clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
        clickOsc.connect(clickGain);
        clickGain.connect(masterGain);
        clickOsc.start(t);
        clickOsc.stop(t + 0.02);

        // Body clack
        const bodyOsc = this.ctx.createOscillator();
        const bodyGain = this.ctx.createGain();
        bodyOsc.type = 'sine';
        bodyOsc.frequency.setValueAtTime(580 + Math.random() * 60, t);
        bodyOsc.frequency.exponentialRampToValueAtTime(140, t + 0.035);
        bodyGain.gain.setValueAtTime(baseVol * 0.8, t);
        bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
        bodyOsc.connect(bodyGain);
        bodyGain.connect(masterGain);
        bodyOsc.start(t);
        bodyOsc.stop(t + 0.04);
      } else if (sw === 'brown') {
        // Tactile bump thud
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        const freq = 520 + Math.random() * 80;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(160, t + 0.035);
        gain.gain.setValueAtTime(baseVol * 0.9, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.038);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.04);
      } else if (sw === 'red') {
        // Soft linear bottom-out
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const freq = 380 + Math.random() * 50;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(110, t + 0.028);
        gain.gain.setValueAtTime(baseVol * 0.7, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.035);
      } else if (sw === 'panda') {
        // Deep acoustic resonant Thock
        const lowOsc = this.ctx.createOscillator();
        const lowGain = this.ctx.createGain();
        lowOsc.type = 'sine';
        const lowFreq = 260 + Math.random() * 40;
        lowOsc.frequency.setValueAtTime(lowFreq, t);
        lowOsc.frequency.exponentialRampToValueAtTime(75, t + 0.05);
        lowGain.gain.setValueAtTime(baseVol * 1.4, t);
        lowGain.gain.exponentialRampToValueAtTime(0.001, t + 0.052);
        lowOsc.connect(lowGain);
        lowGain.connect(masterGain);
        lowOsc.start(t);
        lowOsc.stop(t + 0.055);

        // Subtle wooden housing reverb
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();
        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(800 + Math.random() * 100, t);
        popOsc.frequency.exponentialRampToValueAtTime(200, t + 0.02);
        popGain.gain.setValueAtTime(baseVol * 0.5, t);
        popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.022);
        popOsc.connect(popGain);
        popGain.connect(masterGain);
        popOsc.start(t);
        popOsc.stop(t + 0.025);
      } else {
        // Topre raindrop pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const freq = 420 + Math.random() * 40;
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(90, t + 0.04);
        gain.gain.setValueAtTime(baseVol * 1.1, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.042);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.045);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  }

  public playErrorSound() {
    if (!this.enabled || this.volume <= 0) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(130, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.14 * this.volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.09);
    } catch {
      // ignore
    }
  }
}

export const soundController = new SoundController();
