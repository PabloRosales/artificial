extern crate rand;
extern crate piston;
extern crate graphics;
extern crate glutin_window;
extern crate opengl_graphics;

use piston::window::WindowSettings;
use glutin_window::GlutinWindow as Window;
use graphics::types::Width;
use opengl_graphics::{GlGraphics, OpenGL};
use piston::event_loop::{EventSettings, Events};
use piston::input::{RenderArgs, RenderEvent, UpdateArgs, UpdateEvent};
use rand::{thread_rng, Rng};

pub struct App {
  gl: GlGraphics,
  particles: Vec<Particle>,
}

pub struct Particle {
  id: i32,
  x: f64,
  y: f64,
  vx: f64,
  vy: f64,
  size: f64,
  color: [f32; 4],
  rules: Vec<fn(p: Particle) -> Particle>,
  forces: Vec<fn(p: Particle) -> Particle>,
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

      for p in &self.particles {
        let square = rectangle::square(0.0, 0.0, p.size);
        let transform2 = c
          .transform
          .trans(x_win, y_win)
          .trans(p.x + p.vx, p.y + p.vy);

        rectangle(WHITE, square, transform2, gl);
      }
    });
  }

  fn update(&mut self, args: &UpdateArgs) {
  }
}

fn random_position(width: f64, height: f64, size: f64) -> (f64, f64) {
  let mut rng = thread_rng();
  let x = rng.gen_range((-width / 2.0 + size)..(width / 2.0 - size));
  let y = rng.gen_range((-height / 2.0 + size)..(height / 2.0 - size));
  (x, y)
}

fn main() {
  let opengl = OpenGL::V3_2;

  let mut window: Window = WindowSettings::new("spinning-square", [800, 800])
    .graphics_api(opengl)
    .exit_on_esc(true)
    .build()
    .unwrap();

  let random_pos = random_position(800.0, 800.0, PARTICLE_SIZE);

  let particles = vec![
    Particle {
      id: 0,
      size: PARTICLE_SIZE,
      x: random_pos.0,
      y: random_pos.1,
      vx: 0.0,
      vy: 0.0,
      color: RED,
      rules: vec![],
      forces: vec![],
    },
  ];

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
