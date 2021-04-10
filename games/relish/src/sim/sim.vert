#ifdef GL_ES
precision mediump float;
#endif

// -- attribs --
attribute vec2 aPos;

// -- program --
void main() {
  gl_Position = vec4(aPos, 0, 1.0);
}
