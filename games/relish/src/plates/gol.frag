#ifdef GL_ES
precision mediump float;
#endif

// -- constants --
const int kMaxC = 3;
const int kNilC = 9999;

// -- types --
struct cell_t {
  int on;
  int clr;
};

// -- uniforms --
uniform sampler2D uState;
uniform vec2 uScale;

// -- helpers --
cell_t get(int x, int y) {
  vec2 delt = vec2(float(x), float(y));
  vec4 data = texture2D(uState, (gl_FragCoord.xy + delt) / uScale);

  cell_t cell;

  int i = int((1.0 - data.r) * 10.0 + 0.1);
  if (i > kMaxC) {
    cell.on = 0;
    cell.clr = kNilC;
  } else {
    cell.on = 1;
    cell.clr = i;
  }

  return cell;
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

// -- program --
void main() {
  cell_t cells[8];
  cells[0] = get(-1, -1);
  cells[1] = get(-1, +0);
  cells[2] = get(-1, +1);
  cells[3] = get(+0, -1);
  cells[4] = get(+0, +1);
  cells[5] = get(+1, -1);
  cells[6] = get(+1, +0);
  cells[7] = get(+1, +1);

  int sum = 0;
  for (int i = 0; i < 8; i++) {
    sum += cells[i].on;
  }

  if (sum == 3) {
    int clrs[4];

    // average neighbor colors
    int clr = 0;

    for (int i = 0; i < 8; i++) {
      if (cells[i].on == 1) {
        clr += cells[i].clr;
      }
    }

    clr = int(floor((float(clr) / 3.0) + 1.0)) - 1;

    // assign aaverage
    set(clr);
  } else if (sum == 2) {
    set(get(0, 0).clr);
  } else {
    set(kNilC);
  }
}
