/**
 * Beat Detection plugin for wavesurfer.js
 *
 * Detects beats and tempo (BPM) from audio using spectral flux algorithm,
 * displays beat grid on the waveform, and supports snap-to-beat functionality.
 */

import BasePlugin, { type BasePluginEvents } from '../base-plugin.js'
import createElement from '../dom.js'
import { FFT } from '../fft.js'
import { createDragStream } from '../reactive/drag-stream.js'
import { effect } from '../reactive/store.js'

export type BeatDetectionPluginOptions = {
  /** FFT size for spectral analysis, must be a power of 2 */
  fftSize?: number
  /** Hop size between FFT frames (as fraction of fftSize) */
  hopSize?: number
  /** Window function for FFT */
  windowFunc?:
    | 'bartlett'
    | 'bartlettHann'
    | 'blackman'
    | 'cosine'
    | 'gauss'
    | 'hamming'
    | 'hann'
    | 'lanczoz'
    | 'rectangular'
    | 'triangular'
  /** Sensitivity threshold for peak detection (0-1) */
  threshold?: number
  /** Minimum BPM to consider */
  minBpm?: number
  /** Maximum BPM to consider */
  maxBpm?: number
  /** Beat grid line color */
  beatColor?: string
  /** Downbeat (first beat of bar) line color */
  downbeatColor?: string
  /** Beat grid line width */
  beatWidth?: number
  /** Downbeat line width */
  downbeatWidth?: number
  /** Enable snap-to-beat by default */
  snapToBeat?: boolean
  /** Time signature (beats per bar) */
  timeSignature?: number
}

const defaultOptions = {
  fftSize: 2048,
  hopSize: 0.25,
  windowFunc: 'hann' as const,
  threshold: 0.3,
  minBpm: 60,
  maxBpm: 240,
  beatColor: 'rgba(255, 200, 0, 0.6)',
  downbeatColor: 'rgba(255, 100, 0, 0.8)',
  beatWidth: 1,
  downbeatWidth: 2,
  snapToBeat: false,
  timeSignature: 4,
}

export type BeatDetectionPluginEvents = BasePluginEvents & {
  /** Fired when beat detection is complete */
  'beat-detection-complete': [beats: number[], bpm: number]
  /** Fired when BPM changes */
  'bpm-change': [bpm: number]
  /** Fired when a beat is clicked */
  'beat-click': [beatIndex: number, time: number]
  /** Fired when snap-to-beat state changes */
  'snap-to-beat-change': [enabled: boolean]
  /** Fired when a beat marker is dragged and released */
  'beat-drag-end': [beatIndex: number, oldTime: number, newTime: number]
}

class BeatMarker {
  public element: HTMLElement
  public time: number
  public beatIndex: number
  public isDownbeat: boolean
  private subscriptions: (() => void)[] = []
  private isDragging: boolean = false
  private startDragTime: number = 0

  constructor(
    time: number,
    beatIndex: number,
    isDownbeat: boolean,
    private totalDuration: number,
    private container: HTMLElement,
    private options: {
      beatColor: string
      downbeatColor: string
      beatWidth: number
      downbeatWidth: number
      draggable: boolean
    },
    private onDragEnd?: (beatIndex: number, oldTime: number, newTime: number) => void,
  ) {
    this.time = time
    this.beatIndex = beatIndex
    this.isDownbeat = isDownbeat
    this.element = this.createElement()
    this.initMouseEvents()
  }

  private createElement(): HTMLElement {
    const color = this.isDownbeat ? this.options.downbeatColor : this.options.beatColor
    const width = this.isDownbeat ? this.options.downbeatWidth : this.options.beatWidth

    return createElement('div', {
      part: `beat-marker ${this.isDownbeat ? 'beat-marker-downbeat' : 'beat-marker-regular'}`,
      style: {
        position: 'absolute',
        top: '0',
        height: '100%',
        width: `${width}px`,
        backgroundColor: color,
        zIndex: '6',
        pointerEvents: this.options.draggable ? 'all' : 'none',
        cursor: this.options.draggable ? 'ew-resize' : 'default',
      },
    })
  }

  private initMouseEvents() {
    if (!this.options.draggable) return

    const dragStream = createDragStream(this.element, { threshold: 1 })

    const unsubscribeDrag = effect(() => {
      const drag = dragStream.signal.value
      if (!drag) return

      if (drag.type === 'start') {
        this.isDragging = true
        this.startDragTime = this.time
      } else if (drag.type === 'move' && drag.deltaX !== undefined) {
        const parentRect = this.container.getBoundingClientRect()
        const deltaSeconds = (drag.deltaX / parentRect.width) * this.totalDuration
        const newTime = Math.max(0, Math.min(this.totalDuration, this.time + deltaSeconds))
        if (newTime !== this.time) {
          this.time = newTime
          this.renderPosition()
        }
      } else if (drag.type === 'end') {
        this.isDragging = false
        if (this.time !== this.startDragTime && this.onDragEnd) {
          this.onDragEnd(this.beatIndex, this.startDragTime, this.time)
        }
      }
    }, [dragStream.signal])

    this.subscriptions.push(() => {
      unsubscribeDrag()
      dragStream.cleanup()
    })
  }

  public renderPosition() {
    const position = (this.time / this.totalDuration) * 100
    this.element.style.left = `${position}%`
  }

  public setTotalDuration(duration: number) {
    this.totalDuration = duration
    this.renderPosition()
  }

  public updateBeatIndex(index: number) {
    this.beatIndex = index
  }

  public updateIsDownbeat(isDownbeat: boolean) {
    this.isDownbeat = isDownbeat
    const color = isDownbeat ? this.options.downbeatColor : this.options.beatColor
    const width = isDownbeat ? this.options.downbeatWidth : this.options.beatWidth
    this.element.style.backgroundColor = color
    this.element.style.width = `${width}px`
    this.element.setAttribute('part', `beat-marker ${isDownbeat ? 'beat-marker-downbeat' : 'beat-marker-regular'}`)
  }

  public destroy() {
    this.subscriptions.forEach((unsubscribe) => unsubscribe())
    this.subscriptions = []
    this.element.remove()
  }
}

class BeatDetectionPlugin extends BasePlugin<BeatDetectionPluginEvents, BeatDetectionPluginOptions> {
  protected options: BeatDetectionPluginOptions & typeof defaultOptions
  private beatMarkers: BeatMarker[] = []
  private beatTimes: number[] = []
  private _bpm: number = 0
  private container: HTMLElement
  private _snapToBeat: boolean = false
  private isInitialized: boolean = false

  static create(options?: BeatDetectionPluginOptions) {
    return new BeatDetectionPlugin(options || {})
  }

  constructor(options?: BeatDetectionPluginOptions) {
    super(options || {})

    this.options = Object.assign({}, defaultOptions, options)
    this._snapToBeat = this.options.snapToBeat
    this.container = this.createContainer()
  }

  private createContainer(): HTMLElement {
    return createElement('div', {
      part: 'beat-detection-container',
      style: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: '5',
      },
    })
  }

  /** Called by wavesurfer, don't call manually */
  onInit() {
    if (!this.wavesurfer) {
      throw Error('WaveSurfer is not initialized')
    }

    this.isInitialized = true

    const wrapper = this.wavesurfer.getWrapper()
    wrapper.appendChild(this.container)

    this.subscriptions.push(
      this.wavesurfer.on('ready', () => {
        this.detectBeats()
      }),

      this.wavesurfer.on('redraw', () => {
        this.renderBeatGrid()
      }),

      this.wavesurfer.on('scroll', () => {
        this.updateBeatMarkerPositions()
      }),

      this.wavesurfer.on('zoom', () => {
        this.updateBeatMarkerPositions()
      }),

      this.wavesurfer.on('click', (relativeX) => {
        if (this._snapToBeat && this.beatTimes.length > 0) {
          const time = relativeX * this.wavesurfer!.getDuration()
          const snappedTime = this.getNearestBeat(time)
          if (snappedTime !== null) {
            this.wavesurfer!.setTime(snappedTime)
          }
        }
      }),
    )

    if (this.wavesurfer.getDecodedData()) {
      this.detectBeats()
    }
  }

  /** Get the current BPM */
  public get bpm(): number {
    return this._bpm
  }

  /** Get the detected beat times */
  public getBeatTimes(): number[] {
    return [...this.beatTimes]
  }

  /** Enable or disable snap-to-beat */
  public setSnapToBeat(enabled: boolean) {
    this._snapToBeat = enabled
    this.emit('snap-to-beat-change', enabled)
  }

  /** Get snap-to-beat state */
  public getSnapToBeat(): boolean {
    return this._snapToBeat
  }

  /** Get the nearest beat time to a given time */
  public getNearestBeat(time: number): number | null {
    if (this.beatTimes.length === 0) return null

    let minDiff = Infinity
    let nearestBeat = null

    for (const beatTime of this.beatTimes) {
      const diff = Math.abs(beatTime - time)
      if (diff < minDiff) {
        minDiff = diff
        nearestBeat = beatTime
      }
    }

    return nearestBeat
  }

  /** Snap a time to the nearest beat */
  public snapTime(time: number): number {
    const nearestBeat = this.getNearestBeat(time)
    return nearestBeat !== null ? nearestBeat : time
  }

  /** Manually set beat times and recalculate BPM */
  public setBeatTimes(times: number[]): void {
    this.beatTimes = times.sort((a, b) => a - b)
    this.calculateBpmFromBeats()
    this.renderBeatGrid()
    this.emit('beat-detection-complete', this.beatTimes, this._bpm)
  }

  /** Add a manual beat */
  public addBeat(time: number): void {
    this.beatTimes.push(time)
    this.beatTimes.sort((a, b) => a - b)
    this.calculateBpmFromBeats()
    this.renderBeatGrid()
  }

  /** Remove a beat */
  public removeBeat(time: number): void {
    const index = this.beatTimes.indexOf(time)
    if (index > -1) {
      this.beatTimes.splice(index, 1)
      this.calculateBpmFromBeats()
      this.renderBeatGrid()
    }
  }

  /** Re-run beat detection */
  public rerunDetection(): void {
    this.detectBeats()
  }

  private detectBeats(): void {
    if (!this.wavesurfer) return

    const decodedData = this.wavesurfer.getDecodedData()
    if (!decodedData) return

    const channelData = decodedData.getChannelData(0)
    const sampleRate = decodedData.sampleRate

    const fftSize = this.options.fftSize
    const hopSize = Math.floor(fftSize * this.options.hopSize)
    const frames: Float32Array[] = []

    for (let i = 0; i + fftSize <= channelData.length; i += hopSize) {
      frames.push(channelData.slice(i, i + fftSize))
    }

    const spectralFlux = this.calculateSpectralFlux(frames, fftSize, sampleRate)
    const peaks = this.detectPeaks(spectralFlux)

    const frameDuration = hopSize / sampleRate
    this.beatTimes = peaks.map((peakIndex) => peakIndex * frameDuration)

    this.calculateBpmFromBeats()
    this.renderBeatGrid()
    this.emit('beat-detection-complete', this.beatTimes, this._bpm)
  }

  private calculateSpectralFlux(frames: Float32Array[], fftSize: number, sampleRate: number): number[] {
    const flux: number[] = []
    const fft = new FFT(fftSize, sampleRate, this.options.windowFunc, undefined)
    let prevSpectrum: Float32Array | null = null

    for (const frame of frames) {
      const spectrum = fft.calculateSpectrum(frame)

      if (prevSpectrum) {
        let sum = 0
        for (let i = 0; i < spectrum.length; i++) {
          const diff = spectrum[i] - prevSpectrum[i]
          sum += Math.max(0, diff)
        }
        flux.push(sum / spectrum.length)
      } else {
        flux.push(0)
      }

      prevSpectrum = new Float32Array(spectrum)
    }

    return flux
  }

  private detectPeaks(flux: number[]): number[] {
    if (flux.length === 0) return []

    const peaks: number[] = []
    const threshold = this.options.threshold

    const maxFlux = Math.max(...flux)
    const normalizedFlux = flux.map((val) => (maxFlux > 0 ? val / maxFlux : 0))

    const windowSize = 15
    const localThresholds: number[] = []

    for (let i = 0; i < normalizedFlux.length; i++) {
      const start = Math.max(0, i - windowSize)
      const end = Math.min(normalizedFlux.length, i + windowSize + 1)
      const window = normalizedFlux.slice(start, end)
      const localMean = window.reduce((a, b) => a + b, 0) / window.length
      localThresholds.push(localMean * (1 + threshold))
    }

    for (let i = 1; i < normalizedFlux.length - 1; i++) {
      if (
        normalizedFlux[i] > normalizedFlux[i - 1] &&
        normalizedFlux[i] > normalizedFlux[i + 1] &&
        normalizedFlux[i] > localThresholds[i]
      ) {
        peaks.push(i)
      }
    }

    return peaks
  }

  private calculateBpmFromBeats(): void {
    if (this.beatTimes.length < 4) {
      this._bpm = 0
      return
    }

    const bpm = this.calculateBpmWithAutocorrelation(this.beatTimes)

    if (bpm > 0) {
      const oldBpm = this._bpm
      this._bpm = Math.round(bpm)
      if (this._bpm !== oldBpm) {
        this.emit('bpm-change', this._bpm)
      }
    } else {
      this._bpm = 0
    }
  }

  private calculateBpmWithAutocorrelation(beatTimes: number[]): number {
    if (beatTimes.length < 4) return 0

    const minInterval = 60 / this.options.maxBpm
    const maxInterval = 60 / this.options.minBpm

    const intervalHistogram: Map<number, number> = new Map()
    const binSize = 0.01

    for (let i = 0; i < beatTimes.length; i++) {
      for (let j = i + 1; j < beatTimes.length; j++) {
        let interval = beatTimes[j] - beatTimes[i]

        while (interval > 0 && interval < minInterval) {
          interval *= 2
        }

        while (interval > maxInterval) {
          interval /= 2
        }

        if (interval >= minInterval && interval <= maxInterval) {
          const bin = Math.round(interval / binSize) * binSize
          const currentCount = intervalHistogram.get(bin) || 0
          const distance = j - i
          const weight = distance <= 2 ? 1 : distance <= 4 ? 0.8 : 0.5
          intervalHistogram.set(bin, currentCount + weight)
        }
      }
    }

    if (intervalHistogram.size === 0) return 0

    let maxScore = 0
    let bestInterval = 0

    intervalHistogram.forEach((count, interval) => {
      let enhancedScore = count

      const halfInterval = interval / 2
      if (halfInterval >= minInterval) {
        const halfBin = Math.round(halfInterval / binSize) * binSize
        enhancedScore += (intervalHistogram.get(halfBin) || 0) * 0.3
      }

      const doubleInterval = interval * 2
      if (doubleInterval <= maxInterval) {
        const doubleBin = Math.round(doubleInterval / binSize) * binSize
        enhancedScore += (intervalHistogram.get(doubleBin) || 0) * 0.3
      }

      if (enhancedScore > maxScore) {
        maxScore = enhancedScore
        bestInterval = interval
      }
    })

    if (bestInterval === 0) return 0

    let bestBpm = 60 / bestInterval

    if (bestBpm < 90 && bestBpm * 2 <= this.options.maxBpm) {
      const doubleBpm = bestBpm * 2
      const doubleInterval = 60 / doubleBpm
      let doubleScore = 0
      let normalScore = 0

      for (let i = 0; i < beatTimes.length - 1; i++) {
        const interval = beatTimes[i + 1] - beatTimes[i]
        const ratioToDouble = interval / doubleInterval
        const ratioToNormal = interval / bestInterval

        if (Math.abs(ratioToDouble - Math.round(ratioToDouble)) < 0.15) {
          doubleScore++
        }
        if (Math.abs(ratioToNormal - Math.round(ratioToNormal)) < 0.15) {
          normalScore++
        }
      }

      if (doubleScore > normalScore * 0.7) {
        bestBpm = doubleBpm
      }
    } else if (bestBpm > 180 && bestBpm / 2 >= this.options.minBpm) {
      bestBpm = bestBpm / 2
    }

    bestBpm = Math.round(bestBpm)
    if (bestBpm >= this.options.minBpm && bestBpm <= this.options.maxBpm) {
      return bestBpm
    }

    return 0
  }

  private handleBeatDragEnd(beatIndex: number, oldTime: number, newTime: number) {
    const index = this.beatTimes.indexOf(oldTime)
    if (index !== -1) {
      this.beatTimes[index] = newTime
      this.beatTimes.sort((a, b) => a - b)
      this.calculateBpmFromBeats()
      this.emit('beat-drag-end', beatIndex, oldTime, newTime)
      this.updateBeatMarkerIndices()
    }
  }

  private updateBeatMarkerIndices() {
    const timeSignature = this.options.timeSignature
    this.beatTimes.forEach((time, index) => {
      const marker = this.beatMarkers.find((m) => Math.abs(m.time - time) < 0.001)
      if (marker) {
        marker.updateBeatIndex(index)
        marker.updateIsDownbeat(index % timeSignature === 0)
      }
    })
  }

  private renderBeatGrid(): void {
    this.clearBeatMarkers()

    if (!this.wavesurfer || this.beatTimes.length === 0) return

    const duration = this.wavesurfer.getDuration()
    const timeSignature = this.options.timeSignature

    this.beatMarkers = this.beatTimes.map((time, index) => {
      const isDownbeat = index % timeSignature === 0
      const marker = new BeatMarker(
        time,
        index,
        isDownbeat,
        duration,
        this.container,
        {
          beatColor: this.options.beatColor,
          downbeatColor: this.options.downbeatColor,
          beatWidth: this.options.beatWidth,
          downbeatWidth: this.options.downbeatWidth,
          draggable: true,
        },
        this.handleBeatDragEnd.bind(this),
      )
      this.container.appendChild(marker.element)
      marker.renderPosition()

      marker.element.addEventListener('click', (e) => {
        e.stopPropagation()
        this.emit('beat-click', index, time)
      })

      return marker
    })
  }

  private updateBeatMarkerPositions(): void {
    if (!this.wavesurfer) return

    const duration = this.wavesurfer.getDuration()
    this.beatMarkers.forEach((marker) => {
      marker.setTotalDuration(duration)
    })
  }

  private clearBeatMarkers(): void {
    this.beatMarkers.forEach((marker) => marker.destroy())
    this.beatMarkers = []
  }

  /** Unmount */
  public destroy() {
    this.clearBeatMarkers()
    this.container.remove()
    this.isInitialized = false
    super.destroy()
  }
}

export default BeatDetectionPlugin
