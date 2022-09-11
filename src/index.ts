let speed = 0;
let paused = false;
let allParticles: Particle[] = [];
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
  children: number;
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
  return Math.random() * 0.5 - 0.25;
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
        children: 0,
        size: START_PARTICLE_SIZE,
      }),
    );
  }
  return group;
};

const move = (a: Particle, p2: Particle[]) => {
  if (!a.alive) {
    return;
  }

  let fx = 0;
  let fy = 0;
  let foundCandidates = false;

  for (let j = 0; j < p2.length; j++) {
    const b = p2[j];

    if (a.id === b.id || !b.alive || a.color === b.color || b.nutrient <= 0.75) {
      continue;
    }

    foundCandidates = true;

    a.nutrient -= 0.0001;
    a.x += randomWalk();
    a.y += randomWalk();

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

  let speed = 0.5;
  if (a.nutrient > 0.8) {
    speed = 0.8;
  }

  if (foundCandidates) {
    a.vx = (a.vx + fx) * speed;
    a.vy = (a.vy + fy) * speed;

    if (a.nutrient <= 0.3) {
      a.vx *= 0.8;
      a.vy *= 0.8;
    }

    a.x += a.vx;
    a.y += a.vy;
  }

  if (a.x <= 0 || a.x >= CANVAS_SIZE - a.size) {
    a.vx *= -1;
  }

  if (a.y <= 0 || a.y >= CANVAS_SIZE - a.size) {
    a.vy *= -1;
  }
};

const reproduce = (a: Particle, p2: Particle[]): Particle[] => {
  const newParticles: Particle[] = [];

  if (!a.alive || a.children >= 3 || a.nutrient < 0.8 || a.age > 0.75 || p2.length >= 1000) {
    return newParticles;
  }

  let foundCandidates = false;

  for (let j = 0; j < p2.length; j++) {
    const b = p2[j];

    if (a.id === b.id || a.color !== b.color || !b.alive || b.nutrient < 0.75 || b.reproduce < 0.5) {
      continue;
    }

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d <= a.size) {
      foundCandidates = true;
      a.reproduce += 0.01;
    }
  }

  if (foundCandidates && a.reproduce >= 0.9 && a.nutrient >= 0.75 && a.energy >= 0.75) {
    a.reproduce = 0;
    a.size *= 0.8;
    a.nutrient *= 0.5;
    a.energy *= 0.5;
    a.children += 1;
    a.age -= Math.random() * 0.001;

    const born = {
      ...a,
      age: 0,
      energy: 0.8,
      children: 0,
      reproduce: 0,
      nutrient: 0.3,
      vx: a.vx * 0.3,
      vy: a.vy * 0.3,
      size: START_PARTICLE_SIZE * 0.5,
      id: a.id + 0.001 + Math.random() * 0.001,
    };

    newParticles.push(born);
  }

  if (a.reproduce >= 1) {
    a.reproduce = 1;
  }

  return newParticles;
};

const eats = (a: Particle, p2: Particle[]) => {
  if (!a.alive || a.nutrient >= 0.8) {
    return;
  }

  let hasEaten = false;

  for (let j = 0; j < p2.length; j++) {
    const b = p2[j];
    if (a.id === b.id || a.color === b.color || !b.alive || b.nutrient <= 0.25) {
      continue;
    }

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d <= a.size) {
      hasEaten = true;
      a.nutrient += 0.05;
      b.nutrient -= 0.01;
      a.reproduce += 0.0005;
      a.vx *= 1.01;
      b.vx *= 0.95;
      if (a.size <= START_PARTICLE_SIZE) {
        a.size *= 1.01;
      }
    }
  }

  if (!hasEaten) {
    a.nutrient -= 0.005;
    a.energy -= 0.005;
    a.size *= 0.99;
    a.vx *= 0.95;
  }

  if (a.nutrient <= 0.3) {
    a.vx *= 0.5;
    a.vy *= 0.5;
  }

  if (a.nutrient <= 0) {
    a.alive = false;
  }
};

const age = (a: Particle) => {
  if (!a.alive) {
    return;
  }

  if (a.age <= 0) {
    a.age = 0;
  }

  a.age += Math.random() * 0.001;
  a.reproduce += Math.random() * 0.0001;

  if (a.age >= 1) {
    a.alive = false;
  }

  if (a.age >= 0.9) {
    a.color = 'gray';
  }
};

const update = async (
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  rules: (particles: Particle[]) => Promise<Particle[]>,
) => {
  const newParticles = (await rules(particles)).filter((p) => p.alive);
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  draw(ctx, 0, 0, CANVAS_SIZE, 'black');
  newParticles.forEach((p) => {
    draw(ctx, p.x, p.y, p.size, p.color);
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

  const red = createGroup(ctx, 0, 200, CANVAS_SIZE - 50, 'red');
  const white = createGroup(ctx, red.length, 200, CANVAS_SIZE - 50, 'white');
  const green = createGroup(ctx, white.length, 100, CANVAS_SIZE - 50, 'green');
  allParticles = [...white, ...red, ...green];

  await update(ctx, allParticles, async (particles: Particle[]) => {
    if (!paused) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.size < START_PARTICLE_SIZE / 2) {
          p.size = START_PARTICLE_SIZE / 2;
        }
        eats(p, particles);
        particles.push(...reproduce(p, particles));
        move(p, particles);
        age(p);
      }
      if (particles.length < 300) {
        // 5 new of each is enough to keep the simulation running in a good state
        particles.push(...createGroup(ctx, 0, 5, CANVAS_SIZE - 50, 'white'));
        particles.push(...createGroup(ctx, 0, 5, CANVAS_SIZE - 50, 'red'));
        particles.push(...createGroup(ctx, 0, 5, CANVAS_SIZE - 50, 'green'));
      }
      if (speed > 0) {
        await new Promise((resolve) => setTimeout(resolve, speed));
      }
    }
    return particles;
  });
};

document.getElementById('pause')?.addEventListener('click', () => {
  paused = !paused;
  console.log(allParticles);
});

document.getElementById('speed')?.addEventListener('change', (e) => {
  const value = (e.target as HTMLInputElement).value;
  if (value) {
    speed = parseInt(value, 10);
  }
});

run().then(() => console.log('done'));
