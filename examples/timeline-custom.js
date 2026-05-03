// Customized Timeline plugin

import WaveSurfer from 'wavesurfer.js'
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js'

const topTimeline = TimelinePlugin.create({
  height: 20,
  insertPosition: 'beforebegin',
  timeInterval: 0.2,
  primaryLabelInterval: 5,
  secondaryLabelInterval: 1,
  style: {
    fontSize: '20px',
    color: '#2D5B88',
  },
})

const bottomTimeline = TimelinePlugin.create({
  height: 10,
  timeInterval: 0.1,
  primaryLabelInterval: 1,
  style: {
    fontSize: '10px',
    color: '#6A3274',
  },
})

const wavesurfer = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  minPxPerSec: 100,
  plugins: [topTimeline, bottomTimeline],
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(wavesurfer)

const waveformCard = WS.WaveformContainer.create(wavesurfer)
WS.PlayerBar.create(wavesurfer)
WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

wavesurfer.once('interaction', () => {
  wavesurfer.play()
})

/*
<html>
  <div id="waveform"></div>
  <p>
    📖 <a href="https://wavesurfer.xyz/docs/modules/plugins_timeline">Timeline plugin docs</a>
  </p>
</html>
*/
