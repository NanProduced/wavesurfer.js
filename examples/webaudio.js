// Web Audio example

import WaveSurfer from 'wavesurfer.js'

const eqBands = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

const wavesurfer = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  mediaControls: true,
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

wavesurfer.on('click', () => wavesurfer.playPause())

wavesurfer.once('play', () => {
  const audioContext = new AudioContext()

  const filters = eqBands.map((band) => {
    const filter = audioContext.createBiquadFilter()
    filter.type = band <= 32 ? 'lowshelf' : band >= 16000 ? 'highshelf' : 'peaking'
    filter.gain.value = Math.random() * 40 - 20
    filter.Q.value = 1
    filter.frequency.value = band
    return filter
  })

  const audio = wavesurfer.getMediaElement()
  const mediaNode = audioContext.createMediaElementSource(audio)

  const equalizer = filters.reduce((prev, curr) => {
    prev.connect(curr)
    return curr
  }, mediaNode)

  equalizer.connect(audioContext.destination)

  sliders.forEach((slider, i) => {
    const filter = filters[i]
    filter.gain.value = slider.value
    slider.oninput = (e) => (filter.gain.value = e.target.value)
  })
})

const container = document.createElement('p')
const sliders = eqBands.map(() => {
  const slider = document.createElement('input')
  slider.type = 'range'
  slider.orient = 'vertical'
  slider.style.appearance = 'slider-vertical'
  slider.style.width = '8%'
  slider.min = -40
  slider.max = 40
  slider.value = Math.random() * 40 - 20
  slider.step = 0.1
  container.appendChild(slider)
  return slider
})
document.body.appendChild(container)
