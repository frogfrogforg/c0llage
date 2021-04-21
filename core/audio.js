// for legacy browsers
const AudioContext = window.AudioContext || window.webkitAudioContext

const audioContext = new AudioContext()

const gainNode = audioContext.createGain()
const lowPassNode = audioContext.createBiquadFilter()
lowPassNode.type = 'lowshelf'
lowPassNode.frequency.value = 1000

var analyserNode = audioContext.createAnalyser();
analyserNode.fftSize = 2048;

analyserNode.connect(lowPassNode).connect(gainNode).connect(audioContext.destination)

window.top.addEventListener('audio-change-gain', function(e) {
  gainNode.gain.value = e.value;
})

export const Audio = {
  addSource(el) {
    const track = audioContext.createMediaElementSource(el)
    track.connect(analyserNode)
  }
}
