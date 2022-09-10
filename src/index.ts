const CANVAS_SIZE = 800;
const START_PARTICLE_SIZE = 10;

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  size: number;
  color: string;
  alive: boolean;
  energy: number;
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

const randomWalk = () => {
  return Math.random() * 2 - 1;
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
        age: 0,
        energy: 0.02,
        alive: true,
        nutrient: 1,
        reproduce: 0,
        size: START_PARTICLE_SIZE,
      }),
    );
  }
  return group;
};

const avoids = (p1: Particle[], p2: Particle[]) => {
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
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > a.size * 10) {
        a.energy += 0.02;
      } else if (distance < a.size * 2) {
        a.energy -= 0.05;
      }

      if (a.energy < 0) {
        a.energy = 0.01;
      } else if (a.energy > 1) {
        a.energy = 0.99;
      }

      const grav = -a.energy;
      if (distance > 0 && distance < a.size * 5) {
        const F = grav * (1 / distance);
        fx += F * dx;
        fy += F * dy;
      }
    }

    a.vx = (a.vx + fx) * 0.6;
    a.vy = (a.vy + fy) * 0.6;

    if (a.nutrient <= 0.3) {
      a.vx *= 0.8;
      a.vy *= 0.8;
    }

    a.x += a.vx + randomWalk();
    a.y += a.vy + randomWalk();

    if (a.x <= 0 || a.x >= CANVAS_SIZE - a.size) {
      a.vx *= -1;
    }

    if (a.y <= 0 || a.y >= CANVAS_SIZE - a.size) {
      a.vy *= -1;
    }
  }
};

const reproduce = (p1: Particle[], p2: Particle[]): Particle[] => {
  const newParticles: Particle[] = [];

  for (let i = 0; i < p1.length; i++) {
    const a = p1[i];

    if (!a.alive) {
      continue;
    }

    for (let j = 0; j < p2.length; j++) {
      const b = p2[j];
      if (a.id === b.id || !b.alive) {
        continue;
      }

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d <= a.size * 1.5 && a.nutrient > 0.5) {
        a.reproduce += 0.005;
        a.age -= Math.random() * 0.001;
      }
    }

    if (a.reproduce >= 50 && a.nutrient >= 0.5) {
      a.reproduce = 0;
      a.size *= 0.8;
      a.nutrient *= 0.8;
      a.age += Math.random() * 0.01;
      const born = {
        ...a,
        age: 0,
        reproduce: 0,
        nutrient: 0.9,
        vx: a.vx * 0.3,
        vy: a.vy * 0.3,
        id: a.id + 0.001 + Math.random() * 0.001,
        energy: Math.random() * 0.5 + 0.5,
        size: START_PARTICLE_SIZE * 0.5,
      };
      newParticles.push(born);
    }
  }

  return newParticles;
};

const eats = (p1: Particle[], p2: Particle[]) => {
  for (let i = 0; i < p1.length; i++) {
    const a = p1[i];

    if (!a.alive) {
      continue;
    }

    for (let j = 0; j < p2.length; j++) {
      const b = p2[j];
      if (a.id === b.id || !b.alive) {
        continue;
      }

      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const d = Math.sqrt(dx * dx + dy * dy);

      if (d <= a.size * 2) {
        a.nutrient += 0.01;
        a.vx *= 1.01;
        if (a.size <= 20) {
          a.size *= 1.01;
        }
      } else if (d > a.size * 2) {
        a.nutrient -= 0.0001;
        a.vx *= 0.99;
        if (a.size >= START_PARTICLE_SIZE) {
          a.size *= 0.99;
        }
      }
    }

    if (a.nutrient <= 0.3) {
      a.vx *= 0.5;
      a.vy *= 0.5;
    }

    if (a.nutrient <= 0) {
      a.alive = false;
    }
  }
};

const age = (p1: Particle[]) => {
  for (let i = 0; i < p1.length; i++) {
    const a = p1[i];
    if (!a.alive) {
      continue;
    }

    a.age += Math.random() * 0.005;
    if (a.age >= 1) {
      a.alive = false;
    }
  }
};

const update = (ctx: CanvasRenderingContext2D, particles: Particle[], rules: (particles: Particle[]) => Particle[]) => {
  const newParticles = rules(particles).filter((p) => p.alive);
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  draw(ctx, 0, 0, CANVAS_SIZE, 'black');
  newParticles.forEach((p) => {
    if (p.alive) {
      draw(ctx, p.x, p.y, p.size, p.color);
    }
  });
  const countElement = document.getElementById('count');
  if (countElement) {
    countElement.innerText = `${newParticles.length} particles`;
  }
  requestAnimationFrame(() => update(ctx, newParticles, rules));
};

const run = async () => {
  console.log('start');

  const ctx = getContext2D();

  const red = createGroup(ctx, 0, 100, CANVAS_SIZE - 50, 'red');
  const white = createGroup(ctx, red.length, 200, CANVAS_SIZE - 50, 'white');
  const green = createGroup(ctx, white.length, 100, CANVAS_SIZE - 50, 'green');
  const allParticles = [...white, ...red, ...green];

  update(ctx, allParticles, (particles: Particle[]) => {
    const newRed: Particle[] = particles.filter((p) => p.color === 'red');
    const newWhite: Particle[] = particles.filter((p) => p.color === 'white');
    const newGreen: Particle[] = particles.filter((p) => p.color === 'green');

    eats(red, white);
    eats(white, green);
    eats(green, red);

    newRed.push(...reproduce(red, red));
    newWhite.push(...reproduce(white, white));
    newGreen.push(...reproduce(green, green));

    avoids(newWhite, newRed);
    avoids(newGreen, newWhite);
    avoids(newRed, newGreen);

    age(newRed);
    age(newWhite);
    age(newGreen);

    return [...newRed, ...newWhite, ...newGreen];
  });
};

run().then(() => console.log('done'));
