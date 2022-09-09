const CANVAS_SIZE = 500;
const PARTICLE_SIZE = 5;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
}

const getContext2D = (): CanvasRenderingContext2D => {
  const el = document.getElementById('simulation') as HTMLCanvasElement;
  if (!el) {
    throw new Error('Could not find canvas element');
  }

  const ctx = el.getContext('2d');
  if (!ctx) {
    throw new Error('Could not get 2d context');
  }

  return ctx;
};

const draw = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
};

const particle = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string): Particle => {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    color,
  };
};

const random = () => {
  return Math.random() * 480;
};

const createGroup = (ctx: CanvasRenderingContext2D, n: number, color: string) => {
  const group = [];
  for (let i = 0; i < n; i++) {
    group.push(particle(ctx, random(), random(), color));
  }
  return group;
};

const force = (p1: Particle[], p2: Particle[], grav: number, fric: number) => {
  for (let i = 0; i < p1.length; i++) {
    let fx = 0;
    let fy = 0;

    const a = p1[i];

    for (let j = 0; j < p2.length; j++) {
      const b = p2[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d > 0 && d < 80) {
        const F = grav * (1 / d);
        fx += F * dx;
        fy += F * dy;
      }
    }

    a.vx = (a.vx + fx) * fric;
    a.vy = (a.vy + fy) * fric;

    a.x += a.vx;
    a.y += a.vy;

    if (a.x <= 0 || a.x >= CANVAS_SIZE - PARTICLE_SIZE) {
      a.vx *= -PARTICLE_SIZE;
    }

    if (a.y <= 0 || a.y >= CANVAS_SIZE - PARTICLE_SIZE) {
      a.vy *= -PARTICLE_SIZE;
    }
  }
};

const update = (ctx: CanvasRenderingContext2D, particles: Particle[], rules: () => void) => {
  rules();
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  draw(ctx, 0, 0, CANVAS_SIZE, 'black');
  particles.forEach((p) => {
    draw(ctx, p.x, p.y, PARTICLE_SIZE, p.color);
  });
  requestAnimationFrame(() => update(ctx, particles, rules));
};

const run = async () => {
  const ctx = getContext2D();
  const yellow = createGroup(ctx, 300, 'yellow');
  const red = createGroup(ctx, 300, 'red');
  const green = createGroup(ctx, 200, 'green');
  const purple = createGroup(ctx, 100, 'purple');
  update(ctx, [...yellow, ...red, ...green, ...purple], () => {
    force(red, red, -0.05, 0.5);
    force(red, green, 0.08, 0.5);
    force(red, purple, 0.02, 0.5);
    force(yellow, red, 0.1, 0.5);
    force(yellow, yellow, -0.001, 0.5);
    force(yellow, green, 0.02, 0.5);
    force(green, red, -0.05, 0.5);
    force(green, green, 0.03, 0.5);
    force(purple, red, -0.02, 0.5);
    force(purple, yellow, 0.03, 0.5);
    force(purple, green, -0.01, 0.5);
    force(purple, purple, 0.02, 0.5);
  });
};

run().then(() => console.log('done'));
