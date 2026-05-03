// Silence detection example

import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js'

const ws = WaveSurfer.create({
  container: document.body,
  waveColor: 'rgb(200, 0, 200)',
  progressColor: 'rgb(100, 0, 100)',
  url: '/examples/audio/nasa.mp4',
  minPxPerSec: 50,
  interact: false,
})

window.__ws_instances = window.__ws_instances || []
window.__ws_instances.push(ws)

const wsRegions = ws.registerPlugin(RegionsPlugin.create())

const waveformCard = WS.WaveformContainer.create(ws)
WS.PlayerBar.create(ws)
WS.InfoPanel.create(ws, waveformCard.getCard(), { pluginInstances: { regions: wsRegions } })

const extractRegions = (audioData, duration) => {
  const minValue = 0.01
  const minSilenceDuration = 0.1
  const mergeDuration = 0.2
  const scale = duration / audioData.length
  const silentRegions = []

  let start = 0
  let end = 0
  let isSilent = false
  for (let i = 0; i < audioData.length; i++) {
    if (audioData[i] < minValue) {
      if (!isSilent) {
        start = i
        isSilent = true
      }
    } else if (isSilent) {
      end = i
      isSilent = false
      if (scale * (end - start) > minSilenceDuration) {
        silentRegions.push({
          start: scale * start,
          end: scale * end,
        })
      }
    }
  }

  const mergedRegions = []
  let lastRegion = null
  for (let i = 0; i < silentRegions.length; i++) {
    if (lastRegion && silentRegions[i].start - lastRegion.end < mergeDuration) {
      lastRegion.end = silentRegions[i].end
    } else {
      lastRegion = silentRegions[i]
      mergedRegions.push(lastRegion)
    }
  }

  const regions = []
  let lastEnd = 0
  for (let i = 0; i < mergedRegions.length; i++) {
    regions.push({
      start: lastEnd,
      end: mergedRegions[i].start,
    })
    lastEnd = mergedRegions[i].end
  }

  return regions
}

ws.on('decode', (duration) => {
  const decodedData = ws.getDecodedData()
  if (decodedData) {
    const regions = extractRegions(decodedData.getChannelData(0), duration)

    regions.forEach((region, index) => {
      wsRegions.addRegion({
        start: region.start,
        end: region.end,
        content: index.toString(),
        drag: false,
        resize: false,
      })
    })
  }
})

let activeRegion = null
wsRegions.on('region-clicked', (region, e) => {
  e.stopPropagation()
  region.play()
  activeRegion = region
})
ws.on('timeupdate', (currentTime) => {
  if (activeRegion && currentTime >= activeRegion.end) {
    ws.pause()
    activeRegion = null
  }
})
