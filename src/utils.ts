export let _speed = 0;
export let _paused = false;
export let _addRandomParticles = true;
export const CANVAS_SIZE = 800;
export const START_PARTICLE_SIZE = 5;
export let _particles: Particle[] = [];

export interface ParticleBase {
  x: number;
  y: number;
  size: number;
  color: string;
  alive: boolean;
}

export type RuleFunction = (particle: Particle) => Particle[];
export type ForceFunction = (particle: Particle) => void;

export interface Particle extends ParticleBase {
  id: number;
  vx: number;
  vy: number;
  rules: RuleFunction[];
  forces: ForceFunction[];
}

export type PartialParticle = Omit<Particle, 'vx' | 'vy' | 'id' | 'x' | 'y' | 'rules' | 'forces' | 'size' | 'alive'> & {
  x?: number;
  y?: number;
  size?: number;
  rules?: RuleFunction[];
  forces?: ForceFunction[];
};

export const updateParticles = (particles: Particle[]) => {
  _particles = particles;
};

export const getContext2D = (): CanvasRenderingContext2D => {
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

export const draw = (x: number, y: number, size: number, color: string) => {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
};

export const createParticle = (particle: PartialParticle): Particle => {
  return {
    ...particle,
    vx: 0,
    vy: 0,
    alive: true,
    id: new Date().getTime(),
    rules: particle.rules || [],
    forces: particle.forces || [],
    size: particle.size || START_PARTICLE_SIZE,
    x: particle.x !== undefined ? particle.x : randomPositionInArea(),
    y: particle.y !== undefined ? particle.y : randomPositionInArea(),
  };
};

export const distance = (a: Particle, b: Particle) => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
};

export const clearScreen = () => {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
};

export const countParticles = () => {
  const countElement = document.getElementById('count');
  if (countElement) {
    countElement.innerText = `${_particles.length} particles`;
  }
};

export const randomPositionInArea = (padding?: number) => {
  return Math.random() * CANVAS_SIZE - (padding || 0);
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

document.getElementById('pause')?.addEventListener('click', () => {
  const el = document.getElementById('pause');
  if (el) {
    el.textContent = _paused ? 'pause' : 'resume';
  }
  _paused = !_paused;
  console.log(_particles);
});

document.getElementById('add')?.addEventListener('click', () => {
  const el = document.getElementById('add');
  if (el) {
    const span = el.querySelector('span');
    if (span) {
      span.textContent = _addRandomParticles ? 'no random particles' : 'random particles';
    }
    el.classList.toggle('danger');
    el.classList.toggle('success');
  }
  const elIcon = document.getElementById('add-icon');
  if (elIcon) {
    elIcon.classList.toggle('fa-check');
    elIcon.classList.toggle('fa-times');
  }
  _addRandomParticles = !_addRandomParticles;
});

document.getElementById('speed')?.addEventListener('change', (e) => {
  const value = (e.target as HTMLInputElement).value;
  if (value) {
    _speed = parseInt(value, 10);
  }
});

export const ctx = getContext2D();
