// Split channels

import WaveSurfer from 'wavesurfer.js'

const wavesurfer = WaveSurfer.create({
  container: document.body,
  url: '/examples/audio/stereo.mp3',
  splitChannels: [
    {
      waveColor: 'rgb(200, 0, 200)',
      progressColor: 'rgb(100, 0, 100)',
    },
    {
      waveColor: 'rgb(0, 200, 200)',
      progressColor: 'rgb(0, 100, 100)',
    },
  ],
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

wavesurfer.on('interaction', () => {
  wavesurfer.play()
})
