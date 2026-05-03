// Envelope plugin
// Graphical fade-in and fade-out and volume control

import WaveSurfer from 'wavesurfer.js'
import EnvelopePlugin from 'wavesurfer.js/dist/plugins/envelope.esm.js'

const wavesurfer = WaveSurfer.create({
  container: '#container',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const isMobile = top.matchMedia('(max-width: 900px)').matches

const envelope = wavesurfer.registerPlugin(
  EnvelopePlugin.create({
    volume: 0.8,
    lineColor: 'rgba(255, 0, 0, 0.5)',
    lineWidth: 4,
    dragPointSize: isMobile ? 20 : 12,
    dragLine: !isMobile,
    dragPointFill: 'rgba(0, 255, 255, 0.8)',
    dragPointStroke: 'rgba(0, 0, 0, 0.5)',
    points: [
      { time: 11.2, volume: 0.5 },
      { time: 15.5, volume: 0.8 },
    ],
  }),
)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

envelope.on('points-change', (points) => {
  console.log('Envelope points changed', points)
})

envelope.addPoint({ time: 1, volume: 0.9 })

const randomizePoints = () => {
  const points = []
  const len = 5 * Math.random()
  for (let i = 0; i < len; i++) {
    points.push({
      time: Math.random() * wavesurfer.getDuration(),
      volume: Math.random(),
    })
  }
  envelope.setPoints(points)
}

const volumeLabel = document.querySelector('label')
const showVolume = () => {
  volumeLabel.textContent = envelope.getCurrentVolume().toFixed(2)
}
envelope.on('volume-change', showVolume)
wavesurfer.on('ready', showVolume)

document.querySelector('#randomize').onclick = randomizePoints

/*
<html>
  <div id="container" style="border: 1px solid #ddd;"></div>

  <div id="controls"></div>

  <p>
    Volume: <label>0</label>
  </p>
  <p>
    📖 <a href="https://wavesurfer.xyz/docs/classes/plugins_envelope.EnvelopePlugin">Envelope plugin docs</a>
  </p>
</html>
*/
