export type FadeCurve = 'linear' | 'equal-power'
export type ExportOptions = {
  fadeIn: boolean
  fadeOut: boolean
  fadeCurve: FadeCurve
  fadeDuration: number
  zeroCrossing: boolean
  zeroCrossingThreshold: number
}

const defaultExportOptions: ExportOptions = {
  fadeIn: true,
  fadeOut: true,
  fadeCurve: 'equal-power',
  fadeDuration: 0.01,
  zeroCrossing: true,
  zeroCrossingThreshold: 0.001,
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function float32ToInt16(value: number): number {
  const clamped = clamp(value, -1, 1)
  return Math.round(clamped * 32767)
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i))
  }
}

function writeInt16(view: DataView, offset: number, value: number, littleEndian: boolean = true): void {
  view.setInt16(offset, value, littleEndian)
}

function writeUint32(view: DataView, offset: number, value: number, littleEndian: boolean = true): void {
  view.setUint32(offset, value, littleEndian)
}

function findNearestZeroCrossing(
  channelData: Float32Array,
  position: number,
  sampleRate: number,
  threshold: number,
  searchRange: number = 0.01,
): number {
  const searchSamples = Math.floor(searchRange * sampleRate)
  const startSearch = Math.max(0, position - searchSamples)
  const endSearch = Math.min(channelData.length, position + searchSamples)

  let bestPosition = position
  let bestDistance = Infinity

  for (let i = startSearch; i < endSearch - 1; i++) {
    const current = channelData[i]
    const next = channelData[i + 1]

    if ((current <= 0 && next >= 0) || (current >= 0 && next <= 0)) {
      if (Math.abs(current) < threshold || Math.abs(next) < threshold) {
        const distance = Math.abs(i - position)
        if (distance < bestDistance) {
          bestDistance = distance
          bestPosition = Math.abs(current) < Math.abs(next) ? i : i + 1
        }
      }
    }
  }

  if (bestPosition === position) {
    for (let i = startSearch; i < endSearch; i++) {
      const absValue = Math.abs(channelData[i])
      const distance = Math.abs(i - position)
      if (absValue < threshold && distance < bestDistance) {
        bestDistance = distance
        bestPosition = i
      }
    }
  }

  return bestPosition
}

function applyFade(channelData: Float32Array, start: number, end: number, isFadeIn: boolean, curve: FadeCurve): void {
  const length = end - start
  if (length <= 0) return

  for (let i = 0; i < length; i++) {
    const progress = isFadeIn ? i / (length - 1) : 1 - i / (length - 1)
    let gain: number

    if (curve === 'linear') {
      gain = progress
    } else {
      gain = Math.sin((progress * Math.PI) / 2)
    }

    channelData[start + i] *= gain
  }
}

function sliceAudioBuffer(
  audioBuffer: AudioBuffer,
  startTime: number,
  endTime: number,
  options: Partial<ExportOptions> = {},
): AudioBuffer {
  const opts: ExportOptions = { ...defaultExportOptions, ...options }
  const sampleRate = audioBuffer.sampleRate
  const numberOfChannels = audioBuffer.numberOfChannels

  let startSample = Math.floor(startTime * sampleRate)
  let endSample = Math.floor(endTime * sampleRate)

  startSample = Math.max(0, startSample)
  endSample = Math.min(audioBuffer.length, endSample)

  if (opts.zeroCrossing) {
    const firstChannel = audioBuffer.getChannelData(0)
    const adjustedStart = findNearestZeroCrossing(firstChannel, startSample, sampleRate, opts.zeroCrossingThreshold)
    const adjustedEnd = findNearestZeroCrossing(firstChannel, endSample, sampleRate, opts.zeroCrossingThreshold)

    if (adjustedEnd > adjustedStart) {
      startSample = adjustedStart
      endSample = adjustedEnd
    }
  }

  const newLength = endSample - startSample
  if (newLength <= 0) {
    throw new Error('Invalid audio slice: start time must be before end time')
  }

  const offlineCtx = new OfflineAudioContext(numberOfChannels, newLength, sampleRate)
  const newBuffer = offlineCtx.createBuffer(numberOfChannels, newLength, sampleRate)

  for (let channel = 0; channel < numberOfChannels; channel++) {
    const sourceChannel = audioBuffer.getChannelData(channel)
    const destChannel = newBuffer.getChannelData(channel)

    for (let i = 0; i < newLength; i++) {
      destChannel[i] = sourceChannel[startSample + i]
    }

    const fadeSamples = Math.floor(opts.fadeDuration * sampleRate)

    if (opts.fadeIn && fadeSamples > 0) {
      const actualFadeSamples = Math.min(fadeSamples, newLength)
      applyFade(destChannel, 0, actualFadeSamples, true, opts.fadeCurve)
    }

    if (opts.fadeOut && fadeSamples > 0) {
      const actualFadeSamples = Math.min(fadeSamples, newLength)
      applyFade(destChannel, newLength - actualFadeSamples, newLength, false, opts.fadeCurve)
    }
  }

  return newBuffer
}

function audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
  const numberOfChannels = audioBuffer.numberOfChannels
  const sampleRate = audioBuffer.sampleRate
  const length = audioBuffer.length
  const bitsPerSample = 16
  const bytesPerSample = bitsPerSample / 8
  const bytesPerFrame = numberOfChannels * bytesPerSample

  const dataSize = length * bytesPerFrame
  const bufferSize = 44 + dataSize

  const arrayBuffer = new ArrayBuffer(bufferSize)
  const view = new DataView(arrayBuffer)

  writeString(view, 0, 'RIFF')
  writeUint32(view, 4, bufferSize - 8)
  writeString(view, 8, 'WAVE')

  writeString(view, 12, 'fmt ')
  writeUint32(view, 16, 16)
  writeInt16(view, 20, 1)
  writeInt16(view, 22, numberOfChannels)
  writeUint32(view, 24, sampleRate)
  writeUint32(view, 28, sampleRate * bytesPerFrame)
  writeInt16(view, 32, bytesPerFrame)
  writeInt16(view, 34, bitsPerSample)

  writeString(view, 36, 'data')
  writeUint32(view, 40, dataSize)

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = audioBuffer.getChannelData(channel)[i]
      const int16Value = float32ToInt16(sample)
      writeInt16(view, offset, int16Value)
      offset += 2
    }
  }

  return arrayBuffer
}

function audioBufferToWavBlob(audioBuffer: AudioBuffer): Blob {
  const arrayBuffer = audioBufferToWav(audioBuffer)
  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function createSimpleZip(files: Array<{ filename: string; content: ArrayBuffer | string }>): ArrayBuffer {
  const encoder = new TextEncoder()
  const localFileHeaders: ArrayBuffer[] = []
  const centralDirectoryEntries: ArrayBuffer[] = []
  let offset = 0

  files.forEach((file) => {
    let contentBytes: Uint8Array
    if (typeof file.content === 'string') {
      contentBytes = encoder.encode(file.content)
    } else {
      contentBytes = new Uint8Array(file.content)
    }

    const filenameBytes = encoder.encode(file.filename)
    const filenameLength = filenameBytes.length

    const localFileHeader = new DataView(new ArrayBuffer(30 + filenameLength))
    writeString(localFileHeader, 0, 'PK\x03\x04')
    localFileHeader.setUint16(4, 20, true)
    localFileHeader.setUint16(6, 0, true)
    localFileHeader.setUint16(8, 0, true)
    localFileHeader.setUint16(10, 0, true)
    localFileHeader.setUint16(12, 0, true)
    localFileHeader.setUint32(14, crc32(contentBytes), true)
    localFileHeader.setUint32(18, contentBytes.length, true)
    localFileHeader.setUint32(22, contentBytes.length, true)
    localFileHeader.setUint16(26, filenameLength, true)
    localFileHeader.setUint16(28, 0, true)

    const lfhArray = new Uint8Array(localFileHeader.buffer)
    lfhArray.set(filenameBytes, 30)
    localFileHeaders.push(lfhArray.buffer)
    localFileHeaders.push(contentBytes.buffer)

    const centralDirectoryEntry = new DataView(new ArrayBuffer(46 + filenameLength))
    writeString(centralDirectoryEntry, 0, 'PK\x01\x02')
    centralDirectoryEntry.setUint16(4, 20, true)
    centralDirectoryEntry.setUint16(6, 20, true)
    centralDirectoryEntry.setUint16(8, 0, true)
    centralDirectoryEntry.setUint16(10, 0, true)
    centralDirectoryEntry.setUint16(12, 0, true)
    centralDirectoryEntry.setUint16(14, 0, true)
    centralDirectoryEntry.setUint32(16, crc32(contentBytes), true)
    centralDirectoryEntry.setUint32(20, contentBytes.length, true)
    centralDirectoryEntry.setUint32(24, contentBytes.length, true)
    centralDirectoryEntry.setUint16(28, filenameLength, true)
    centralDirectoryEntry.setUint16(30, 0, true)
    centralDirectoryEntry.setUint16(32, 0, true)
    centralDirectoryEntry.setUint16(34, 0, true)
    centralDirectoryEntry.setUint16(36, 0, true)
    centralDirectoryEntry.setUint32(38, 0, true)
    centralDirectoryEntry.setUint32(42, offset, true)

    const cdeArray = new Uint8Array(centralDirectoryEntry.buffer)
    cdeArray.set(filenameBytes, 46)
    centralDirectoryEntries.push(cdeArray.buffer)

    offset += 30 + filenameLength + contentBytes.length
  })

  let centralDirectorySize = 0
  centralDirectoryEntries.forEach((entry) => {
    centralDirectorySize += entry.byteLength
  })

  const endOfCentralDirectory = new DataView(new ArrayBuffer(22))
  writeString(endOfCentralDirectory, 0, 'PK\x05\x06')
  endOfCentralDirectory.setUint16(4, 0, true)
  endOfCentralDirectory.setUint16(6, 0, true)
  endOfCentralDirectory.setUint16(8, files.length, true)
  endOfCentralDirectory.setUint16(10, files.length, true)
  endOfCentralDirectory.setUint32(12, centralDirectorySize, true)
  endOfCentralDirectory.setUint32(16, offset, true)
  endOfCentralDirectory.setUint16(20, 0, true)

  const totalSize =
    localFileHeaders.reduce((sum, h) => sum + h.byteLength, 0) +
    centralDirectorySize +
    endOfCentralDirectory.buffer.byteLength

  const result = new Uint8Array(totalSize)
  let pos = 0

  localFileHeaders.forEach((header) => {
    result.set(new Uint8Array(header), pos)
    pos += header.byteLength
  })

  centralDirectoryEntries.forEach((entry) => {
    result.set(new Uint8Array(entry), pos)
    pos += entry.byteLength
  })

  result.set(new Uint8Array(endOfCentralDirectory.buffer), pos)

  return result.buffer
}

const crc32Table = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c
  }
  return table
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = crc32Table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const AudioExport = {
  defaultExportOptions,
  clamp,
  float32ToInt16,
  sliceAudioBuffer,
  audioBufferToWav,
  audioBufferToWavBlob,
  downloadBlob,
  createSimpleZip,
  findNearestZeroCrossing,
  applyFade,
}

export default AudioExport
export {
  defaultExportOptions,
  clamp,
  float32ToInt16,
  sliceAudioBuffer,
  audioBufferToWav,
  audioBufferToWavBlob,
  downloadBlob,
  createSimpleZip,
  findNearestZeroCrossing,
  applyFade,
}
