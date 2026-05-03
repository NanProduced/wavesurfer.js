// Zooming the waveform

import WaveSurfer from 'wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  minPxPerSec: 100,
  dragToSeek: true,
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

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

  panel.addToggle({
    id: 'scrollbar',
    label: 'Scroll bar',
    checked: true,
    onChange: (v) => wavesurfer.setOptions({ hideScrollbar: !v }),
  })

  panel.addToggle({
    id: 'fillParent',
    label: 'Fill parent',
    checked: true,
    onChange: (v) => wavesurfer.setOptions({ fillParent: v }),
  })

  panel.addToggle({
    id: 'autoCenter',
    label: 'Auto center',
    checked: true,
    onChange: (v) => wavesurfer.setOptions({ autoCenter: v }),
  })
})

/*
  <html>
    <div id="controls"></div>
  </html>
*/
