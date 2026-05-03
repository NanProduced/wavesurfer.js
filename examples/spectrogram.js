// Spectrogram plugin example

import WaveSurfer from 'wavesurfer.js'
import Spectrogram from 'wavesurfer.js/dist/plugins/spectrogram.esm.js'

const ws = WaveSurfer.create({
  container: '#waveform',
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/audio.wav',
  sampleRate: 44100,
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(ws)

ws.registerPlugin(
  Spectrogram.create({
    labels: true,
    height: 200,
    splitChannels: true,
    scale: 'mel',
    frequencyMax: 8000,
    frequencyMin: 0,
    fftSamples: 1024,
    labelsBackground: 'rgba(0, 0, 0, 0.1)',
    useWebWorker: true,
  }),
)

const waveformCard = WS.WaveformContainer.create(ws)
WS.PlayerBar.create(ws)
WS.InfoPanel.create(ws, waveformCard.getCard())

ws.once('interaction', () => {
  ws.play()
})

ws.on('spectrogram-ready', () => {
  console.log('Spectrogram has finished rendering')
})

ws.on('spectrogram-click', (relativeX) => {
  console.log('Clicked on spectrogram at position:', relativeX)
  ws.setTime(relativeX * ws.getDuration())
})

/*
<html>
  <div id="waveform"></div>

  <div style="margin-top: 20px; padding: 15px; border-radius: 8px;">
    <div style=" border: 1px solid #ffeaa7; border-radius: 6px; padding: 12px; margin-bottom: 15px;">
      <strong>⚠️ Important Note:</strong> For audio files that require scrolling (longer than the container width),
      you <strong>MUST</strong> set a <code>minPxPerSec</code> value in the WaveSurfer configuration to ensure
      proper spectrogram rendering.
    </div>

    <h3>Spectrogram Settings</h3>

    <h4>Visual Options</h4>
    <ul>
      <li><code>labels: true/false</code> - Show frequency labels on the left</li>
      <li><code>height: 200</code> - Spectrogram height in pixels</li>
      <li><code>splitChannels: true/false</code> - Separate spectrograms for each audio channel</li>
    </ul>

    <h4>Frequency Settings</h4>
    <ul>
      <li><code>scale: 'mel'|'linear'|'logarithmic'|'bark'|'erb'</code> - Frequency scale type</li>
      <li><code>frequencyMax: 8000</code> - Maximum frequency to display (Hz)</li>
      <li><code>frequencyMin: 0</code> - Minimum frequency to display (Hz)</li>
    </ul>

    <h4>Performance Settings</h4>
    <ul>
      <li><code>fftSamples: 1024</code> - FFT resolution (512, 1024, 2048, 4096)</li>
      <li><code>useWebWorker: true</code> - Use web worker for faster processing</li>
    </ul>

    <p style="margin-top: 15px; font-size: 14px;">
      📖 <a href="https://wavesurfer.xyz/docs/modules/plugins_spectrogram">Full Documentation</a>
    </p>
  </div>
</html>
*/
