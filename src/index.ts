import { _particles, _speed, delay, _paused, draw, clearScreen, createParticle, updateParticles } from './utils';

const update = async () => {
  if (!_paused) {
    clearScreen();

    for (let i = 0; i < _particles.length; i++) {
      const p = _particles[i];

      if (p.forces) {
        p.forces.forEach((force) => {
          force(p);
        });
      }

      if (p.rules) {
        for (const rule of p.rules) {
          rule(p);
        }
      }

      draw(_particles[i].x, _particles[i].y, _particles[i].size, _particles[i].color);
    }
  }

  updateParticles(_particles.filter((p) => p.alive));

  if (_speed > 0) {
    await delay(_speed);
  }
};

const run = async () => {
  console.log('start');

  _particles.push(
    createParticle({
      size: 10,
      color: 'white',
    }),
    createParticle({
      size: 5,
      color: 'red',
    }),
  );

  requestAnimationFrame(() => update());
};

run().then(() => console.log('done'));
