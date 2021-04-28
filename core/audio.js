// for legacy browsers
const AudioContext = window.AudioContext || window.webkitAudioContext

const audioContext = new AudioContext()

console.log(audioContext)

const gainNode = audioContext.createGain()
const lowPassNode = audioContext.createBiquadFilter()
lowPassNode.type = 'lowpass'
lowPassNode.frequency.value = 1000

var analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 2048;

analyserNode.connect(lowPassNode).connect(gainNode).connect(audioContext.destination)

window.top.addEventListener('audio-change-gain', (e) => {
  const value = (e.detail)
  console.log('no pain, no gain', e)
  gainNode.gain.value = value;
})

window.top.addEventListener('music-volume', (e) => {
  const value = (e.detail)
  console.log('no pain, no gain', e)
  gainNode.gain.value = value;
})

window.top.addEventListener('audio-change-lowpass', (e) => {
  const value = (e.detail)
  console.log('no filter', e)
  lowPassNode.frequency.value = value;
  console.log(lowPassNode)
})


export const Audio = {
  addSource(el) {
    const track = audioContext.createMediaElementSource(el)
    console.log(track)
    track.connect(analyserNode)
  }
}
