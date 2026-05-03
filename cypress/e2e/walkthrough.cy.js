describe('UI Walkthrough', () => {
  beforeEach(() => {
    cy.viewport(1280, 800)
  })

  it('loads the main page with sidebar', () => {
    cy.visit('/')
    cy.get('aside').should('be.visible')
    cy.get('aside a').should('have.length.gt', 10)
    cy.get('#theme-toggle').should('be.visible')
    cy.get('textarea').should('be.visible')
    cy.get('#preview').should('be.visible')
  })

  it('loads basic demo with shared components', () => {
    cy.visit('/#basic.js')
    cy.wait(3000)

    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      const win = $iframe[0].contentWindow

      // PlayerBar
      const playerBar = doc.querySelector('.ws-player-bar')
      expect(playerBar, 'PlayerBar should exist').to.not.be.null

      const playBtn = doc.querySelector('.ws-play-btn')
      expect(playBtn, 'Play button should exist').to.not.be.null

      const volumeSlider = doc.querySelector('.ws-volume-slider')
      expect(volumeSlider, 'Volume slider should exist').to.not.be.null

      const rateSelect = doc.querySelector('.ws-rate-select')
      expect(rateSelect, 'Rate select should exist').to.not.be.null

      const timeDisplay = doc.querySelector('.ws-time-display')
      expect(timeDisplay, 'Time display should exist').to.not.be.null

      // WaveformContainer
      const waveformCard = doc.querySelector('.ws-waveform-card')
      expect(waveformCard, 'WaveformCard should exist').to.not.be.null

      const meta = doc.querySelector('.ws-waveform-meta')
      expect(meta, 'Meta bar should exist').to.not.be.null

      // InfoPanel
      const infoToggle = doc.querySelector('.ws-info-toggle')
      expect(infoToggle, 'Info toggle should exist').to.not.be.null

      // WaveSurfer instance
      const ws = win.__ws_instances && win.__ws_instances[0]
      expect(ws, 'WaveSurfer instance should exist').to.not.be.undefined
      expect(ws.getDuration(), 'Duration should be > 0').to.be.gt(0)
    })
  })

  it('play button works', () => {
    cy.visit('/#basic.js')
    cy.wait(3000)

    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const doc = $iframe[0].contentDocument
      const ws = win.__ws_instances[0]

      expect(ws.isPlaying(), 'Should not be playing initially').to.be.false

      const playBtn = doc.querySelector('.ws-play-btn')
      playBtn.click()
    })

    cy.wait(500)

    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const doc = $iframe[0].contentDocument
      const ws = win.__ws_instances[0]

      expect(ws.isPlaying(), 'Should be playing after click').to.be.true

      const playBtn = doc.querySelector('.ws-play-btn')
      const svgContent = playBtn.innerHTML
      expect(svgContent, 'Should show pause icon').to.include('rect')
    })
  })

  it('volume slider works', () => {
    cy.visit('/#basic.js')
    cy.wait(3000)

    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const doc = $iframe[0].contentDocument
      const ws = win.__ws_instances[0]

      const slider = doc.querySelector('.ws-volume-slider')
      slider.value = '0.3'
      slider.dispatchEvent(new Event('input'))

      expect(ws.getVolume(), 'Volume should be ~0.3').to.be.closeTo(0.3, 0.05)
    })
  })

  it('info panel toggles', () => {
    cy.visit('/#basic.js')
    cy.wait(3000)

    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument

      const panel = doc.querySelector('.ws-info-panel')
      expect(panel.classList.contains('open'), 'Panel should be closed initially').to.be.false

      const toggle = doc.querySelector('.ws-info-toggle')
      toggle.click()
      expect(panel.classList.contains('open'), 'Panel should be open after click').to.be.true

      toggle.click()
      expect(panel.classList.contains('open'), 'Panel should be closed after second click').to.be.false
    })
  })

  it('regions demo has region list', () => {
    cy.visit('/#regions.js')
    cy.wait(3000)

    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      const win = $iframe[0].contentWindow

      const regionList = doc.querySelector('.ws-region-list')
      expect(regionList, 'RegionList should exist').to.not.be.null

      const regionRows = doc.querySelectorAll('.ws-region-row')
      expect(regionRows.length, 'Should have region rows').to.be.gt(0)

      const controlPanel = doc.querySelector('.ws-control-panel')
      expect(controlPanel, 'ControlPanel should exist').to.not.be.null

      const toggleSwitches = doc.querySelectorAll('.ws-toggle')
      expect(toggleSwitches.length, 'Should have toggle switches').to.be.gt(0)

      const ws = win.__ws_instances[0]
      expect(ws, 'WaveSurfer instance should exist').to.not.be.undefined

      const regions = win.__ws_regions
      expect(regions, 'Regions plugin should be exposed').to.not.be.undefined
      expect(regions.getRegions().length, 'Should have regions').to.be.gt(0)
    })
  })

  it('dark theme toggle works', () => {
    cy.visit('/#basic.js')
    cy.wait(3000)

    cy.get('#theme-toggle').click()
    cy.wait(500)

    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      const theme = doc.documentElement.getAttribute('data-theme')
      expect(theme, 'iframe should have dark theme').to.equal('dark')
    })

    cy.get('html').should('have.attr', 'data-theme', 'dark')
  })

  it('mobile viewport shows hamburger', () => {
    cy.viewport(375, 812)
    cy.visit('/')
    cy.get('.hamburger-btn').should('be.visible')
    cy.get('aside').should('not.be.visible')

    cy.get('.hamburger-btn').click()
    cy.get('aside').should('have.class', 'open')
    cy.get('#sidebar-overlay').should('have.class', 'open')

    cy.get('#sidebar-overlay').click({ force: true })
    cy.get('aside').should('not.have.class', 'open')
  })

  it('zoom demo has control panel with slider', () => {
    cy.visit('/#zoom.js')
    cy.wait(3000)

    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument

      const sliders = doc.querySelectorAll('.ws-range-slider')
      expect(sliders.length, 'Should have range sliders').to.be.gt(0)

      const controlValues = doc.querySelectorAll('.ws-control-value')
      expect(controlValues.length, 'Should have value labels').to.be.gt(0)
    })
  })

  it('sidebar navigation works', () => {
    cy.visit('/')
    cy.get('aside a').first().click()
    cy.url().should('include', '#basic.js')
    cy.get('aside a.active').should('exist')
  })

  it('sidebar has collapsible sections', () => {
    cy.visit('/')
    cy.get('aside details').should('have.length.gt', 1)
    cy.get('aside details[open]').should('have.length.gt', 0)

    // Collapse a section
    cy.get('aside details summary').first().click()
    cy.get('aside details').first().should('not.have.attr', 'open')

    // Re-expand
    cy.get('aside details summary').first().click()
    cy.get('aside details').first().should('have.attr', 'open')
  })

  it('sidebar footer has GitHub and npm links', () => {
    cy.visit('/')
    cy.get('.sidebar-footer a').should('have.length', 2)
    cy.get('.sidebar-footer a').first().should('have.attr', 'href').and('include', 'github.com')
    cy.get('.sidebar-footer a').last().should('have.attr', 'href').and('include', 'npmjs.com')
  })
})
