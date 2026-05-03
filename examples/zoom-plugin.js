// Zoom plugin
// Zoom in or out on the waveform when scrolling the mouse wheel

import WaveSurfer from 'wavesurfer.js'
import ZoomPlugin from 'wavesurfer.js/dist/plugins/zoom.esm.js'

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  minPxPerSec: 100,
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

wavesurfer.registerPlugin(
  ZoomPlugin.create({
    scale: 0.5,
    maxZoom: 100,
  }),
)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

const minPxPerSecSpan = document.querySelector('#minPxPerSec')
wavesurfer.on('zoom', (minPxPerSec) => {
  minPxPerSecSpan.textContent = `${Math.round(minPxPerSec)}`
})

/*
<html>
  <div>
    minPxPerSec: <span id="minPxPerSec">100</span> px/s
  </div>
  <div id="waveform"></div>
  <p>
    📖 Zoom in or out on the waveform when scrolling the mouse wheel
  </p>
</html>
*/
