// Timeline plugin

import WaveSurfer from 'wavesurfer.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  minPxPerSec: 100,
  plugins: [TimelinePlugin.create()],
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

wavesurfer.on('interaction', () => {
  wavesurfer.play()
})

wavesurfer.on('finish', () => {
  wavesurfer.setTime(0)
})

const panel = WS.ControlPanel.create(document.querySelector('#controls'))

wavesurfer.once('decode', () => {
  panel.addSlider({
    id: 'zoom',
    label: 'Zoom',
    min: 10,
    max: 1000,
    step: 1,
    value: 100,
    unit: 'px/s',
    onChange: (v) => wavesurfer.zoom(v),
  })
})

/*
  <html>
    <div id="controls"></div>
    <div id="waveform"></div>
    <p>
      📖 <a href="https://wavesurfer.xyz/docs/classes/plugins_timeline.TimelinePlugin">Timeline plugin docs</a>
    </p>
  </html>
*/
