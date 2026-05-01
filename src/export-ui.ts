import createElement from './dom.js'
import type { ExportOptions, FadeCurve, RegionInfo } from './audio-exporter.js'
import { defaultExportOptions, formatTime } from './audio-exporter.js'

export type ExportDialogResult = {
  options: ExportOptions
  cancelled: boolean
}

class ContextMenu {
  private element: HTMLElement | null = null
  private documentClickListener: ((e: Event) => void) | null = null

  show(x: number, y: number, items: { label: string; onClick: () => void; disabled?: boolean; divider?: boolean }[]) {
    this.hide()

    const menu = createElement('div', {
      style: {
        position: 'fixed',
        zIndex: '10000',
        background: 'rgba(30, 30, 35, 0.95)',
        borderRadius: '6px',
        padding: '4px 0',
        minWidth: '160px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: '13px',
        backdropFilter: 'blur(8px)',
      },
    })

    items.forEach((item) => {
      if (item.divider) {
        createElement(
          'div',
          {
            style: {
              height: '1px',
              background: 'rgba(255, 255, 255, 0.1)',
              margin: '4px 8px',
            },
          },
          menu,
        )
        return
      }

      const menuItem = createElement(
        'div',
        {
          textContent: item.label,
          style: {
            padding: '8px 16px',
            color: item.disabled ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.9)',
            cursor: item.disabled ? 'default' : 'pointer',
            userSelect: 'none',
          },
        },
        menu,
      )

      if (!item.disabled) {
        menuItem.addEventListener('mouseenter', () => {
          menuItem.style.background = 'rgba(255, 255, 255, 0.1)'
        })
        menuItem.addEventListener('mouseleave', () => {
          menuItem.style.background = 'transparent'
        })
        menuItem.addEventListener('click', () => {
          item.onClick()
          this.hide()
        })
      }
    })

    document.body.appendChild(menu)
    this.element = menu

    const rect = menu.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    let finalX = x
    let finalY = y

    if (x + rect.width > viewportWidth) {
      finalX = viewportWidth - rect.width - 8
    }
    if (y + rect.height > viewportHeight) {
      finalY = viewportHeight - rect.height - 8
    }

    menu.style.left = `${Math.max(8, finalX)}px`
    menu.style.top = `${Math.max(8, finalY)}px`

    this.documentClickListener = (e: Event) => {
      const mouseEvent = e as MouseEvent
      const target = mouseEvent.target as Node
      if (!menu.contains(target)) {
        this.hide()
      }
    }

    document.addEventListener('mousedown', this.documentClickListener, { once: true })
  }

  hide() {
    if (this.element) {
      this.element.remove()
      this.element = null
    }
    if (this.documentClickListener) {
      document.removeEventListener('mousedown', this.documentClickListener)
      this.documentClickListener = null
    }
  }

  destroy() {
    this.hide()
  }
}

class ExportDialog {
  private container: HTMLElement | null = null
  private overlay: HTMLElement | null = null
  private resolve: ((result: ExportDialogResult) => void) | null = null

  private fadeInChecked: boolean = defaultExportOptions.fadeIn
  private fadeOutChecked: boolean = defaultExportOptions.fadeOut
  private fadeCurve: FadeCurve = defaultExportOptions.fadeCurve
  private fadeDuration: number = defaultExportOptions.fadeDuration
  private zeroCrossing: boolean = defaultExportOptions.zeroCrossingAlignment

  show(regionInfo?: RegionInfo, multipleRegions: boolean = false): Promise<ExportDialogResult> {
    return new Promise((resolve) => {
      this.resolve = resolve
      this.createDialog(regionInfo, multipleRegions)
    })
  }

  private createDialog(regionInfo?: RegionInfo, multipleRegions: boolean = false) {
    this.overlay = createElement('div', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: '9999',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
    })

    this.container = createElement(
      'div',
      {
        style: {
          background: 'rgba(30, 30, 35, 0.98)',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '400px',
          maxWidth: '500px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(16px)',
        },
      },
      this.overlay,
    )

    createElement(
      'h2',
      {
        textContent: multipleRegions ? 'Export Multiple Regions' : 'Export Region',
        style: {
          margin: '0 0 20px 0',
          color: 'rgba(255, 255, 255, 0.95)',
          fontSize: '18px',
          fontWeight: '600',
        },
      },
      this.container,
    )

    if (regionInfo && !multipleRegions) {
      const infoSection = createElement(
        'div',
        {
          style: {
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px',
            padding: '12px 16px',
            marginBottom: '20px',
          },
        },
        this.container,
      )

      createElement(
        'div',
        {
          textContent: regionInfo.label || 'Untitled Region',
          style: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '500',
            marginBottom: '4px',
          },
        },
        infoSection,
      )

      createElement(
        'div',
        {
          textContent: `${formatTime(regionInfo.start)} - ${formatTime(regionInfo.end)} (${formatTime(regionInfo.end - regionInfo.start)})`,
          style: {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '12px',
          },
        },
        infoSection,
      )
    }

    if (multipleRegions) {
      createElement(
        'div',
        {
          textContent: 'All regions will be exported and packaged into a ZIP file.',
          style: {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '13px',
            marginBottom: '20px',
            fontStyle: 'italic',
          },
        },
        this.container,
      )
    }

    const zeroCrossingSection = this.createCheckboxSection(
      'Zero-crossing alignment',
      'Align boundaries to nearest zero-crossing point to eliminate clicks',
      this.zeroCrossing,
      (checked) => {
        this.zeroCrossing = checked
      },
    )
    this.container.appendChild(zeroCrossingSection)

    const divider1 = createElement('div', {
      style: {
        height: '1px',
        background: 'rgba(255, 255, 255, 0.1)',
        margin: '16px 0',
      },
    })
    this.container.appendChild(divider1)

    const fadeSection = createElement('div', {
      style: {
        marginBottom: '8px',
      },
    })

    createElement(
      'div',
      {
        textContent: 'Fade Options',
        style: {
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '12px',
        },
      },
      fadeSection,
    )

    const fadeInSection = this.createCheckboxSection(
      'Fade in',
      'Apply fade-in at the beginning',
      this.fadeInChecked,
      (checked) => {
        this.fadeInChecked = checked
      },
    )
    fadeSection.appendChild(fadeInSection)

    const fadeOutSection = this.createCheckboxSection(
      'Fade out',
      'Apply fade-out at the end',
      this.fadeOutChecked,
      (checked) => {
        this.fadeOutChecked = checked
      },
    )
    fadeSection.appendChild(fadeOutSection)

    this.container.appendChild(fadeSection)

    const curveSection = createElement('div', {
      style: {
        marginTop: '16px',
      },
    })

    createElement(
      'label',
      {
        textContent: 'Fade curve:',
        style: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
          marginRight: '12px',
        },
      },
      curveSection,
    )

    const linearRadio = this.createRadioOption('linear', 'Linear', this.fadeCurve === 'linear', () => {
      this.fadeCurve = 'linear'
    })
    curveSection.appendChild(linearRadio)

    const equalPowerRadio = this.createRadioOption(
      'equal-power',
      'Equal Power',
      this.fadeCurve === 'equal-power',
      () => {
        this.fadeCurve = 'equal-power'
      },
    )
    curveSection.appendChild(equalPowerRadio)

    this.container.appendChild(curveSection)

    const durationSection = createElement('div', {
      style: {
        marginTop: '16px',
        display: 'flex',
        alignItems: 'center',
      },
    })

    createElement(
      'label',
      {
        textContent: 'Fade duration:',
        style: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
          marginRight: '12px',
        },
      },
      durationSection,
    )

    const durationInput = createElement('input', {
      type: 'number',
      value: this.fadeDuration.toString(),
      min: '0.001',
      max: '10',
      step: '0.001',
      style: {
        width: '80px',
        padding: '6px 8px',
        borderRadius: '4px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        background: 'rgba(255, 255, 255, 0.05)',
        color: 'rgba(255, 255, 255, 0.9)',
        fontSize: '13px',
      },
    }) as HTMLInputElement

    durationInput.addEventListener('change', () => {
      const value = parseFloat(durationInput.value)
      if (!isNaN(value) && value > 0) {
        this.fadeDuration = Math.min(10, Math.max(0.001, value))
        durationInput.value = this.fadeDuration.toString()
      }
    })

    durationSection.appendChild(durationInput)

    createElement(
      'span',
      {
        textContent: 'seconds',
        style: {
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '12px',
          marginLeft: '6px',
        },
      },
      durationSection,
    )

    this.container.appendChild(durationSection)

    const divider2 = createElement('div', {
      style: {
        height: '1px',
        background: 'rgba(255, 255, 255, 0.1)',
        margin: '20px 0',
      },
    })
    this.container.appendChild(divider2)

    const buttonRow = createElement('div', {
      style: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '12px',
      },
    })

    const cancelButton = createElement(
      'button',
      {
        textContent: 'Cancel',
        type: 'button',
        style: {
          padding: '10px 20px',
          borderRadius: '6px',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          background: 'transparent',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'all 0.2s',
        },
      },
      buttonRow,
    )

    const exportButton = createElement(
      'button',
      {
        textContent: multipleRegions ? 'Export All' : 'Export',
        type: 'button',
        style: {
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
        },
      },
      buttonRow,
    )

    cancelButton.addEventListener('mouseenter', () => {
      cancelButton.style.background = 'rgba(255, 255, 255, 0.1)'
    })
    cancelButton.addEventListener('mouseleave', () => {
      cancelButton.style.background = 'transparent'
    })
    cancelButton.addEventListener('click', () => {
      this.close({ options: {}, cancelled: true })
    })

    exportButton.addEventListener('mouseenter', () => {
      exportButton.style.transform = 'scale(1.02)'
    })
    exportButton.addEventListener('mouseleave', () => {
      exportButton.style.transform = 'scale(1)'
    })
    exportButton.addEventListener('click', () => {
      this.close({
        options: {
          fadeIn: this.fadeInChecked,
          fadeOut: this.fadeOutChecked,
          fadeDuration: this.fadeDuration,
          fadeCurve: this.fadeCurve,
          zeroCrossingAlignment: this.zeroCrossing,
        },
        cancelled: false,
      })
    })

    this.container.appendChild(buttonRow)

    document.body.appendChild(this.overlay)

    this.overlay.addEventListener('click', (e: Event) => {
      if (e.target === this.overlay) {
        this.close({ options: {}, cancelled: true })
      }
    })

    const escHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', escHandler)
        this.close({ options: {}, cancelled: true })
      }
    }
    document.addEventListener('keydown', escHandler)
  }

  private createCheckboxSection(
    label: string,
    description: string,
    initialValue: boolean,
    onChange: (checked: boolean) => void,
  ): HTMLElement {
    const section = createElement('div', {
      style: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: '10px',
        marginBottom: '8px',
      },
    })

    const checkbox = createElement('input', {
      type: 'checkbox',
      style: {
        width: '16px',
        height: '16px',
        marginTop: '2px',
        cursor: 'pointer',
        accentColor: '#667eea',
      },
    }) as unknown as HTMLInputElement

    if (initialValue) {
      checkbox.checked = true
    }

    checkbox.addEventListener('change', () => {
      onChange(checkbox.checked)
    })

    section.appendChild(checkbox)

    const textContainer = createElement('div', {
      style: {
        display: 'flex',
        flexDirection: 'column',
      },
    })

    createElement(
      'label',
      {
        textContent: label,
        style: {
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '13px',
          cursor: 'pointer',
        },
      },
      textContainer,
    )

    createElement(
      'span',
      {
        textContent: description,
        style: {
          color: 'rgba(255, 255, 255, 0.5)',
          fontSize: '11px',
          marginTop: '2px',
        },
      },
      textContainer,
    )

    section.appendChild(textContainer)

    return section
  }

  private createRadioOption(value: string, label: string, checked: boolean, onChange: () => void): HTMLElement {
    const container = createElement('label', {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginRight: '16px',
        cursor: 'pointer',
      },
    })

    const radio = createElement('input', {
      type: 'radio',
      name: 'fadeCurve',
      value: value,
      style: {
        accentColor: '#667eea',
      },
    }) as unknown as HTMLInputElement

    if (checked) {
      radio.checked = true
    }

    radio.addEventListener('change', onChange)

    container.appendChild(radio)
    createElement(
      'span',
      {
        textContent: label,
        style: {
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '13px',
        },
      },
      container,
    )

    return container
  }

  private close(result: ExportDialogResult) {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }
    this.container = null
    if (this.resolve) {
      this.resolve(result)
      this.resolve = null
    }
  }

  destroy() {
    this.close({ options: {}, cancelled: true })
  }
}

class ProgressDialog {
  private container: HTMLElement | null = null
  private overlay: HTMLElement | null = null
  private progressBar: HTMLElement | null = null
  private progressText: HTMLElement | null = null
  private statusText: HTMLElement | null = null

  show(title: string = 'Exporting...') {
    this.overlay = createElement('div', {
      style: {
        position: 'fixed',
        top: '0',
        left: '0',
        right: '0',
        bottom: '0',
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      },
    })

    this.container = createElement(
      'div',
      {
        style: {
          background: 'rgba(30, 30, 35, 0.98)',
          borderRadius: '12px',
          padding: '24px',
          minWidth: '320px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(16px)',
        },
      },
      this.overlay,
    )

    createElement(
      'h3',
      {
        textContent: title,
        style: {
          margin: '0 0 20px 0',
          color: 'rgba(255, 255, 255, 0.95)',
          fontSize: '16px',
          fontWeight: '600',
        },
      },
      this.container,
    )

    const progressContainer = createElement('div', {
      style: {
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '4px',
        height: '8px',
        overflow: 'hidden',
        marginBottom: '12px',
      },
    })

    this.progressBar = createElement('div', {
      style: {
        width: '0%',
        height: '100%',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '4px',
        transition: 'width 0.3s ease',
      },
    })

    progressContainer.appendChild(this.progressBar)
    this.container.appendChild(progressContainer)

    this.progressText = createElement('div', {
      textContent: '0%',
      style: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: '13px',
        textAlign: 'right',
        marginBottom: '8px',
      },
    })
    this.container.appendChild(this.progressText)

    this.statusText = createElement('div', {
      textContent: 'Preparing...',
      style: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: '12px',
      },
    })
    this.container.appendChild(this.statusText)

    document.body.appendChild(this.overlay)
  }

  update(progress: number, total: number, status?: string) {
    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0
    if (this.progressBar) {
      this.progressBar.style.width = `${percentage}%`
    }
    if (this.progressText) {
      this.progressText.textContent = `${percentage}% (${progress}/${total})`
    }
    if (this.statusText && status) {
      this.statusText.textContent = status
    }
  }

  hide() {
    if (this.overlay) {
      this.overlay.remove()
      this.overlay = null
    }
    this.container = null
    this.progressBar = null
    this.progressText = null
    this.statusText = null
  }
}

const contextMenu = new ContextMenu()
const exportDialog = new ExportDialog()
const progressDialog = new ProgressDialog()

export { contextMenu, exportDialog, progressDialog, ContextMenu, ExportDialog, ProgressDialog }
