extern crate piston;
extern crate graphics;
extern crate glutin_window;
extern crate opengl_graphics;

use piston::window::WindowSettings;
use glutin_window::GlutinWindow as Window;
use opengl_graphics::{GlGraphics, OpenGL};
use piston::event_loop::{EventSettings, Events};
use piston::input::{RenderArgs, RenderEvent, UpdateArgs, UpdateEvent};

pub struct App {
  gl: GlGraphics,
  rotation: f64,
}

impl App {
  fn render(&mut self, args: &RenderArgs) {
    use graphics::*;

    const BLACK: [f32; 4] = [0.0, 0.0, 0.0, 1.0];
    const WHITE: [f32; 4] = [1.0, 1.0, 1.0, 1.0];
    const RED: [f32; 4] = [1.0, 0.0, 0.0, 1.0];

    let square = rectangle::square(0.0, 0.0, 50.0);
    let rotation = self.rotation;
    let (x, y) = (args.window_size[0] / 2.0, args.window_size[1] / 2.0);

    self.gl.draw(args.viewport(), |c, gl| {
      clear(BLACK, gl);

      let transform1 = c
        .transform
        .trans(x, y)
        .rot_rad(rotation)
        .trans(-25.0, -25.0);

      rectangle(RED, square, transform1, gl);

      let transform2 = c
        .transform
        .trans(x, y)
        .rot_rad(rotation)
        .trans(-50.0, -50.0);

      rectangle(WHITE, square, transform2, gl);
    });
  }

  fn update(&mut self, args: &UpdateArgs) {
    self.rotation += 2.0 * args.dt;
  }
}

fn main() {
  let opengl = OpenGL::V3_2;

  let mut window: Window = WindowSettings::new("spinning-square", [800, 800])
    .graphics_api(opengl)
    .exit_on_esc(true)
    .build()
    .unwrap();

  let mut app = App {
    gl: GlGraphics::new(opengl),
    rotation: 0.0,
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
