// Regions plugin

import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'

const regions = RegionsPlugin.create()

const ws = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  dragToSeek: false,
  url: '/examples/audio/audio.wav',
  plugins: [regions],
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(ws)
window.__ws_regions = regions

const waveformCard = WS.WaveformContainer.create(ws)
WS.PlayerBar.create(ws)
WS.InfoPanel.create(ws, waveformCard.getCard(), { pluginInstances: { regions } })

const random = (min, max) => Math.random() * (max - min) + min
const randomColor = () => `rgba(${random(0, 255)}, ${random(0, 255)}, ${random(0, 255)}, 0.5)`

ws.on('decode', () => {
  regions.addRegion({
    start: 0,
    end: 8,
    content: 'Resize me',
    color: randomColor(),
    drag: false,
    resize: true,
  })
  regions.addRegion({
    start: 9,
    end: 10,
    content: 'Cramped region',
    color: randomColor(),
    minLength: 1,
    maxLength: 10,
  })
  regions.addRegion({
    start: 12,
    end: 17,
    content: 'Drag me',
    color: randomColor(),
    resize: false,
  })

  regions.addRegion({
    start: 19,
    content: 'Marker',
    color: randomColor(),
  })
  regions.addRegion({
    start: 20,
    content: 'Second marker',
    color: randomColor(),
  })
})

regions.on('region-updated', (region) => {
  console.log('Updated region', region)
})

let loop = true

let activeRegion = null
regions.on('region-in', (region) => {
  console.log('region-in', region)
  activeRegion = region
})
regions.on('region-out', (region) => {
  console.log('region-out', region)
  if (activeRegion === region) {
    if (loop) {
      region.play()
    } else {
      activeRegion = null
    }
  }
})
regions.on('region-clicked', (region, e) => {
  e.stopPropagation()
  activeRegion = region
  region.play(true)
  region.setOptions({ color: randomColor() })
})
ws.on('interaction', () => {
  activeRegion = null
})

const panel = WS.ControlPanel.create(document.querySelector('#controls'))
panel.addToggle({
  id: 'loop',
  label: 'Loop regions',
  checked: true,
  onChange: (val) => {
    loop = val
  },
})

let dragSelection = undefined
panel.addToggle({
  id: 'dragSelectToggle',
  label: 'Enable drag select',
  checked: false,
  onChange: () => {
    if (!dragSelection) {
      dragSelection = regions.enableDragSelection({
        color: 'rgba(255, 0, 0, 0.1)',
      })
    } else {
      dragSelection()
      dragSelection = undefined
    }
  },
})

panel.addToggle({
  id: 'dragToSeekToggle',
  label: 'Enable drag to seek',
  checked: false,
  onChange: () => {
    const current = ws.options.dragToSeek
    ws.setOptions({ dragToSeek: !current })
  },
})

ws.once('decode', () => {
  panel.addSlider({
    id: 'zoom',
    label: 'Zoom',
    min: 10,
    max: 1000,
    step: 1,
    value: 10,
    unit: 'px/s',
    onChange: (v) => ws.zoom(v),
  })
})

WS.RegionList.create(ws, regions, document.querySelector('#region-list'))

/*
  <html>
    <div id="waveform"></div>

    <div id="controls"></div>

    <div id="region-list"></div>

    <p>
      <a href="https://wavesurfer.xyz/docs/classes/plugins_regions.default">Regions plugin docs</a>
    </p>
  </html>
*/
