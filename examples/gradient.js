// Fancy gradients

import WaveSurfer from 'wavesurfer.js'

const ctx = document.createElement('canvas').getContext('2d')
const gradient = ctx.createLinearGradient(0, 0, 0, 150)
gradient.addColorStop(0, 'rgb(200, 0, 200)')
gradient.addColorStop(0.7, 'rgb(100, 0, 100)')
gradient.addColorStop(1, 'rgb(0, 0, 0)')

const ws1 = WaveSurfer.create({
  container: document.body,
  waveColor: gradient,
  progressColor: 'rgba(0, 0, 100, 0.5)',
  url: '/examples/audio/audio.wav',
})

const ws2 = WaveSurfer.create({
  container: document.body,
  waveColor: gradient,
  barWidth: 2,
  progressColor: 'rgba(0, 0, 100, 0.5)',
  url: '/examples/audio/audio.wav',
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(ws1, ws2)

WS.WaveformContainer.create(ws1)
WS.WaveformContainer.create(ws2)
WS.PlayerBar.create(ws1)
