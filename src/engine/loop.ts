// Fixed-timestep game loop with a render callback. Decouples simulation rate
// from frame rate and supports a speed multiplier (1x/2x/3x).
const STEP = 1 / 60;

export class GameLoop {
  private raf = 0;
  private last = 0;
  private acc = 0;
  private running = false;
  speed = 1;

  constructor(
    private step: (dt: number) => void,
    private render: () => void,
  ) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    this.acc = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    // Clamp to avoid spiral-of-death after a tab switch.
    const elapsed = Math.min(0.25, (now - this.last) / 1000);
    this.last = now;
    this.acc += elapsed * this.speed;
    let guard = 0;
    while (this.acc >= STEP && guard < 300) {
      this.step(STEP);
      this.acc -= STEP;
      guard++;
    }
    this.render();
    this.raf = requestAnimationFrame(this.frame);
  };
}
