describe('Examples UI visual regression', () => {
  const viewports = [
    { name: 'desktop', width: 1280, height: 800 },
    { name: 'tablet', width: 800, height: 600 },
    { name: 'mobile', width: 375, height: 812 },
  ]

  const themes = ['light', 'dark']

  viewports.forEach(({ name, width, height }) => {
    themes.forEach((theme) => {
      it(`Basic demo - ${theme} theme at ${width}px`, () => {
        cy.viewport(width, height)
        cy.visit('/index.html#basic.js')
        if (theme === 'dark') {
          cy.get('#theme-toggle').click()
        }
        cy.get('#preview').its('0.contentDocument').should('exist')
        cy.wait(3000)
        cy.get('#preview').matchImageSnapshot(`basic-${theme}-${name}`)
      })
    })
  })

  it('Regions demo - region list visible', () => {
    cy.viewport(1280, 800)
    cy.visit('/index.html#regions.js')
    cy.get('#preview').its('0.contentDocument').should('exist')
    cy.wait(3000)
    cy.get('#preview').matchImageSnapshot('regions-list-visible')
  })

  it('PlayerBar - playing state', () => {
    cy.viewport(1280, 800)
    cy.visit('/index.html#basic.js')
    cy.get('#preview').its('0.contentDocument').should('exist')
    cy.wait(3000)
    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      const playBtn = doc.querySelector('.ws-play-btn')
      if (playBtn) playBtn.click()
    })
    cy.wait(500)
    cy.get('#preview').matchImageSnapshot('playerbar-playing')
  })
})

describe('Examples UI E2E', () => {
  it('Play button triggers wavesurfer playback', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(3000)
    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const ws = win.__ws_instances && win.__ws_instances[0]
      expect(ws).to.exist
      expect(ws.isPlaying()).to.be.false
      const playBtn = win.document.querySelector('.ws-play-btn')
      expect(playBtn).to.exist
      playBtn.click()
      expect(ws.isPlaying()).to.be.true
    })
  })

  it('Volume slider changes wavesurfer volume', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(3000)
    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const ws = win.__ws_instances && win.__ws_instances[0]
      expect(ws).to.exist
      const slider = win.document.querySelector('.ws-volume-slider')
      expect(slider).to.exist
      slider.value = '0.3'
      slider.dispatchEvent(new Event('input'))
      expect(ws.getVolume()).to.be.closeTo(0.3, 0.05)
    })
  })

  it('Theme toggle updates CSS variables and wavesurfer colors', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(3000)
    cy.get('#theme-toggle').click()
    cy.wait(500)
    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      const theme = doc.documentElement.getAttribute('data-theme')
      expect(theme).to.equal('dark')
    })
  })

  it('Responsive: hamburger menu appears at 375px', () => {
    cy.viewport(375, 812)
    cy.visit('/index.html#basic.js')
    cy.get('.hamburger-btn').should('be.visible')
    cy.get('.hamburger-btn').click()
    cy.get('#sidebar').should('have.class', 'open')
    cy.get('#sidebar-overlay').should('have.class', 'open')
  })

  it('Region list: add region then list updates and click seeks', () => {
    cy.viewport(1280, 800)
    cy.visit('/index.html#regions.js')
    cy.wait(3000)
    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const regions = win.__ws_regions
      expect(regions).to.exist
      const initialCount = regions.getRegions().length
      regions.addRegion({ start: 5, end: 8, content: 'Test', color: 'rgba(255,0,0,0.3)' })
      const newCount = regions.getRegions().length
      expect(newCount).to.be.greaterThan(initialCount)

      const rows = win.document.querySelectorAll('.ws-region-row')
      expect(rows.length).to.be.greaterThan(0)

      const lastRow = rows[rows.length - 1]
      lastRow.click()

      const ws = win.__ws_instances[0]
      expect(ws.getCurrentTime()).to.be.closeTo(5, 1)
    })
  })

  it('Playback rate select changes wavesurfer rate', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(3000)
    cy.get('#preview').then(($iframe) => {
      const win = $iframe[0].contentWindow
      const ws = win.__ws_instances && win.__ws_instances[0]
      expect(ws).to.exist
      const select = win.document.querySelector('.ws-rate-select')
      expect(select).to.exist
      select.value = '2'
      select.dispatchEvent(new Event('change'))
      expect(ws.getPlaybackRate()).to.equal(2)
    })
  })

  it('Info panel toggles open and closed', () => {
    cy.visit('/index.html#basic.js')
    cy.wait(3000)
    cy.get('#preview').then(($iframe) => {
      const doc = $iframe[0].contentDocument
      const toggleBtn = doc.querySelector('.ws-info-toggle')
      expect(toggleBtn).to.exist
      const panel = doc.querySelector('.ws-info-panel')
      expect(panel).to.exist
      expect(panel.classList.contains('open')).to.be.false
      toggleBtn.click()
      expect(panel.classList.contains('open')).to.be.true
      toggleBtn.click()
      expect(panel.classList.contains('open')).to.be.false
    })
  })
})
