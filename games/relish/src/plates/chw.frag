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

void set(int i, int f, float sample) {
  float color;
  if (i > kMaxC || i < 0) {
    color = 0.0;
  } else {
    color = itof(i);
  }

  gl_FragColor = vec4(color, itof(f), 0.0, sample);
}

// -- commands --
void age(cell_t c) {
  if (c.color == kMaxC && c.sample > 0.9) {
    set(c.color, 0, c.sample);
  } else if (c.frame >= kFrameSpan) {
    set(c.color + 1, 0, c.sample);
  } else {
    set(c.color, c.frame + 1, c.sample);
  }
}

int grow(int dx, int dy, int prev) {
  if (prev == kEndC) {
    return kEndC;
  }

  cell_t n1 = get(dx, dy);
  if (n1.color != kNilC) {
    return prev;
  }

  cell_t n2 = get(dx * 2, dy * 2);
  if (n2.color != kNilC) {
    return prev == kNilC ? n2.color + 1 : kEndC;
  }

  return prev;
}

void growd() {
  int c = kNilC;

  // check for neighbors
  c = grow(+1, +1, c);
  c = grow(-1, -1, c);
  c = grow(+1, -1, c);
  c = grow(-1, +1, c);

  // nil color if more than one neighbor
  if (c == kEndC) {
    c = kNilC;
  }

  // set color, seeding rand for new cells
  if (c == kNilC) {
    set(c, 0, 0.0);
  } else {
    set(c, 0, rand());
  }
}

// -- program --
void main() {
  cell_t c = get(0, 0);

  if (c.color != kNilC) {
    age(c);
  } else {
    growd();
  }
}
