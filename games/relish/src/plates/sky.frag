#ifdef GL_ES
precision mediump float;
#endif

// -- constants --
const int kMaxC = 3;
const int kNilC = 9999;
const int kEndC = -1;
const int kFrameSpan = 2;

// -- types --
struct cell_t {
  int color;
  int frame;
  float sample;
};

// -- uniforms --
uniform sampler2D uState;
uniform vec2 uScale;

// -- utils --
float rand() {
  return fract(sin(dot(gl_FragCoord.xy / uScale, vec2(12.9898, 78.233))) * 43758.5453123);
}

// -- helpers --
int ftoi(float f) {
  return int((1.0 - f) * 10.0 + 0.1);
}

float itof(int i) {
  return float(10 - i) * 0.1;
}

cell_t get(int x, int y) {
  vec2 dlt = vec2(float(x), float(y));
  vec2 pos = (gl_FragCoord.xy + dlt) / uScale;
  vec4 tex = texture2D(uState, pos);

  cell_t c;

  int i = ftoi(tex.r);
  if (i > kMaxC) {
    c.color = kNilC;
    c.frame = 0;
    c.sample = 0.0;
  } else {
    c.color = i;
    c.frame = ftoi(tex.g);
    c.sample = tex.a;
  }

  return c;
}

void set(int i, float sample) {
  float color;
  if (i > kMaxC || i < 0) {
    color = 0.0;
  } else {
    color = itof(i);
  }

  gl_FragColor = vec4(color, itof(0), 0.0, sample);
}

// -- program --
void main() {
  cell_t n1 = get(-1, 0);

  // if following cell to the left, turn on
  if (n1.color != kNilC && n1.sample > 0.1) {
    set(n1.color + 1, n1.sample * 0.98);
    return;
  }

  // if cell below is on
  n1 = get(0, -1);
  if (n1.color != kNilC && rand() > 0.3) {
    set(n1.color, n1.sample * 0.5);
    return;
  }

  // change nothing and continue with immaculate consistency
  cell_t c = get(0, 0);
  set(c.color, c.sample);
}
