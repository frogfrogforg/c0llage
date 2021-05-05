#ifdef GL_ES
precision mediump float;
#endif

// -- constants --
const int kMaxC = 3;
const int kSkyC = 2;
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
uniform highp float uTime;

// -- utils --
int ftoi(float f) {
  return int((1.0 - f) * 10.0 + 0.1);
}

float itof(int i) {
  return float(10 - i) * 0.1;
}

highp float rand(highp float offset) {
  return fract(sin(dot(gl_FragCoord.xy / uScale, vec2(12.9898, 78.233)) + offset) * 43758.5453123);
}

int randi(highp float offset) {
  float r1 = rand(offset);
  float r2 = rand(offset);

  if (r1 > 0.5) {
    return r2 > 0.5 ? +2 : +1;
  } else {
    return r2 > 0.5 ? -2 : -1;
  }
}

// -- helpers --
int skyc(int i) {
  if (i > kSkyC) {
    return kNilC;
  }

  return i;
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

// -- program --
void main() {
  cell_t c;
  cell_t n1;

  // check this cell
  c = get(0, 0);

  // if this is an empty cell
  if (c.color == kNilC) {
    // sample an x-value with a couple sources of entropy
    int r0 = randi(uTime - c.sample);

    // check a random horizontal cell
    n1 = get(r0, 0);

    // follow rightwards for a bit
    if (n1.color != kNilC && n1.sample > 0.1) {
      set(skyc(n1.color + 1), 0, n1.sample * 0.98);
      return;
    }

    // check the cells below and grow vertical spires
    for (int i = -1; i > -3; i--) {
      n1 = get(0, i);
      if (n1.color <= kSkyC && rand(0.0) > 0.2) {
        set(skyc(n1.color), 0, n1.sample * 0.5);
        return;
      }
    }

    // sample a y-value with a couple sources of entropy
    int r1 = randi(uTime + c.sample);

    // check a random diagonal
    n1 = get(r0, r1);
    if (n1.color != kNilC && rand(uTime + n1.sample) > 0.9) {
      set(kMaxC, 0, rand(uTime));
      return;
    }
  }
  // if this is a spire cell
  else if (c.color <= kSkyC) {
    // check the cell below
    n1 = get(0, -1);

    // eventually turn it off from the tail
    if (n1.color == kNilC && rand(uTime) > 0.5) {
      set(kNilC, 0, 0.0);
      return;
    }
  }
  else if (c.frame >= kFrameSpan) {
    set(kNilC, 0, 0.0);
    return;
  }

  // otherwise, keep the same color
  set(c.color, c.frame + 1, c.sample);
}
