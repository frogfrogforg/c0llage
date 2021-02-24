//
//
// BIG NOTE GO TO THE END OF THE FILE FOR THE ACTUAL USEFUL STUFF
//
//

// #region copied implementation from jsnes mostly and some attempts to write a save state
var SCREEN_WIDTH = 256
var SCREEN_HEIGHT = 240
var FRAMEBUFFER_SIZE = SCREEN_WIDTH * SCREEN_HEIGHT

var canvas_ctx, image
var framebuffer_u8, framebuffer_u32

var AUDIO_BUFFERING = 512
var SAMPLE_COUNT = 4 * 1024
var SAMPLE_MASK = SAMPLE_COUNT - 1
var audio_samples_L = new Float32Array(SAMPLE_COUNT)
var audio_samples_R = new Float32Array(SAMPLE_COUNT)
var audio_write_cursor = 0; var audio_read_cursor = 0

var nes = new jsnes.NES({
  onFrame: function (framebuffer_24) {
    for (var i = 0; i < FRAMEBUFFER_SIZE; i++) framebuffer_u32[i] = 0xFF000000 | framebuffer_24[i]
  },
  onAudioSample: function (l, r) {
    audio_samples_L[audio_write_cursor] = l
    audio_samples_R[audio_write_cursor] = r
    audio_write_cursor = (audio_write_cursor + 1) & SAMPLE_MASK
  }
})

function loadJSON (path, success, error) {
  var xhr = new XMLHttpRequest()
  xhr.onreadystatechange = function () {
    if (xhr.readyState === XMLHttpRequest.DONE) {
      if (xhr.status === 200) {
        if (success) { success(JSON.parse(xhr.responseText)) }
      } else {
        if (error) { error(xhr) }
      }
    }
  }
  xhr.open('GET', path, true)
  xhr.send()
}

// setTimeout(() => {
//   loadJSON(
//     'superplsdontsueme3.json',
//     data => {
//       console.log('loaded')
//       // nes.fromJSON(data)
//     },
//     err => console.log(err)), 1
// })

function onAnimationFrame () {
  window.requestAnimationFrame(onAnimationFrame)

  image.data.set(framebuffer_u8)
  canvas_ctx.putImageData(image, 0, 0)
  Update()
}

function audio_remain () {
  return (audio_write_cursor - audio_read_cursor) & SAMPLE_MASK
}

function audio_callback (event) {
  var dst = event.outputBuffer
  var len = dst.length

  // Attempt to avoid buffer underruns.
  if (audio_remain() < AUDIO_BUFFERING) nes.frame()

  var dst_l = dst.getChannelData(0)
  var dst_r = dst.getChannelData(1)
  for (var i = 0; i < len; i++) {
    var src_idx = (audio_read_cursor + i) & SAMPLE_MASK
    dst_l[i] = audio_samples_L[src_idx]
    dst_r[i] = audio_samples_R[src_idx]
  }

  audio_read_cursor = (audio_read_cursor + len) & SAMPLE_MASK
}

let save

function keyboard (callback, event) {
  var player = 1
  switch (event.keyCode) {
    case 38: // UP
      callback(player, jsnes.Controller.BUTTON_UP); break
    case 40: // Down
      callback(player, jsnes.Controller.BUTTON_DOWN); break
    case 37: // Left
      callback(player, jsnes.Controller.BUTTON_LEFT); break
    case 39: // Right
      callback(player, jsnes.Controller.BUTTON_RIGHT); break
    case 65: // 'a' - qwerty, dvorak
    case 90: // 'z' - azerty
    case 32: // space
      if (currentObjectSet === 1) {
        callback(player, jsnes.Controller.BUTTON_A)
      } else {
        console.log('START')
        callback(player, jsnes.Controller.BUTTON_START)
        callback(player, jsnes.Controller.BUTTON_A)
      }
      break
    case 83: // 's' - qwerty, azerty
    case 79: // 'o' - dvorak
    case 88: // 'z' -
      callback(player, jsnes.Controller.BUTTON_B); break
    case 9: // Tab
      callback(player, jsnes.Controller.BUTTON_SELECT); break
      // nes.cpu.write(0x0727, 5)
      break

    //   downloadObjectAsJson(
    //     nes.toJSON(),
    //     'superplsdontsueme3.json')
    //   break
    // case 87: // w
    //   console.log('wwwww')
    //   save = JSON.stringify(nes.toJSON())
    //   break
    // case 80: // 'q' - azerty
    //   break
    // case 81: // 'q' - azerty
    //   console.log('QQQQQ')
    //   downloadObjectAsJson(
    //     nes,
    //     'beforereload.json')
    //   nes.fromJSON(JSON.parse(save))
    //   downloadObjectAsJson(
    //     nes,
    //     'afterreload.json')
    //   window.alert('STOP')
    //   break
    case 13: // Return
      callback(player, jsnes.Controller.BUTTON_START); break
    default: break
  }
}

function nes_init (canvas_id) {
  var canvas = document.getElementById(canvas_id)
  canvas_ctx = canvas.getContext('2d')
  image = canvas_ctx.getImageData(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

  canvas_ctx.fillStyle = 'black'
  canvas_ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT)

  // Allocate framebuffer array.
  var buffer = new ArrayBuffer(image.data.length)
  framebuffer_u8 = new Uint8ClampedArray(buffer)
  framebuffer_u32 = new Uint32Array(buffer)

  // Setup audio.
  var audio_ctx = new window.AudioContext()
  var script_processor = audio_ctx.createScriptProcessor(AUDIO_BUFFERING, 0, 2)
  script_processor.onaudioprocess = audio_callback
  script_processor.connect(audio_ctx.destination)
}

function nes_boot (rom_data) {
  nes.loadROM(rom_data)
  window.requestAnimationFrame(onAnimationFrame)
  start()
}

function nes_load_data (canvas_id, rom_data) {
  nes_init(canvas_id)
  nes_boot(rom_data)
}

function nes_load_url (canvas_id, path) {
  nes_init(canvas_id)

  var req = new XMLHttpRequest()
  req.open('GET', path)
  req.overrideMimeType('text/plain; charset=x-user-defined')
  req.onerror = () => console.log(`Error loading ${path}: ${req.statusText}`)

  req.onload = function () {
    if (this.status === 200) {
      nes_boot(this.responseText)
    } else if (this.status === 0) {
      // Aborted, so ignore error
    } else {
      req.onerror()
    }
  }

  req.send()
}

function downloadObjectAsJson (exportObj, exportName) {
  return // TODO: figure a way to properly save a savestate (hope that people fix jsnes)
  var dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObj))
  var downloadAnchorNode = document.createElement('a')
  downloadAnchorNode.setAttribute('href', dataStr)
  downloadAnchorNode.setAttribute('download', exportName + '.json')
  document.body.appendChild(downloadAnchorNode) // required for firefox
  downloadAnchorNode.click()
  downloadAnchorNode.remove()
}

// #endregion

// ACTUAL USEFUL STUFF

// TODO: set some of this to global state?
let lastPipe = 0
let currentObjectSet = 0 // 0 for overworld 1 for level
let startedLevel = false
let finishedLevel = false

function wait_frames (x) {
  return wait_ms(x * 1000 / 60)
}
function wait_ms (x) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, x)
  })
}

async function press_button (button) {
  nes.buttonDown(1, button)
  await wait_ms(1000 / 60)
  nes.buttonUp(1, button)
}

async function start () {
  console.log('HELLO IM MARIO')

  // sequence to get to level select

  // wait for the initial game load
  await wait_ms(5000)

  // press start to skip cutscene
  await press_button(jsnes.Controller.BUTTON_START)

  // wait for the cutscene skip
  await wait_ms(2000)

  // press start to go to overworld
  await press_button(jsnes.Controller.BUTTON_START)

  // wait for the load
  await wait_ms(5000)
  console.log('LOOOADED MARIO')

  // go right then up

  press_button(jsnes.Controller.BUTTON_RIGHT)
  await wait_ms(2000)
  press_button(jsnes.Controller.BUTTON_UP)
}

let ypos = 0
let lastY = 0
let gotToTop = false
function Update () {
  // http://datacrystal.romhacking.net/wiki/Super_Mario_Bros._3:RAM_map

  currentObjectSet = nes.cpu.load(0x070A) // Changes from 0 to 1 (started level)
  const pipeFrame = nes.cpu.load(0x0510)
  // console.log(pipeFrame + ' ' + lastPipe + ' ' + currentObjectSet)
  if (currentObjectSet === 1 && pipeFrame === 0 && lastPipe > 0 && lastPipe !== 192) {
    if (window.top.addEvent != null && !finishedLevel) {
      Events.raise('mario.exitlevel')
      finishedLevel = true
    }
  }

  if (startedLevel) {
    const curY = nes.cpu.load(0x000A2)
    let dy = (lastY - curY)
    if (Math.abs(dy) > 10) {
      console.log(dy)
    }
    if (dy > 128) dy -= 256
    if (dy < -128) dy += 256
    ypos += dy
    console.log('y pos: ' + ypos)
    lastY = curY
  }

  if (currentObjectSet === 1 && !startedLevel) {
    startedLevel = true
    lastY = 128
  }

  const xpos = nes.cpu.load(0x00090)
  if (ypos > 235 && xpos > 150 && xpos < 160 && !gotToTop) {
    gotToTop = true
    Events.raise('mario.freesalad')
  }

  // console.log('xpos = ' + xpos)

  lastPipe = pipeFrame
}

// Events

// TODO: remove keyboard input?
// window.top.addEventListener('keydown', (event) => { keyboard(nes.buttonDown, event) })
// window.top.addEventListener('keyup', (event) => { keyboard(nes.buttonUp, event) })

Events.listen('pressed-me-down', (event) => {
  nes.buttonDown(1, jsnes.Controller.BUTTON_A)
  nes.buttonDown(1, jsnes.Controller.BUTTON_UP)
  if (currentObjectSet === 0) {
    nes.buttonDown(1, jsnes.Controller.BUTTON_START)
  }
})

Events.listen('pressed-me-up', (event) => {
  nes.buttonUp(1, jsnes.Controller.BUTTON_A)
  nes.buttonUp(1, jsnes.Controller.BUTTON_UP)
  if (currentObjectSet === 0) {
    nes.buttonUp(1, jsnes.Controller.BUTTON_START)
  }
})

let hasBucketControl = false
Events.listen('juice.appeared', () => {
  hasBucketControl = true
})

Events.listen('juice.inbucket', () => {
  if (!hasBucketControl) return
  nes.buttonUp(1, jsnes.Controller.BUTTON_LEFT)
  nes.buttonDown(1, jsnes.Controller.BUTTON_RIGHT)
})

Events.listen('juice.outbucket', () => {
  if (!hasBucketControl) return
  nes.buttonDown(1, jsnes.Controller.BUTTON_LEFT)
  nes.buttonUp(1, jsnes.Controller.BUTTON_RIGHT)
})
