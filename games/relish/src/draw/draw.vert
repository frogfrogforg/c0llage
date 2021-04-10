#ifdef GL_ES
precision mediump float;
#endif

// -- attribs --
attribute vec2 aPos;
attribute lowp vec4 aColor;

// -- varying --
varying lowp vec4 vColor;

// -- program --
void main() {
  gl_Position = vec4(aPos, 0, 1.0);
  vColor = aColor;
}
