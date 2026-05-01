export type FadeCurve = 'linear' | 'equal-power'

export type ExportOptions = {
  fadeIn?: boolean
  fadeOut?: boolean
  fadeDuration?: number
  fadeCurve?: FadeCurve
  zeroCrossingAlignment?: boolean
  zeroCrossingSearchRange?: number
}

export type RegionInfo = {
  id: string
  start: number
  end: number
  label?: string
}

export type ExportProgressCallback = (current: number, total: number, region: RegionInfo) => void

const defaultExportOptions: Required<ExportOptions> = {
  fadeIn: true,
  fadeOut: true,
  fadeDuration: 0.01,
  fadeCurve: 'equal-power',
  zeroCrossingAlignment: true,
  zeroCrossingSearchRange: 0.01,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function float32ToInt16(float: number): number {
  const clamped = clamp(float, -1, 1)
  return Math.round(clamped * (clamped < 0 ? 0x8000 : 0x7fff))
}

function findZeroCrossing(
  channelData: Float32Array,
  startSample: number,
  searchRange: number,
  sampleRate: number,
  direction: 'left' | 'right',
): number {
  const samplesToSearch = Math.min(Math.floor(searchRange * sampleRate), channelData.length)
  let bestSample = startSample

  for (let i = 0; i < samplesToSearch; i++) {
    const sampleIndex = direction === 'right' ? startSample + i : startSample - i

    if (sampleIndex < 0 || sampleIndex >= channelData.length) {
      break
    }

    if (Math.abs(channelData[sampleIndex]) < 0.05) {
      bestSample = sampleIndex
      break
    }

    if (sampleIndex > 0) {
      const prevSample = channelData[sampleIndex - 1]
      const currSample = channelData[sampleIndex]

      if ((prevSample < 0 && currSample >= 0) || (prevSample >= 0 && currSample < 0)) {
        if (Math.abs(prevSample) < Math.abs(currSample)) {
          bestSample = sampleIndex - 1
        } else {
          bestSample = sampleIndex
        }
        break
      }
    }
  }

  return bestSample
}

function calculateFadeValue(progress: number, curve: FadeCurve): number {
  if (curve === 'linear') {
    return progress
  }
  return Math.sin((progress * Math.PI) / 2)
}

function applyFade(
  channelData: Float32Array,
  startSample: number,
  endSample: number,
  fadeType: 'in' | 'out',
  curve: FadeCurve,
): Float32Array {
  const result = new Float32Array(channelData) as Float32Array
  const fadeLength = endSample - startSample

  for (let i = 0; i < fadeLength; i++) {
    const progress = fadeType === 'in' ? i / fadeLength : 1 - i / fadeLength
    const fadeValue = calculateFadeValue(progress, curve)
    const sampleIndex = startSample + i
    if (sampleIndex >= 0 && sampleIndex < result.length) {
      result[sampleIndex] *= fadeValue
    }
  }

  return result
}

function sliceAudioBuffer(
  buffer: AudioBuffer,
  startTime: number,
  endTime: number,
  options: Required<ExportOptions>,
): { channels: Float32Array[]; actualStartTime: number; actualEndTime: number } {
  const sampleRate = buffer.sampleRate
  const startSample = Math.floor(startTime * sampleRate)
  const endSample = Math.ceil(endTime * sampleRate)
  const numChannels = buffer.numberOfChannels

  let actualStartSample = startSample
  let actualEndSample = endSample

  if (options.zeroCrossingAlignment) {
    const firstChannel = buffer.getChannelData(0)

    actualStartSample = findZeroCrossing(
      firstChannel,
      startSample,
      options.zeroCrossingSearchRange,
      sampleRate,
      'right',
    )

    actualEndSample = findZeroCrossing(firstChannel, endSample, options.zeroCrossingSearchRange, sampleRate, 'left')
  }

  const resultLength = actualEndSample - actualStartSample
  if (resultLength <= 0) {
    return {
      channels: [],
      actualStartTime: startTime,
      actualEndTime: endTime,
    }
  }

  const channels: Float32Array[] = []

  for (let ch = 0; ch < numChannels; ch++) {
    const channelData = buffer.getChannelData(ch)
    let slicedData = channelData.slice(actualStartSample, actualEndSample) as Float32Array

    if (options.fadeIn && options.fadeDuration > 0) {
      const fadeInSamples = Math.min(Math.floor(options.fadeDuration * sampleRate), resultLength)
      const tempData = new Float32Array(slicedData.length)
      tempData.set(slicedData)
      slicedData = applyFade(tempData, 0, fadeInSamples, 'in', options.fadeCurve)
    }

    if (options.fadeOut && options.fadeDuration > 0) {
      const fadeOutSamples = Math.min(Math.floor(options.fadeDuration * sampleRate), resultLength)
      const fadeOutStart = resultLength - fadeOutSamples
      slicedData = applyFade(slicedData, fadeOutStart, resultLength, 'out', options.fadeCurve)
    }

    channels.push(slicedData)
  }

  return {
    channels,
    actualStartTime: actualStartSample / sampleRate,
    actualEndTime: actualEndSample / sampleRate,
  }
}

function writeString(view: DataView, offset: number, string: string): number {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i))
  }
  return offset + string.length
}

function encodeWAV(channels: Float32Array[], sampleRate: number): ArrayBuffer {
  const numChannels = channels.length
  const length = channels[0].length
  const bitsPerSample = 16
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataLength = length * blockAlign

  const buffer = new ArrayBuffer(44 + dataLength)
  const view = new DataView(buffer)

  let offset = 0

  offset = writeString(view, offset, 'RIFF')
  view.setUint32(offset, 36 + dataLength, true)
  offset += 4

  offset = writeString(view, offset, 'WAVE')

  offset = writeString(view, offset, 'fmt ')
  view.setUint32(offset, 16, true)
  offset += 4
  view.setUint16(offset, 1, true)
  offset += 2
  view.setUint16(offset, numChannels, true)
  offset += 2
  view.setUint32(offset, sampleRate, true)
  offset += 4
  view.setUint32(offset, sampleRate * blockAlign, true)
  offset += 4
  view.setUint16(offset, blockAlign, true)
  offset += 2
  view.setUint16(offset, bitsPerSample, true)
  offset += 2

  offset = writeString(view, offset, 'data')
  view.setUint32(offset, dataLength, true)
  offset += 4

  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const int16 = float32ToInt16(channels[ch][i])
      view.setInt16(offset, int16, true)
      offset += 2
    }
  }

  return buffer
}

export function exportRegionAsWAV(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  options: ExportOptions = {},
): { wavBlob: Blob; actualStartTime: number; actualEndTime: number } {
  const exportOptions: Required<ExportOptions> = {
    ...defaultExportOptions,
    ...options,
  }

  const { channels, actualStartTime, actualEndTime } = sliceAudioBuffer(audioBuffer, startTime, endTime, exportOptions)

  if (channels.length === 0) {
    return {
      wavBlob: new Blob(),
      actualStartTime,
      actualEndTime,
    }
  }

  const wavBuffer = encodeWAV(channels, audioBuffer.sampleRate)
  const wavBlob = new Blob([wavBuffer], { type: 'audio/wav' })

  return { wavBlob, actualStartTime, actualEndTime }
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds * 1000) % 1000)
  if (mins > 0) {
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`
  }
  return `${secs}.${ms.toString().padStart(3, '0')}`
}

export function generateFilename(region: RegionInfo, index?: number, total?: number): string {
  const safeLabel = (region.label || 'region').replace(/[^a-zA-Z0-9_\u4e00-\u9fa5-]/g, '_')
  const startTime = formatTime(region.start).replace(':', '_')
  const endTime = formatTime(region.end).replace(':', '_')

  if (index !== undefined && total !== undefined && total > 1) {
    return `${index.toString().padStart(2, '0')}-${safeLabel}_${startTime}-${endTime}.wav`
  }
  return `${safeLabel}_${startTime}-${endTime}.wav`
}

type JSZipType = {
  file: (name: string, data: Blob) => void
  generateAsync: (options: { type: 'blob'; compression: string }) => Promise<Blob>
}

declare global {
  interface Window {
    JSZip?: new () => JSZipType
  }
}

export async function createZipArchive(
  files: { filename: string; blob: Blob }[],
  onProgress?: (current: number, total: number) => void,
): Promise<Blob> {
  const JSZip = window.JSZip

  if (!JSZip) {
    console.warn('JSZip not available. Please include JSZip library for batch export.')
    files.forEach((file, index) => {
      setTimeout(() => {
        downloadBlob(file.blob, file.filename)
      }, index * 500)
    })
    throw new Error('JSZip not available. Files have been downloaded individually.')
  }

  const zip = new JSZip()

  for (let i = 0; i < files.length; i++) {
    zip.file(files[i].filename, files[i].blob)
    onProgress?.(i + 1, files.length)
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
}

export { defaultExportOptions }
