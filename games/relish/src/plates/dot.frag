#ifdef GL_ES
precision mediump float;
#endif

// -- constants --
const int kMaxC = 3;
const int kNilC = 9999;

// -- uniforms --
uniform sampler2D uState;
uniform vec2 uScale;

// -- helpers --
int get(int x, int y) {
  vec2 delt = vec2(float(x), float(y));
  vec4 data = texture2D(uState, (gl_FragCoord.xy + delt) / uScale);

  int i = int((1.0 - data.r) * 10.0 + 0.1);
  if (i > kMaxC) {
    return kNilC;
  }

  return i;
}

void set(int i) {
  float color;
  if (i > kMaxC || i < 0) {
    color = 0.0;
  } else {
    color = float(10 - i) * 0.1;
  }

  gl_FragColor = vec4(color, 0.0, 0.0, 1.0);
}

// -- commands --
bool grow(int dx, int dy) {
  int n1 = get(dx, dy);

  if (n1 != kNilC) {
    int n2 = get(dx * 2, dy * 2);

    if (n1 == n2) {
      set(n1 + 1);
      return true;
    }

    if (n1 > n2) {
      set(n1);
      return true;
    }
  }

  return false;
}

// -- program --
void main() {
  int c = get(0, 0);

  if (c == kNilC) {
    bool grew = (
      grow(+0, +1) ||
      grow(+1, +0) ||
      grow(+0, -1) ||
      grow(-1, +0)
    );

    if (grew) {
      return;
    }
  }

  set(c);
}
