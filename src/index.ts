const CANVAS_SIZE = 800;
const START_PARTICLE_SIZE = 10;
const RES = 0.6;

type Type = 'eat' | 'avoid' | 'reproduce';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alive: boolean;
  nutrient: number;
  reproduce: number;
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

const createParticle = (ctx: CanvasRenderingContext2D, particle: Omit<Particle, 'vx' | 'vy'>): Particle => {
  return {
    ...particle,
    vx: 0,
    vy: 0,
  };
};

const random = (area: number) => {
  return Math.random() * area;
};

const createGroup = (ctx: CanvasRenderingContext2D, startPoint: number, n: number, area: number, color: string) => {
  const group = [];
  for (let i = 0; i < n; i++) {
    group.push(
      createParticle(ctx, {
        id: i + startPoint,
        x: random(area),
        y: random(area),
        color,
        alive: true,
        nutrient: 1,
        reproduce: 0,
        size: START_PARTICLE_SIZE,
      }),
    );
  }
  return group;
};

const rule = (p1: Particle[], p2: Particle[], type: Type): Particle[] => {
  const newParticles: Particle[] = [];

  for (let i = 0; i < p1.length; i++) {
    const a = p1[i];

    if (!a.alive) {
      continue;
    }

    let fx = 0;
    let fy = 0;

    for (let j = 0; j < p2.length; j++) {
      const b = p2[j];
      if (a.id === b.id || !b.alive) {
        continue;
      }

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d > 0 && d < a.size * 10) {
        const grav = type === 'eat' ? 1 : -1;
        const F = grav * (1 / d);
        fx += F * dx;
        fy += F * dy;
      }

      if (type === 'reproduce') {
        if (d <= a.size * 1.5 && a.nutrient > 0.5) {
          a.reproduce += 0.01;
        }
      }

      if (type === 'eat') {
        if (d <= a.size * 2) {
          a.nutrient += 0.01;
          a.vx *= 1.01;
          if (a.size <= 20) {
            a.size *= 1.01;
          }
        } else if (d > a.size * 3) {
          a.nutrient -= 0.0001;
          a.vx *= 0.99;
          if (a.size >= START_PARTICLE_SIZE) {
            a.size *= 0.99;
          }
        }
      }
    }

    a.vx = (a.vx + fx) * RES;
    a.vy = (a.vy + fy) * RES;

    if (a.nutrient <= 0.3) {
      a.vx *= 0.9;
      a.vy *= 0.9;
    }

    a.x += a.vx;
    a.y += a.vy;

    if (a.x <= 0 || a.x >= CANVAS_SIZE - a.size) {
      a.vx *= -a.size;
    }

    if (a.y <= 0 || a.y >= CANVAS_SIZE - a.size) {
      a.vy *= -a.size;
    }

    if (a.reproduce >= 50 && a.nutrient >= 0.5) {
      a.reproduce = 0;
      a.size *= 0.8;
      a.nutrient *= 0.8;
      newParticles.push({
        ...a,
        vx: a.vx * 0.5,
        vy: a.vy * 0.5,
        nutrient: 1,
        reproduce: 0,
        size: START_PARTICLE_SIZE,
      });
    }

    if (a.nutrient <= 0) {
      a.alive = false;
    }
  }

  return newParticles;
};

const update = (ctx: CanvasRenderingContext2D, particles: Particle[], rules: () => Particle[]) => {
  const newParticles = rules();
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  draw(ctx, 0, 0, CANVAS_SIZE, 'black');
  particles.forEach((p) => {
    if (p.alive) {
      draw(ctx, p.x, p.y, p.size, p.color);
    }
  });
  requestAnimationFrame(() => update(ctx, [...particles, ...newParticles], rules));
};

const run = async () => {
  const ctx = getContext2D();

  const red = createGroup(ctx, 0, 300, CANVAS_SIZE - 50, 'red');
  const white = createGroup(ctx, red.length, 300, CANVAS_SIZE - 50, 'white');
  const green = createGroup(ctx, white.length, 300, CANVAS_SIZE - 50, 'green');
  const allParticles = [...white, ...red, ...green];

  update(ctx, allParticles, () => {
    const newParticles: Particle[] = [];
    newParticles.push(...rule(red, white, 'eat'));
    newParticles.push(...rule(green, red, 'eat'));
    newParticles.push(...rule(white, green, 'eat'));

    newParticles.push(...rule(red, white, 'avoid'));
    newParticles.push(...rule(green, red, 'avoid'));
    newParticles.push(...rule(white, green, 'avoid'));

    newParticles.push(...rule(red, red, 'reproduce'));
    newParticles.push(...rule(white, white, 'reproduce'));
    newParticles.push(...rule(green, green, 'reproduce'));
    return newParticles;
  });
};

run().then(() => console.log('done'));
