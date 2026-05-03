import WaveSurfer from 'wavesurfer.js'
import WebAudioPlayer from 'wavesurfer.js/dist/webaudio.js'

const webAudioPlayer = new WebAudioPlayer()
webAudioPlayer.src = '/examples/audio/audio.wav'

webAudioPlayer.addEventListener('loadedmetadata', () => {
  const wavesurfer = WaveSurfer.create({
    container: document.body,
    media: webAudioPlayer,
    peaks: webAudioPlayer.getChannelData(),
    duration: webAudioPlayer.duration,
  })

  window.__ws_instances = window.__ws_instances || []
  window.__ws_instances.push(wavesurfer)

  const waveformCard = WS.WaveformContainer.create(wavesurfer)
  WS.PlayerBar.create(wavesurfer)
  WS.InfoPanel.create(wavesurfer, waveformCard.getCard())

  wavesurfer.on('click', () => {
    wavesurfer.play()
  })
})
