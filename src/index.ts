import {
  _particles,
  _speed,
  delay,
  _paused,
  draw,
  clearScreen,
  createParticle,
  updateParticles,
  Particle,
  CANVAS_SIZE,
} from './utils';

const update = async () => {
  if (!_paused) {
    clearScreen();

    for (let i = 0; i < _particles.length; i++) {
      const p = _particles[i];

      if (p.forces) {
        p.forces.forEach((force) => {
          _particles[i] = force(p);
        });
      }

      if (p.rules) {
        for (const rule of p.rules) {
          _particles[i] = rule(p);
        }
      }

      draw(_particles[i].x, _particles[i].y, _particles[i].size, _particles[i].color);
    }
  }

  updateParticles(_particles.filter((p) => p.alive));

  if (_speed > 0) {
    await delay(_speed);
  }

  requestAnimationFrame(() => update());
};

const gravity = (p: Particle): Particle => {
  p.vy += 0.1;
  return p;
};

const move = (p: Particle): Particle => {
  p.x += p.vx;
  p.y += p.vy;
  return p;
};

const bounce = (p: Particle): Particle => {
  if (p.x > CANVAS_SIZE - p.size) {
    p.vx *= -1;
    p.x = CANVAS_SIZE - p.size;
  }

  if (p.x < 0) {
    p.vx *= -1;
    p.x = 0;
  }

  if (p.y > CANVAS_SIZE - p.size) {
    p.vy *= -1;
    p.y = CANVAS_SIZE - p.size;
  }

  if (p.y < 0) {
    p.vy *= -1;
    p.y = 0;
  }

  return p;
};

const run = async () => {
  console.log('start');

  _particles.push(
    createParticle({
      size: 10,
      color: 'white',
      rules: [move, bounce],
      forces: [gravity],
    }),
    createParticle({
      size: 5,
      color: 'red',
      rules: [move, bounce],
      forces: [gravity],
    }),
  );

  requestAnimationFrame(() => update());
};

run().then(() => console.log('done'));
