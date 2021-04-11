import { getRgbaFromHex } from "./utils.js"

// -- constants --
const kScale = 4

// -- c/canvas
const kQuad = new Float32Array([
  -1.0, -1.0,
  1.0, -1.0,
  -1.0, 1.0,
  1.0, 1.0
])

// -- c/theme
const kWhiteColor = new Float32Array([1.00, 1.00, 1.00, 1.00])
const kErrorColor = new Float32Array([1.00, 0.00, 1.00, 1.00])
const kClearColor = new Float32Array([0.00, 0.00, 0.00, 0.00])

// -- props -
let mCanvas = null
let mGl = null
let mAssets = null
let mSimSize = null
let mDrawSize = null
let mViewSize = null
let mPlate = null
let mFg = null

// -- p/data
let dColors = null

// -- p/gl
let mTextures = null
let mFramebuffers = null
let mBuffers = null
let mShaderDescs = null

// -- lifetime --
export function initData() {
  dColors = new Float32Array(4 * 4);
  dColors.set([...kClearColor, ...kClearColor, ...kClearColor, ...kClearColor], 0)
}

export function init(id, assets) {
  // set props
  mCanvas = document.getElementById(id)
  if (mCanvas == null) {
    console.error("failed to find canvas")
    return false
  }

  mGl = mCanvas.getContext("webgl")
  if (mGl == null) {
    console.error("where is webgl NOW~!")
    return false
  }

  // hang on to assets
  mAssets = assets

  // init view dom size
  mViewSize = initViewSize()

  // abort for now if size is 0 (TODO: maybe listen for window resize events)
  if (mViewSize.w === 0) {
    console.debug("relish canvas size is 0, not sure what to do")
    return false
  }

  mCanvas.style.width = `${mViewSize.w}px`
  mCanvas.style.height = `${mViewSize.h}px`

  // init draw, canvas size
  mDrawSize = initDrawSize(mViewSize)
  mCanvas.width = mDrawSize.w
  mCanvas.height = mDrawSize.h

  // init simulation size
  mSimSize = initSimSize(mDrawSize)

  // init gl props
  mTextures = initTextures()
  mFramebuffers = initFramebuffers()
  mBuffers = initBuffers()

  return true
}

// -- commands --
export function sim(time) {
  if (mPlate == null || mPlate.name == "stp") {
    return
  }

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
    2,              // n components per vec
    gl.FLOAT,       // data type of component
    false,          // normalize?
    0,              // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,              // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.pos)

  // conf shader program
  gl.useProgram(sd.program)

  // conf global uniforms
  gl.uniform1i(
    sd.uniforms.state,
    0,
  )

  gl.uniform1f(
    sd.uniforms.time,
    time,
  )

  gl.uniform2fv(
    sd.uniforms.scale,
    mSimSize.v,
  )

  // conf data uniforms
  for (const name in mPlate.data) {
    const loc = sd.uniforms.data[name]
    const val = mPlate.getData(name)
    gl.uniform1f(loc, val)
  }

  // "draw" simulation
  gl.drawArrays(
    gl.TRIANGLE_STRIP, // quad as triangles (???)
    0,                 // offset
    4,                 // number of indicies (4, quad)
  )

  // swap textures to prepare for draw
  if (mPlate == null || mPlate.name != "stp") {
    swapTextures()
  }
}

export function draw() {
  if (mPlate == null) {
    return
  }

  const gl = mGl
  const sd = mShaderDescs.draw

  // render to screen
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  // size drawing viewport
  gl.viewport(
    0,
    0,
    mDrawSize.w,
    mDrawSize.h,
  )

  // sample from the current texture (state)
  gl.bindTexture(gl.TEXTURE_2D, mTextures.curr)

  // conf pos attrib (map buffer -> vecs)
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

  // conf vertex color attrib (map buffer -> vecs)
  gl.bindBuffer(gl.ARRAY_BUFFER, mBuffers.color)
  gl.vertexAttribPointer(
    sd.attribs.color, // location
    4,                // n components per vec
    gl.FLOAT,         // data type of component
    false,            // normalize?
    0,                // stride, n bytes per item; 0 = use n components * type size (2 * 4)
    0,                // offset, start pos in bytes
  )

  gl.enableVertexAttribArray(sd.attribs.color)

  // conf shader program
  gl.useProgram(sd.program)

  // conf global uniforms
  gl.uniform1i(
    sd.uniforms.state,
    0,
  )

  gl.uniform2fv(
    sd.uniforms.scale,
    mDrawSize.v,
  )

  // conf color uniforms
  const uniforms = sd.uniforms.colors
  for (let i = 0; i < uniforms.length; i++) {
    gl.uniform4fv(
      uniforms[i],
      getFgColor(i),
    )
  }

  // draw to screen
  gl.drawArrays(
    gl.TRIANGLE_STRIP, // quad as triangles (???)
    0,                 // offset
    4,                 // number of indicies (4, quad)
  )
}

export function setPlate(plate) {
  // set prop
  mPlate = plate

  // set foreground colors
  mFg = plate.colors.map((hex) => {
    return new Float32Array(getRgbaFromHex(hex))
  })

  // rebuild shaders
  syncShaderDescs()
}

// poke the texture in view space
export function poke(x, y) {
  const scale = mSimSize.w / mViewSize.w
  pokeTexture(
    x * scale,
    y * scale
  )
}

export function reset() {
  clearTexture()
}

export function randomize() {
  seedTexture()
}

// -- c/textures
function initTextures() {
  return {
    curr: initTexture(),
    next: initTexture(),
  }
}

function clearTexture() {
  const gl = mGl

  // enough space for rgba components at every cell
  const size = mSimSize.w * mSimSize.h * 4

  // assign a random value to each cell
  const seed = new Uint8Array(size)

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

function seedTexture() {
  const gl = mGl

  // enough space for rgba components at every cell
  const size = mSimSize.w * mSimSize.h * 4

  // assign a random value to each cell
  const seed = new Uint8Array(size)
  for (let i = 0; i < size; i += 4) {
    const val = Math.random() > 0.5 ? getRandomSimColor() : 0
    seed[i + 0] = val // r
    seed[i + 1] = 0   // g
    seed[i + 2] = 0   // b
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

  // get poke and convert to image data
  const poke = mPlate.poke
  const image = initSubImage(poke.data)

  // draw image at this coordinate
  gl.bindTexture(gl.TEXTURE_2D, mTextures.curr);
  gl.texSubImage2D(
    gl.TEXTURE_2D,
    0,                // lod, mipmap,
    x0 - poke.w2,    // x-offset
    y1 - poke.h2,    // y-offset
    poke.w,          // width
    poke.h,          // height
    gl.RGBA,          // color component format
    gl.UNSIGNED_BYTE, // component data type
    image,            // source
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
  const sampl = Math.random() * 255
  const color = mPlate.rand ? getRandomSimColor() : 255

  for (const cell of cells) {
    if (cell === 1) {
      image.push(color, 0, 0, sampl)
    } else {
      image.push(0, 0, 0, 0)
    }
  }

  return new Uint8Array(image)
}

// -- c/shaders
function syncShaderDescs() {
  mShaderDescs = initShaderDescs()
  if (mShaderDescs == null || mShaderDescs.sim == null || mShaderDescs.draw == null) {
    console.error("could not compile shaders")
    return false
  }

  return true
}

function initShaderDescs(assets) {
  const gl = mGl

  // make sure we have a plate
  if (mPlate == null) {
    return null
  }

  // grab shader src for this interaction
  const srcs = mAssets.shaders
  const srcsSim = {
    vert: srcs.sim.vert,
    frag: srcs.plates[mPlate.name]
  }

  // compile and produce shader descs
  return {
    sim: initShaderDesc(
      srcsSim,
      initSimShaderLocations
    ),
    draw: initShaderDesc(
      srcs.draw,
      initDrawShaderLocations
    ),
  }
}

function initSimShaderLocations(program) {
  const gl = mGl

  return {
    attribs: {
      pos: gl.getAttribLocation(program, "aPos"),
    },
    uniforms: {
      time: gl.getUniformLocation(program, "uTime"),
      state: gl.getUniformLocation(program, "uState"),
      scale: gl.getUniformLocation(program, "uScale"),
      data: {
        float0: gl.getUniformLocation(program, "uFloat0"),
        float1: gl.getUniformLocation(program, "uFloat1"),
        float2: gl.getUniformLocation(program, "uFloat2"),
        float3: gl.getUniformLocation(program, "uFloat3"),
      },
    },
  }
}

function initDrawShaderLocations(program) {
  const gl = mGl

  return {
    attribs: {
      pos: gl.getAttribLocation(program, "aPos"),
      color: gl.getAttribLocation(program, "aColor"),
    },
    uniforms: {
      state: gl.getUniformLocation(program, "uState"),
      scale: gl.getUniformLocation(program, "uScale"),
      colors: [
        gl.getUniformLocation(program, "uColor0"),
        gl.getUniformLocation(program, "uColor1"),
        gl.getUniformLocation(program, "uColor2"),
        gl.getUniformLocation(program, "uColor3"),
      ],
    },
  }
}

function initShaderDesc(srcs, locations) {
  // create program
  const program = initShaderProgram(srcs)
  if (program == null) {
    return null
  }

  // tag program with locations for shader props (if js could map optionals...)
  return {
    program,
    ...locations(program)
  }
}

function initShaderProgram(srcs) {
  const gl = mGl

  // init vertex and fragment shaders
  const vs = initShader(gl.VERTEX_SHADER, srcs.vert)
  if (vs == null) {
    return null
  }

  const fs = initShader(gl.FRAGMENT_SHADER, srcs.frag)
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
  gl.bindBuffer(gl.ARRAY_BUFFER, pos)
  gl.bufferData(gl.ARRAY_BUFFER, kQuad, gl.STATIC_DRAW)

  // create vertex color buffer
  const color = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, color)
  gl.bufferData(gl.ARRAY_BUFFER, dColors, gl.STATIC_DRAW)

  // exports
  return {
    pos,
    color,
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
// finds the dom size
function initViewSize() {
  const rect = mCanvas.getBoundingClientRect()
  const side = Math.min(rect.width, rect.height)
  return initSize(side, side)
}

// finds the nearest power-of-2 size to the dom size
function initDrawSize(viewSize) {
  const side = Math.pow(2, Math.floor(Math.log(viewSize.w) / Math.log(2)))
  return initSize(side, side)
}

// finds the scaled simulation size
function initSimSize(drawSize) {
  const side = drawSize.w / kScale
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

// -- queries --
export function getCanvas() {
  return mCanvas
}

function getRandomSimColor() {
  return (0.63 + Math.random() * 0.37) * 255
}

function getFgColor(i) {
  if (mFg == null) {
    return kWhiteColor
  }

  return mFg[i] || kErrorColor
}
