extern crate rand;
extern crate piston;
extern crate graphics;
extern crate glutin_window;
extern crate opengl_graphics;

use std::collections::HashMap;
use piston::window::WindowSettings;
use glutin_window::GlutinWindow as Window;
use opengl_graphics::{GlGraphics, OpenGL};
use piston::event_loop::{EventSettings, Events};
use piston::input::{RenderArgs, RenderEvent, UpdateArgs, UpdateEvent};
use rand::{thread_rng, Rng};

pub struct App {
  gl: GlGraphics,
  particles: HashMap<i32, Particle>,
}

pub struct Particle {
  id: i32,
  x: f64,
  y: f64,
  vx: f64,
  vy: f64,
  size: f64,
  data: Vec<i32>,
  rules: Vec<fn(p: Particle) -> Particle>,
  forces: Vec<fn(p: Particle) -> Particle>,
  interactions: Vec<fn(p1: Particle, p2: Particle) -> Particle>,
}

const PARTICLE_SIZE: f64 = 10.0;
const BLACK: [f32; 4] = [0.0, 0.0, 0.0, 1.0];
const WHITE: [f32; 4] = [1.0, 1.0, 1.0, 1.0];
const RED: [f32; 4] = [1.0, 0.0, 0.0, 1.0];

impl App {
  fn render(&mut self, args: &RenderArgs) {
    use graphics::*;

    let (x_win, y_win) = (args.window_size[0] / 2.0, args.window_size[1] / 2.0);

    self.gl.draw(args.viewport(), |c, gl| {
      clear(BLACK, gl);

      for p in self.particles.values() {
        let square = rectangle::square(0.0, 0.0, p.size);
        let speed_x = p.vx;
        let speed_y = p.vy;
        let new_x = p.x + speed_x;
        let new_y = p.y + speed_y;
        let transform2 = c
          .transform
          .trans(x_win, y_win)
          .trans(new_x, new_y);

        let color = WHITE;
        rectangle(color, square, transform2, gl);
      }
    });
  }

  fn update(&mut self, _: &UpdateArgs) {
    let mut particles: HashMap<i32, Particle> = HashMap::new();

    for p in self.particles.values() {
      let mut new_particle = Particle {
        id: p.id,
        x: p.x,
        y: p.y,
        vx: p.vx,
        vy: p.vy,
        size: p.size,
        rules: p.rules.clone(),
        forces: p.forces.clone(),
        data: [0, 0, 0, 0].to_vec(),
        interactions: p.interactions.clone(),
      };

      for p2 in self.particles.values() {
        if p.id != p2.id {
          for interaction in &p.interactions {
            new_particle = interaction(new_particle, Particle {
              id: p2.id,
              x: p2.x,
              y: p2.y,
              vx: p2.vx,
              vy: p2.vy,
              data: [0, 0, 0, 0].to_vec(),
              size: p2.size,
              rules: vec![],
              forces: vec![],
              interactions: vec![],
            });
          }
        }
      }

      for rule in &p.rules {
        new_particle = rule(new_particle);
      }

      for force in &p.forces {
        new_particle = force(new_particle);
      }

      particles.insert(p.id, new_particle);
    }

    self.particles = particles;
  }
}

fn random_position(width: f64, height: f64, size: f64) -> (f64, f64) {
  let mut rng = thread_rng();
  let x = rng.gen_range((-width / 2.0 + size)..(width / 2.0 - size));
  let y = rng.gen_range((-height / 2.0 + size)..(height / 2.0 - size));
  (x, y)
}

fn generate_unique_id() -> i32 {
  use std::time::{SystemTime, UNIX_EPOCH};
  let start = SystemTime::now();
  let since_the_epoch = start.duration_since(UNIX_EPOCH).expect("Time went backwards");
  since_the_epoch.as_secs() as i32
}

fn move_particle(p: Particle) -> Particle {
  let mut p = p;
  p.x += p.vx;
  p.y += p.vy;
  p
}

fn main() {
  let opengl = OpenGL::V3_2;

  let mut window: Window = WindowSettings::new("spinning-square", [800, 800])
    .graphics_api(opengl)
    .exit_on_esc(true)
    .build()
    .unwrap();

  let mut particles: HashMap<i32, Particle> = HashMap::new();

  for i in 0..200 {
    let time = generate_unique_id();
    let id = time + i;
    let random_pos = random_position(800.0, 800.0, PARTICLE_SIZE);
    particles.insert(id, Particle {
      id,
      size: PARTICLE_SIZE,
      x: random_pos.0,
      y: random_pos.1,
      vx: 0.0,
      vy: 0.0,
      data: [0, 0, 0, 0].to_vec(),
      rules: vec![
        |p| move_particle(p),
      ],
      forces: vec![],
      interactions: vec![]
    });
  }

  let mut app = App {
    gl: GlGraphics::new(opengl),
    particles,
  };

  let mut events = Events::new(EventSettings::new());
  while let Some(e) = events.next(&mut window) {
    if let Some(args) = e.render_args() {
      app.render(&args);
    }

    if let Some(args) = e.update_args() {
      app.update(&args);
    }
  }
}
