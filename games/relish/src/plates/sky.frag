#ifdef GL_ES
precision mediump float;
#endif

// -- types --
struct cell_t {
  float clr;
  float smp;
  float rnd;
};

// -- uniforms --
uniform sampler2D uState;
uniform vec2 uScale;

// -- u/data
uniform float uFloat0;
uniform float uFloat1;
uniform float uFloat2;

// -- helpers --
cell_t get(int x, int y) {
  vec2 delt = vec2(float(x), float(y));
  vec4 data = texture2D(uState, (gl_FragCoord.xy + delt) / uScale);

  cell_t c;
  c.clr = data.r > 0.0 ? 1.0 : 0.0;
  c.smp = data.g;
  c.rnd = data.a;

  if (c.rnd != 1.0) {
    c.smp = max(c.rnd, uFloat1);
  }

  return c;
}

void set(float clr, float smp) {
  gl_FragColor = vec4(clr, smp, 1.0, 1.0);
}

float rand() {
  vec2 st = gl_FragCoord.xy;
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

// -- program --
void main() {
  cell_t n1 = get(-1, 0);

  // if following cell to the left, turn on
  if (n1.clr == 1.0 && n1.smp > 0.1) {
    set(1.0, n1.smp * uFloat2);
    return;
  }

  // check this cell
  cell_t c = get(0, 0);

  // if off...
  if (c.clr == 0.0) {
    // and cell below is on
    n1 = get(0, -1);
    if (n1.clr == 1.0 && rand() > 0.3) {
      set(1.0, n1.smp * 0.5);
      return;
    }
  }

  set(c.clr, c.smp);
}
