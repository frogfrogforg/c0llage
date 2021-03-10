#ifdef GL_ES
precision mediump float;
#endif

// -- uniforms --
uniform sampler2D uState;
uniform vec2 uScale;
uniform vec4 uFgColor;
uniform vec4 uBgColor;

// -- program --
void main() {
  vec4 sample = texture2D(uState, gl_FragCoord.xy / uScale);
  gl_FragColor = sample.r == 1.0 ? uFgColor : uBgColor;
}
