// Set the playback speed

import WaveSurfer from 'wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/librivox.mp3',
  audioRate: 2,
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

let preservePitch = true
const speeds = [0.25, 0.5, 1, 2, 4]

const panel = WS.ControlPanel.create(document.querySelector('#controls'))
panel.addSlider({
  id: 'speed',
  label: 'Playback rate',
  min: 0,
  max: 4,
  step: 1,
  value: 2,
  unit: 'x',
  onChange: (v) => {
    const speed = speeds[v]
    wavesurfer.setPlaybackRate(speed, preservePitch)
    wavesurfer.play()
  },
})
panel.addToggle({
  id: 'preservePitch',
  label: 'Preserve pitch',
  checked: true,
  onChange: (v) => {
    preservePitch = v
    wavesurfer.setPlaybackRate(wavesurfer.getPlaybackRate(), preservePitch)
  },
})

/*
  <html>
    <div id="controls"></div>
  </html>
*/
