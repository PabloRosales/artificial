let speed = 0;
let paused = false;
let addRandomParticles = true;
let allParticles: Particle[] = [];
const CANVAS_SIZE = 800;
const START_PARTICLE_SIZE = 5;

interface ParticleBase {
  x: number;
  y: number;
  size: number;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  id: number;
  vx: number;
  vy: number;
  age: number;
  size: number;
  color: string;
  alive: boolean;
  energy: number;
  angle: number;
  nutrient: number;
  reproduce: number;
  children: number;
  particles: ParticleBase[];
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

const distance = (a: Particle, b: Particle) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

const randomArea = (area: number) => {
  return Math.random() * area;
};

const createGroup = (
  ctx: CanvasRenderingContext2D,
  n: number,
  area: number,
  color: string,
  structure: ParticleBase[],
) => {
  const group = [];
  for (let i = 0; i < n; i++) {
    group.push(
      createParticle(ctx, {
        id: Date.now() + i,
        x: randomArea(area),
        y: randomArea(area),
        color,
        age: 0,
        energy: 1,
        alive: true,
        nutrient: 1,
        reproduce: 0,
        children: 0,
        size: START_PARTICLE_SIZE,
        angle: 0,
        particles: structure,
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
  let angle = 0;
  let foundCandidates = false;

  for (let j = 0; j < p2.length; j++) {
    const b = p2[j];

    if (a.id === b.id || !b.alive || a.color === b.color || b.nutrient <= 0.75) {
      continue;
    }

    foundCandidates = true;

    a.nutrient -= 0.0001;
    if (a.color === 'red') {
      a.x += randomWalk();
      a.y += randomWalk();
    }

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    angle = a.angle + Math.atan2(dy, dx);

    if (distance > a.size) {
      a.energy += 0.05;
    } else if (distance < a.size) {
      a.energy -= 0.02;
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

  if (foundCandidates) {
    a.vx = (a.vx + fx) * 0.5;
    a.vy = (a.vy + fy) * 0.5;

    if (a.nutrient <= 0.3) {
      a.vx *= 0.8;
      a.vy *= 0.8;
    }

    a.angle = angle;

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

  if (!a.alive || a.children >= 2 || a.nutrient < 0.75 || p2.length >= 500) {
    return newParticles;
  }

  let foundCandidates = false;

  for (let j = 0; j < p2.length; j++) {
    const b = p2[j];

    if (a.id === b.id || a.color !== b.color || !b.alive || b.nutrient < 0.75 || b.reproduce < 0.3) {
      continue;
    }

    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const d = Math.sqrt(dx * dx + dy * dy);

    if (d <= a.size) {
      foundCandidates = true;
      a.reproduce += 0.02;
    }
  }

  if (foundCandidates && a.reproduce >= 0.9 && a.nutrient >= 0.75 && a.energy >= 0.75) {
    a.reproduce = 0;
    a.size *= 0.8;
    a.nutrient *= 0.8;
    a.energy *= 0.8;
    a.children += 1;
    a.age -= Math.random() * 0.001;

    const born = {
      ...a,
      age: 0,
      children: 0,
      energy: Math.random() * 0.2,
      nutrient: Math.random() * 0.5,
      reproduce: Math.random() * 0.5,
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
  if (!a.alive || a.nutrient >= 0.9) {
    return;
  }

  let hasEaten = false;

  for (let j = 0; j < p2.length; j++) {
    const b = p2[j];
    if (a.id === b.id || a.color === b.color || !b.alive || b.nutrient <= 0.25) {
      continue;
    }

    const d = distance(a, b);

    if (d <= a.size) {
      hasEaten = true;
      a.nutrient += 0.05;
      b.nutrient -= 0.001;
      a.reproduce += 0.01;
      a.vx *= 1.01;
      b.vx *= 0.95;
      if (a.size <= START_PARTICLE_SIZE) {
        a.size *= 1.01;
      }
    }
  }

  if (!hasEaten) {
    a.nutrient -= 0.0001;
    a.energy -= 0.0001;
    a.size *= 0.99;
    a.vx *= 0.95;
  }

  if (a.nutrient <= 0.3) {
    a.vx *= 0.5;
    a.vy *= 0.5;
  }
};

const age = (a: Particle) => {
  if (!a.alive) {
    return;
  }

  if (a.age <= 0) {
    a.age = 0;
  }

  a.age += Math.random() * 0.01;
  a.reproduce += Math.random() * 0.0001;

  if (a.age >= 1) {
    a.alive = false;
  }

  if (a.age >= 0.9) {
    a.color = 'gray';
  }
};

const update = async (ctx: CanvasRenderingContext2D, rules: (particles: Particle[]) => Promise<Particle[]>) => {
  allParticles = (await rules(allParticles)).filter((p) => p.alive);
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  draw(ctx, 0, 0, CANVAS_SIZE, 'black');
  allParticles.forEach((p) => {
    draw(ctx, p.x, p.y, p.size, p.color);
    for (let i = 0; i < p.particles.length; i++) {
      const c = p.particles[i];
      const childX = p.x + Math.cos(p.angle * 0.5) * p.size;
      const childY = p.y + Math.sin(p.angle * 0.5) * p.size;
      draw(ctx, childX, childY, c.size, c.color);
    }
  });
  const countElement = document.getElementById('count');
  if (countElement) {
    countElement.innerText = `${allParticles.length} particles`;
  }
  requestAnimationFrame(() => update(ctx, rules));
};

const run = async () => {
  console.log('start');

  const ctx = getContext2D();

  const redStructure = [
    { x: START_PARTICLE_SIZE + START_PARTICLE_SIZE / 2, y: 0, color: 'white', size: START_PARTICLE_SIZE * 0.5 },
  ];
  const red = createGroup(ctx, 200, CANVAS_SIZE - 50, 'red', redStructure);

  const whiteStructure = [
    { x: START_PARTICLE_SIZE + START_PARTICLE_SIZE / 2, y: 0, color: 'yellow', size: START_PARTICLE_SIZE * 0.5 },
  ];
  const white = createGroup(ctx, 200, CANVAS_SIZE - 50, 'white', whiteStructure);

  allParticles = [...white, ...red];

  await update(ctx, async (particles: Particle[]) => {
    if (!paused) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (p.size < START_PARTICLE_SIZE) {
          p.size = START_PARTICLE_SIZE;
        }

        eats(p, particles);
        particles.push(...reproduce(p, particles));
        move(p, particles);
        age(p);

        if (p.nutrient <= 0) {
          p.alive = false;
        }

        if (p.x <= 0) {
          p.x = 0;
        } else if (p.x >= CANVAS_SIZE) {
          p.x = CANVAS_SIZE;
        }

        if (p.y <= 0) {
          p.y = 0;
        } else if (p.y >= CANVAS_SIZE) {
          p.y = CANVAS_SIZE;
        }
      }
      if (addRandomParticles && particles.length < 25) {
        particles.push(...createGroup(ctx, 5, CANVAS_SIZE - 50, 'red', redStructure));
        particles.push(...createGroup(ctx, 5, CANVAS_SIZE - 50, 'white', whiteStructure));
      }
      if (speed > 0) {
        await new Promise((resolve) => setTimeout(resolve, speed));
      }
    }
    return particles;
  });
};

document.getElementById('pause')?.addEventListener('click', () => {
  const el = document.getElementById('pause');
  if (el) {
    el.textContent = paused ? 'pause' : 'resume';
  }
  paused = !paused;
  console.log(allParticles);
});

document.getElementById('add')?.addEventListener('click', () => {
  const el = document.getElementById('add');
  if (el) {
    const span = el.querySelector('span');
    if (span) {
      span.textContent = addRandomParticles ? 'no random particles' : 'random particles';
    }
    el.classList.toggle('danger');
    el.classList.toggle('success');
  }
  const elIcon = document.getElementById('add-icon');
  if (elIcon) {
    elIcon.classList.toggle('fa-check');
    elIcon.classList.toggle('fa-times');
  }
  addRandomParticles = !addRandomParticles;
});

document.getElementById('speed')?.addEventListener('change', (e) => {
  const value = (e.target as HTMLInputElement).value;
  if (value) {
    speed = parseInt(value, 10);
  }
});

run().then(() => console.log('done'));
