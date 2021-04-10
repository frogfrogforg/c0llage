#ifdef GL_ES
precision mediump float;
#endif

// -- uniforms --
uniform sampler2D uState;
uniform vec2 uScale;

// -- u/data
uniform float uFloat0;

// -- helpers --
int get(int x, int y) {
  vec2 delt = vec2(float(x), float(y));
  vec4 data = texture2D(uState, (gl_FragCoord.xy + delt) / uScale);
  return data.r > 0.0 ? 1 : 0;
}

void set(float clr) {
  gl_FragColor = vec4(clr, 0.0, 0.0, 1.0);
}

// -- program --
void main() {
  int h = int(uFloat0);
  int i0 = (h - 1) / -2;

  int friend = 0;
  for (int i = 0; i < 16; i++) {
    if (i >= h) {
      break;
    }

    int ii = i0 + i;
    friend += get(-1, ii);
  }

  int foe = (
    get(-1, i0 - 1) +
    get(-1, i0 + h)
  );

  if (foe != 0) {
    set(0.0);
  } else if (friend >= 2) {
    set(1.0);
  } else {
    set(float(get(0, 0)));
  }
}
