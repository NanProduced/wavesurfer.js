import createElement from './dom.js'
import EventEmitter from './event-emitter.js'
import AudioExport, {
  type ExportOptions,
  type FadeCurve,
  defaultExportOptions,
  sliceAudioBuffer,
  audioBufferToWavBlob,
  downloadBlob,
  createSimpleZip,
} from './audio-export.js'
import type WaveSurfer from './wavesurfer.js'
import type { Region } from './plugins/regions.js'

export type ExportPanelEvents = {
  show: []
  hide: []
  'export-start': [regions: Region[]]
  'export-progress': [progress: number, total: number]
  'export-complete': []
  'export-error': [error: Error]
}

class ExportPanel extends EventEmitter<ExportPanelEvents> {
  private container: HTMLElement | null = null
  private contextMenu: HTMLElement | null = null
  private optionsPanel: HTMLElement | null = null
  private progressPanel: HTMLElement | null = null
  private wavesurfer: WaveSurfer | null = null
  private selectedRegions: Region[] = []
  private currentOptions: ExportOptions = { ...defaultExportOptions }
  private isExporting = false

  constructor() {
    super()
    this.initGlobalListeners()
  }

  private initGlobalListeners() {
    document.addEventListener('click', () => {
      this.hideContextMenu()
    })
    document.addEventListener('contextmenu', () => {
      this.hideContextMenu()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideAll()
      }
    })
  }

  private getContainer(): HTMLElement {
    if (!this.container) {
      this.container = createElement('div', {
        style: {
          position: 'fixed',
          zIndex: '999999',
          pointerEvents: 'none',
        },
      })
      document.body.appendChild(this.container)
    }
    return this.container
  }

  public showContextMenu(wavesurfer: WaveSurfer, region: Region, x: number, y: number): void {
    this.wavesurfer = wavesurfer
    this.selectedRegions = [region]
    this.hideContextMenu()

    const allRegions = this.getAllRegions(wavesurfer)

    this.contextMenu = createElement('div', {
      style: {
        position: 'fixed',
        left: `${x}px`,
        top: `${y}px`,
        backgroundColor: '#fff',
        borderRadius: '6px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        padding: '4px 0',
        minWidth: '180px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        pointerEvents: 'auto',
      },
    })

    const exportSingle = createElement(
      'div',
      {
        style: {
          padding: '8px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'background-color 0.15s',
        },
        textContent: '导出选中区域',
        part: 'export-menu-item',
      },
      this.contextMenu,
    )

    exportSingle.addEventListener('mouseenter', () => {
      exportSingle.style.backgroundColor = '#f0f0f0'
    })
    exportSingle.addEventListener('mouseleave', () => {
      exportSingle.style.backgroundColor = 'transparent'
    })
    exportSingle.addEventListener('click', (e) => {
      e.stopPropagation()
      this.hideContextMenu()
      this.showOptionsPanel([region])
    })

    if (allRegions.length > 1) {
      createElement(
        'div',
        {
          style: {
            height: '1px',
            backgroundColor: '#e0e0e0',
            margin: '4px 0',
          },
        },
        this.contextMenu,
      )

      const exportAll = createElement(
        'div',
        {
          style: {
            padding: '8px 16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.15s',
          },
          textContent: `批量导出所有区域 (${allRegions.length})`,
          part: 'export-menu-item',
        },
        this.contextMenu,
      )

      exportAll.addEventListener('mouseenter', () => {
        exportAll.style.backgroundColor = '#f0f0f0'
      })
      exportAll.addEventListener('mouseleave', () => {
        exportAll.style.backgroundColor = 'transparent'
      })
      exportAll.addEventListener('click', (e) => {
        e.stopPropagation()
        this.hideContextMenu()
        this.showOptionsPanel(allRegions)
      })
    }

    this.getContainer().appendChild(this.contextMenu)
    this.emit('show')
  }

  private getAllRegions(wavesurfer: WaveSurfer): Region[] {
    const plugins = wavesurfer.getActivePlugins()
    const regionsPlugin = plugins.find(
      (p: unknown) => p && typeof (p as { getRegions?: () => Region[] }).getRegions === 'function',
    ) as { getRegions: () => Region[] } | undefined
    return regionsPlugin?.getRegions() || []
  }

  public hideContextMenu(): void {
    if (this.contextMenu) {
      this.contextMenu.remove()
      this.contextMenu = null
    }
  }

  private createCheckbox(label: string, checked: boolean, onChange: (checked: boolean) => void): HTMLElement {
    const wrapper = createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
      },
    })

    const checkbox = createElement('input', {
      type: 'checkbox',
      style: {
        width: '16px',
        height: '16px',
        cursor: 'pointer',
      },
    }) as HTMLInputElement
    checkbox.checked = checked

    const labelEl = createElement('label', {
      textContent: label,
      style: {
        cursor: 'pointer',
        fontSize: '13px',
        color: '#333',
      },
    })

    wrapper.appendChild(checkbox)
    wrapper.appendChild(labelEl)

    checkbox.addEventListener('change', () => onChange(checkbox.checked))
    labelEl.addEventListener('click', () => {
      checkbox.checked = !checkbox.checked
      onChange(checkbox.checked)
    })

    return wrapper
  }

  private createSelect(
    label: string,
    options: Array<{ value: string; label: string }>,
    value: string,
    onChange: (value: string) => void,
  ): HTMLElement {
    const wrapper = createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
    })

    const labelEl = createElement('label', {
      textContent: label,
      style: {
        fontSize: '13px',
        color: '#333',
        minWidth: '80px',
      },
    })

    const select = createElement('select', {
      style: {
        padding: '6px 10px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '13px',
        cursor: 'pointer',
        backgroundColor: '#fff',
      },
    }) as HTMLSelectElement

    options.forEach((opt) => {
      const option = createElement('option', {
        value: opt.value,
        textContent: opt.label,
      }) as HTMLOptionElement
      if (opt.value === value) {
        option.selected = true
      }
      select.appendChild(option)
    })

    select.addEventListener('change', () => onChange(select.value))

    wrapper.appendChild(labelEl)
    wrapper.appendChild(select)

    return wrapper
  }

  private createNumberInput(
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
    unit: string,
    onChange: (value: number) => void,
  ): HTMLElement {
    const wrapper = createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      },
    })

    const labelEl = createElement('label', {
      textContent: label,
      style: {
        fontSize: '13px',
        color: '#333',
        minWidth: '80px',
      },
    })

    const inputWrapper = createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      },
    })

    const input = createElement('input', {
      type: 'number',
      value: value.toString(),
      min: min.toString(),
      max: max.toString(),
      step: step.toString(),
      style: {
        padding: '6px 8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        fontSize: '13px',
        width: '60px',
        textAlign: 'center',
      },
    }) as HTMLInputElement

    const unitEl = createElement('span', {
      textContent: unit,
      style: {
        fontSize: '12px',
        color: '#666',
      },
    })

    inputWrapper.appendChild(input)
    inputWrapper.appendChild(unitEl)

    input.addEventListener('change', () => {
      const numValue = parseFloat(input.value)
      if (!isNaN(numValue)) {
        onChange(Math.max(min, Math.min(max, numValue)))
      }
    })

    wrapper.appendChild(labelEl)
    wrapper.appendChild(inputWrapper)

    return wrapper
  }

  public showOptionsPanel(regions: Region[]): void {
    if (this.isExporting) return
    this.selectedRegions = regions
    this.hideAll()

    const isMultiple = regions.length > 1
    const title = isMultiple
      ? `批量导出 ${regions.length} 个区域`
      : `导出区域: ${regions[0].start.toFixed(2)}s - ${regions[0].end.toFixed(2)}s`

    this.optionsPanel = createElement('div', {
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        padding: '20px',
        minWidth: '320px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        pointerEvents: 'auto',
        zIndex: '1000000',
      },
    })

    const header = createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        },
      },
      this.optionsPanel,
    )

    createElement(
      'h3',
      {
        textContent: title,
        style: {
          margin: '0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
        },
      },
      header,
    )

    const closeBtn = createElement(
      'button',
      {
        textContent: '✕',
        style: {
          background: 'none',
          border: 'none',
          fontSize: '18px',
          cursor: 'pointer',
          color: '#999',
          padding: '4px 8px',
          lineHeight: '1',
        },
      },
      header,
    )
    closeBtn.addEventListener('click', () => this.hideAll())

    const content = createElement(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        },
      },
      this.optionsPanel,
    )

    const section1 = createElement(
      'div',
      {
        style: {
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          padding: '12px',
        },
      },
      content,
    )

    createElement(
      'div',
      {
        textContent: '边界处理',
        style: {
          fontWeight: '600',
          fontSize: '14px',
          marginBottom: '10px',
          color: '#444',
        },
      },
      section1,
    )

    const zeroCrossingCheckbox = this.createCheckbox(
      '零交叉对齐 (消除点击声)',
      this.currentOptions.zeroCrossing,
      (checked) => {
        this.currentOptions.zeroCrossing = checked
      },
    )
    section1.appendChild(zeroCrossingCheckbox)

    const section2 = createElement(
      'div',
      {
        style: {
          backgroundColor: '#f9f9f9',
          borderRadius: '6px',
          padding: '12px',
          marginTop: '8px',
        },
      },
      content,
    )

    createElement(
      'div',
      {
        textContent: '淡入淡出',
        style: {
          fontWeight: '600',
          fontSize: '14px',
          marginBottom: '10px',
          color: '#444',
        },
      },
      section2,
    )

    const fadeOptions = createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      },
    })

    const fadeInCheckbox = this.createCheckbox('淡入 (Fade In)', this.currentOptions.fadeIn, (checked) => {
      this.currentOptions.fadeIn = checked
    })
    fadeOptions.appendChild(fadeInCheckbox)

    const fadeOutCheckbox = this.createCheckbox('淡出 (Fade Out)', this.currentOptions.fadeOut, (checked) => {
      this.currentOptions.fadeOut = checked
    })
    fadeOptions.appendChild(fadeOutCheckbox)

    const curveSelect = this.createSelect(
      '曲线类型:',
      [
        { value: 'linear', label: '线性 (Linear)' },
        { value: 'equal-power', label: '等功率 (Equal Power)' },
      ],
      this.currentOptions.fadeCurve,
      (value) => {
        this.currentOptions.fadeCurve = value as FadeCurve
      },
    )
    fadeOptions.appendChild(curveSelect)

    const durationInput = this.createNumberInput(
      '淡变时长:',
      this.currentOptions.fadeDuration,
      0.001,
      0.5,
      0.001,
      '秒',
      (value) => {
        this.currentOptions.fadeDuration = value
      },
    )
    fadeOptions.appendChild(durationInput)

    section2.appendChild(fadeOptions)

    const footer = createElement(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
          marginTop: '20px',
        },
      },
      this.optionsPanel,
    )

    const cancelBtn = createElement(
      'button',
      {
        textContent: '取消',
        style: {
          padding: '8px 20px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          backgroundColor: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        },
      },
      footer,
    )
    cancelBtn.addEventListener('click', () => this.hideAll())

    const exportBtn = createElement(
      'button',
      {
        textContent: isMultiple ? '导出为 ZIP' : '导出 WAV',
        style: {
          padding: '8px 20px',
          borderRadius: '4px',
          border: 'none',
          backgroundColor: '#007acc',
          color: '#fff',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'background-color 0.15s',
        },
      },
      footer,
    )
    exportBtn.addEventListener('click', () => {
      this.startExport()
    })

    const overlay = createElement('div', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: '999999',
        pointerEvents: 'auto',
      },
    })
    overlay.addEventListener('click', () => this.hideAll())

    this.getContainer().appendChild(overlay)
    this.getContainer().appendChild(this.optionsPanel)

    this.emit('show')
  }

  private async startExport(): Promise<void> {
    if (!this.wavesurfer || this.selectedRegions.length === 0) return

    const audioBuffer = this.wavesurfer.getDecodedData()
    if (!audioBuffer) {
      this.emit('export-error', new Error('No audio data available'))
      return
    }

    this.isExporting = true
    this.hideAll()
    this.showProgressPanel()

    try {
      this.emit('export-start', this.selectedRegions)

      if (this.selectedRegions.length === 1) {
        await this.exportSingleRegion(audioBuffer, this.selectedRegions[0])
      } else {
        await this.exportMultipleRegions(audioBuffer, this.selectedRegions)
      }

      this.emit('export-complete')
    } catch (error) {
      this.emit('export-error', error instanceof Error ? error : new Error(String(error)))
    } finally {
      this.isExporting = false
      setTimeout(() => this.hideAll(), 1000)
    }
  }

  private async exportSingleRegion(audioBuffer: AudioBuffer, region: Region): Promise<void> {
    this.updateProgress(0, 1)

    const slicedBuffer = sliceAudioBuffer(audioBuffer, region.start, region.end, this.currentOptions)

    this.updateProgress(0.5, 1)

    const wavBlob = audioBufferToWavBlob(slicedBuffer)
    const filename = `region_${region.start.toFixed(2)}_${region.end.toFixed(2)}.wav`

    this.updateProgress(1, 1)

    downloadBlob(wavBlob, filename)
  }

  private async exportMultipleRegions(audioBuffer: AudioBuffer, regions: Region[]): Promise<void> {
    const files: Array<{ filename: string; content: ArrayBuffer }> = []

    for (let i = 0; i < regions.length; i++) {
      this.updateProgress(i, regions.length)

      const region = regions[i]
      const slicedBuffer = sliceAudioBuffer(audioBuffer, region.start, region.end, this.currentOptions)
      const wavBuffer = AudioExport.audioBufferToWav(slicedBuffer)

      const index = String(i + 1).padStart(3, '0')
      const filename = `${index}_region_${region.start.toFixed(2)}_${region.end.toFixed(2)}.wav`

      files.push({ filename, content: wavBuffer })

      await this.sleep(10)
    }

    this.updateProgress(regions.length - 0.5, regions.length)

    const zipBuffer = createSimpleZip(files)
    const zipBlob = new Blob([zipBuffer], { type: 'application/zip' })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const zipFilename = `regions_export_${timestamp}.zip`

    this.updateProgress(regions.length, regions.length)

    downloadBlob(zipBlob, zipFilename)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  private showProgressPanel(): void {
    this.progressPanel = createElement('div', {
      style: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
        padding: '24px',
        minWidth: '300px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        pointerEvents: 'auto',
        zIndex: '1000000',
        textAlign: 'center',
      },
    })

    createElement(
      'div',
      {
        textContent: this.selectedRegions.length > 1 ? '批量导出中...' : '导出中...',
        style: {
          fontSize: '16px',
          fontWeight: '600',
          color: '#333',
          marginBottom: '16px',
        },
      },
      this.progressPanel,
    )

    const progressBarContainer = createElement(
      'div',
      {
        style: {
          height: '8px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: '12px',
        },
      },
      this.progressPanel,
    )

    const progressBar = createElement('div', {
      style: {
        height: '100%',
        width: '0%',
        backgroundColor: '#007acc',
        borderRadius: '4px',
        transition: 'width 0.2s ease',
      },
      part: 'export-progress-bar',
    })
    progressBarContainer.appendChild(progressBar)

    const progressText = createElement('div', {
      textContent: '0%',
      style: {
        fontSize: '14px',
        color: '#666',
      },
      part: 'export-progress-text',
    })
    this.progressPanel.appendChild(progressText)

    const overlay = createElement('div', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: '999999',
        pointerEvents: 'none',
      },
    })

    this.getContainer().appendChild(overlay)
    this.getContainer().appendChild(this.progressPanel)
  }

  private updateProgress(current: number, total: number): void {
    this.emit('export-progress', current, total)

    if (!this.progressPanel) return

    const progressBar = this.progressPanel.querySelector('[part="export-progress-bar"]') as HTMLElement
    const progressText = this.progressPanel.querySelector('[part="export-progress-text"]') as HTMLElement

    if (progressBar && progressText) {
      const percentage = total > 0 ? Math.round((current / total) * 100) : 0
      progressBar.style.width = `${percentage}%`
      progressText.textContent = `${percentage}% (${Math.ceil(current)}/${total})`
    }
  }

  public hideAll(): void {
    this.hideContextMenu()

    if (this.optionsPanel) {
      this.optionsPanel.remove()
      this.optionsPanel = null
    }

    if (this.progressPanel) {
      this.progressPanel.remove()
      this.progressPanel = null
    }

    if (this.container) {
      this.container.innerHTML = ''
    }

    this.emit('hide')
  }

  public destroy(): void {
    this.hideAll()
    if (this.container) {
      this.container.remove()
      this.container = null
    }
    this.unAll()
  }
}

const exportPanel = new ExportPanel()

export default ExportPanel
export { exportPanel }
