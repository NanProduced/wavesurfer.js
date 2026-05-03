import WaveSurfer from 'wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

wavesurfer.on('load', (url) => {
  console.log('Load', url)
})
wavesurfer.on('loading', (percent) => {
  console.log('Loading', percent + '%')
})
wavesurfer.on('decode', (duration) => {
  console.log('Decode', duration + 's')
})
wavesurfer.on('ready', (duration) => {
  console.log('Ready', duration + 's')
})
wavesurfer.on('redraw', () => {
  console.log('Redraw began')
})
wavesurfer.on('redrawcomplete', () => {
  console.log('Redraw complete')
})
wavesurfer.on('play', () => {
  console.log('Play')
})
wavesurfer.on('pause', () => {
  console.log('Pause')
})
wavesurfer.on('finish', () => {
  console.log('Finish')
})
wavesurfer.on('timeupdate', (currentTime) => {
  console.log('Time', currentTime + 's')
})
wavesurfer.on('seeking', (currentTime) => {
  console.log('Seeking', currentTime + 's')
})
wavesurfer.on('interaction', (newTime) => {
  console.log('Interaction', newTime + 's')
})
wavesurfer.on('click', (relativeX) => {
  console.log('Click', relativeX)
})
wavesurfer.on('drag', (relativeX) => {
  console.log('Drag', relativeX)
})
wavesurfer.on('scroll', (visibleStartTime, visibleEndTime) => {
  console.log('Scroll', visibleStartTime + 's', visibleEndTime + 's')
})
wavesurfer.on('zoom', (minPxPerSec) => {
  console.log('Zoom', minPxPerSec + 'px/s')
})
wavesurfer.on('destroy', () => {
  console.log('Destroy')
})

wavesurfer.load('/examples/audio/audio.wav')

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
    <p>Open the console to see the event logs</p>
  </html>
*/
