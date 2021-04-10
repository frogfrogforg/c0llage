#ifdef GL_ES
precision mediump float;
#endif

// -- uniforms --
uniform sampler2D uState;
uniform vec2 uScale;
uniform vec4 uColor0;
uniform vec4 uColor1;
uniform vec4 uColor2;
uniform vec4 uColor3;

// -- varying --
varying lowp vec4 vColor;

// -- program --
void main() {
  vec4 data = texture2D(uState, gl_FragCoord.xy / uScale);

  // map r channel into a color index
  int i = int((1.0 - data.r) * 10.0 + 0.1);

  // pick color
  vec4 c;
  if (i == 0) {
    c = uColor0;
  } else if (i == 1) {
    c = uColor1;
  } else if (i == 2) {
    c = uColor2;
  } else if (i == 3) {
    c = uColor3;
  } else {
    c = vColor;
  }

  // debug color
  // vec4 c;
  // if (data.r == 0.0) {
  //   c = vColor;
  // } else {
  //   c = vec4(data.r, data.r, data.r, 1.0);
  // }

  // set output color
  gl_FragColor = c;
}
