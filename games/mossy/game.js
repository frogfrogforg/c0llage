// -- constants --
const kScale = 4
const kFrameScale = 60 / 15

// -- c/theme
const kBgColor = new Float32Array([0.00, 0.00, 0.00, 0.00])
const kFgColor = new Float32Array([0.43, 0.56, 0.48, 1.00])

// -- c/state
const kNoColor = [0, 0, 0, 255]
const kOnColor = [255, 255, 255, 255]
const kGlider = initSubImage([
  0, 1, 0,
  0, 0, 1,
  1, 1, 1,
])

// -- props -
let mCanvas = null
let mGl = null
let mSize = null
let mSimSize = null
let mFrame = 0

// -- p/gl
let mTextures = null
let mFramebuffers = null
let mBuffers = null
let mShaderDescs = null

// -- lifetime --
function main(srcs) {
  // set props
  mCanvas = document.getElementById("mossy")
  if (mCanvas == null) {
    console.error("failed to find canvas")
    return
  }

  mGl = mCanvas.getContext("webgl")
  if (mGl == null) {
    console.error("where is webgl NOW~!")
    return
  }

  // track viewport/sim sizes
  mSize =
    initViewSize()

  mSimSize = initSize(
    mSize.w / kScale,
    mSize.h / kScale
  )

  // abort for now if size is 0 (TODO: maybe listen for window resize events)
  if (mSize.w == 0) {
    console.debug("mossy canvas size is 0, not sure what to do")
    return
  }

  // sync canvas el's attribute, webgl needs this
  mCanvas.width = mSize.w
  mCanvas.height = mSize.h

  // init gl props
  mTextures = initTextures()
  mFramebuffers = initFramebuffers()
  mBuffers = initBuffers()
  mShaderDescs = initShaderDescs(srcs)

  if (mShaderDescs.sim == null || mShaderDescs.draw == null) {
    return
  }

  // start loop
  loop()

  // bind events
  bindEvents()
}

function loop() {
  // only run every kFrameScale frames
  if (mFrame == 0) {
    sim()
    swapTextures()
    draw()
  }

  // track looping frame
  mFrame = (mFrame + 1) % kFrameScale

  // loop again
  requestAnimationFrame(loop)
}

// -- commands --
function sim() {
  const gl = mGl
  const sd = mShaderDescs.sim

  // render into next texture (state)
  gl.bindFramebuffer(gl.FRAMEBUFFER, mFramebuffers.step)
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,       // target, r/w framebuffer
    gl.COLOR_ATTACHMENT0, // use the texture's color buffer
    gl.TEXTURE_2D,        // target texture image
    mTextures.next,       // the texture ref
    0                     // lod, mipmap (must be 0)
  )

  // size simulation viewport
  gl.viewport(
    0,
    0,
    mSimSize.w,
    mSimSize.h
  )

  // sample from the current texture (state)
  gl.bindTexture(gl.TEXTURE_2D, mTextures.curr)

  // conf pos shader attrib (translate buffer > vec)
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.pos)
  gl.vertexAttribPointer(
    sd.attribs.pos, // location
    2,                       // n components per vec
    gl.FLOAT,                // data type of component
    false,                   // normalize?
    0,                       // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                       // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.pos)

  // conf shader program
  gl.useProgram(sd.program)

  // conf shader uniforms
  gl.uniform1i(
    sd.uniforms.state,
    0,
  )

  gl.uniform2fv(
    sd.uniforms.scale,
    mSimSize.v,
  )

  // "draw" simulation
  gl.drawArrays(
    gl.TRIANGLE_STRIP, // quad as triangles (???)
    0,                 // offset
    4,                 // number of indicies (4, quad)
  )
}

function draw() {
  const gl = mGl
  const sd = mShaderDescs.draw

  // render to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  // size drawing viewport
  gl.viewport(
    0,
    0,
    mSize.w,
    mSize.h,
  )

  // sample from the current texture (state)
  gl.bindTexture(gl.TEXTURE_2D, mTextures.curr)

  // conf pos shader attrib (translate buffer > vec)
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.pos)
  gl.vertexAttribPointer(
    sd.attribs.pos, // location
    2,              // n components per vec
    gl.FLOAT,       // data type of component
    false,          // normalize?
    0,              // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,              // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.pos)

  // conf shader program
  gl.useProgram(sd.program)

  // conf shader uniforms
  gl.uniform1i(
    sd.uniforms.state,
    0,
  )

  gl.uniform2fv(
    sd.uniforms.scale,
    mSize.v,
  )

  gl.uniform4fv(
    sd.uniforms.colors.bg,
    kBgColor,
  )

  gl.uniform4fv(
    sd.uniforms.colors.fg,
    kFgColor,
  )

  // draw to screen
  gl.drawArrays(
    gl.TRIANGLE_STRIP, // quad as triangles (???)
    0,                 // offset
    4,                 // number of indicies (4, quad)
  )
}

let mPressed = false

function bindEvents() {
  const c = mCanvas

  c.addEventListener("click", didClickMouse)
  c.addEventListener("mousemove", didMoveMouse)
}

function didClickMouse(evt) {
  pokeTexture(
    evt.offsetX / kScale,
    evt.offsetY / kScale,
  )
}

function didMoveMouse(evt) {
  // if button is pressed
  if ((evt.buttons & (1 << 0)) != (1 << 0)) {
    return
  }

  // and this is an update frame
  if (mFrame != 0) {
    return
  }

  pokeTexture(
    evt.offsetX / kScale,
    evt.offsetY / kScale,
  )
}

// -- c/textures
function initTextures() {
  return {
    curr: initTexture(),
    next: initTexture(),
  }
}

function seedTexture() {
  const gl = mGl

  // enough space for rgba components at every cell
  const size = mSimSize.w * mSimSize.h * 4

  // assign a random value to each cell
  const seed = new Uint8Array(size)
  for (let i = 0; i < size; i += 4) {
    const val = Math.random() > 0.5 ? 255 : 0
    seed[i + 0] = val // r
    seed[i + 1] = val // g
    seed[i + 2] = val // b
    seed[i + 3] = 255 // a
  }

  // set the texture
  gl.bindTexture(gl.TEXTURE_2D, mTextures.curr)
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,                // lod, mipmap,
    0,                // x-offset
    0,                // y-offset
    mSimSize.w,       // width
    mSimSize.h,       // height
    gl.RGBA,          // color component format
    gl.UNSIGNED_BYTE, // component data type
    seed,             // source
    0,                // source offset
  )
}

function pokeTexture(x0, y0) {
  const gl = mGl

  // assume coord is oriented around screen space (top-left) and flip y
  const y1 = mSimSize.h - y0

  // spawn a glider at this coordinate
  gl.bindTexture(gl.TEXTURE_2D, mTextures.curr);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,                // lod, mipmap,
    x0 - 1,           // x-offset
    y1 - 1,           // y-offset
    3,                // width
    3,                // height
    gl.RGBA,          // color component format
    gl.UNSIGNED_BYTE, // component data type
    kGlider,          // source
  )
}

function swapTextures() {
  const tmp = mTextures.curr
  mTextures.curr = mTextures.next
  mTextures.next = tmp
}

function initTexture() {
  const gl = mGl

  // create texture
  const tex = gl.createTexture()

  // conf texture
  gl.bindTexture(gl.TEXTURE_2D, tex)

  // conf wrapping
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT)

  // conf interpolation (nearest means none, e.g. nearest neighbor?)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)

  // conf tex format
  gl.texImage2D(
    gl.TEXTURE_2D,    // target
    0,                // lod, mipmap
    gl.RGBA,          // color component format
    mSimSize.w,       // width
    mSimSize.h,       // height
    0,                // border
    gl.RGBA,          // texel format
    gl.UNSIGNED_BYTE, // component data type
    null,             // source
  )

  return tex
}

function initSubImage(cells) {
  const image = []

  for (const cell of cells) {
    if (cell === 1) {
      image.push(...kOnColor)
    } else {
      image.push(...kNoColor)
    }
  }

  return new Uint8Array(image)
}

// -- c/shaders
function initShaderDescs(srcs) {
  const gl = mGl

  const [
    simVsSrc,
    simFsSrc,
    drawVsSrc,
    drawFsSrc,
  ] = srcs

  return {
    sim: initShaderDesc(
      simVsSrc,
      simFsSrc,
      (program) => ({
        attribs: {
          pos: gl.getAttribLocation(program, "aPos"),
        },
        uniforms: {
          state: gl.getUniformLocation(program, "uState"),
          scale: gl.getUniformLocation(program, "uScale"),
        }
      })
    ),
    draw: initShaderDesc(
      drawVsSrc,
      drawFsSrc,
      (program) => ({
        attribs: {
          pos: gl.getAttribLocation(program, "aPos"),
        },
        uniforms: {
          state: gl.getUniformLocation(program, "uState"),
          scale: gl.getUniformLocation(program, "uScale"),
          colors: {
            bg: gl.getUniformLocation(program, "uBgColor"),
            fg: gl.getUniformLocation(program, "uFgColor"),
          },
        }
      })
    ),
  }
}

function initShaderDesc(vsSrc, fsSrc, locations) {
  // create program
  const program = initShaderProgram(vsSrc, fsSrc)
  if (program == null) {
    return null
  }

  // tag program with locations for shader props (if js could map optionals...)
  return {
    program,
    ...locations(program)
  }
}

function initShaderProgram(vsSrc, fsSrc) {
  const gl = mGl

  // init vertex and fragment shaders
  const vs = initShader(gl.VERTEX_SHADER, vsSrc)
  if (vs == null) {
    return null
  }

  const fs = initShader(gl.FRAGMENT_SHADER, fsSrc)
  if (fs == null) {
    return null
  }

  // create program
  const program = gl.createProgram();
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)

  // check for errors
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("failed to initialize shader program:", gl.getProgramInfoLog(program))
    return null
  }

  return program
}

function initShader(type, src) {
  const gl = mGl

  // create shader
  const shader = gl.createShader(type);

  // compile source
  gl.shaderSource(shader, src)
  gl.compileShader(shader);

  // check for errors
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("failed to compile shader:", gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }

  return shader
}

// -- c/buffers
function initBuffers() {
  const gl = mGl

  // create pos buffer
  const pos = gl.createBuffer()

  // define shape (quad)
  const positions = [
    -1.0, -1.0,
    1.0, -1.0,
    -1.0, 1.0,
    1.0, 1.0
  ]

  // pass data into pos buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, pos)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // exports
  return {
    pos,
  }
}

// -- c/framebuffers
function initFramebuffers() {
  const gl = mGl

  return {
    step: gl.createFramebuffer()
  }
}

// -- c/helpers
// finds the nearest power-of-2 size to the dom width and height
function initViewSize() {
  const rect = mCanvas.getBoundingClientRect()
  const side = Math.pow(2, Math.floor(Math.log(Math.min(rect.width, rect.height)) / Math.log(2)));
  return initSize(side, side)
}

function initSize(w, h) {
  return {
    v: new Float32Array([w, h]),
    get w() {
      return this.v[0]
    },
    get h() {
      return this.v[1]
    }
  }
}

// -- boostrap --
(async function load() {
  // wait for the gl-matrix, the window, and the shader srcs
  const [_m, srcs] = await Promise.all([
    loadWindow(),
    loadShaders([
      "./sim/sim.vert",
      "./sim/sim.frag",
      "./draw/draw.vert",
      "./draw/draw.frag",
    ])
  ])

  // then start
  main(srcs)
})()

function loadWindow() {
  return new Promise((resolve) => {
    window.addEventListener("load", function listener() {
      window.removeEventListener("load", listener)
      resolve()
    })
  })
}

function loadShaders(paths) {
  return Promise.all(paths.map(async (p) => {
    const r = await fetch(p)
    const t = await r.text()
    return t
  }))
}
