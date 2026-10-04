(() => {
  if (typeof window.track !== 'function') {
    window.track = (eventName) => {
      if (!/^(responsive_demo_(desktop|tablet|phone)|product_demo_(nivara|fleet|striklenz)|configurator_used|enquiry_submitted)$/.test(eventName)) return
      fetch('/api/engagement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: eventName, page: location.pathname }),
        keepalive: true,
      }).then((response) => {
        if (!response.ok) throw new Error(`Engagement request failed (${response.status})`)
      }).catch((error) => console.error('Could not record engagement event:', error))
    }
  }

  const hero = document.getElementById('home')
  const ticker = document.querySelector('.ticker')
  const mobileExperience = document.getElementById('mobile-experience')
  const valueBand = document.querySelector('.valueBand')

  if (hero && ticker && hero.nextElementSibling !== ticker) hero.after(ticker)
  if (mobileExperience && valueBand && mobileExperience.nextElementSibling !== valueBand) {
    mobileExperience.after(valueBand)
  }
  document.querySelector('.skipLink')?.remove()

  function setupResponsiveDeviceControls() {
    const demo = document.querySelector('.responsiveDemo')
    const buttons = [...document.querySelectorAll('.responsiveControls .deviceChoice')]
    const hint = document.querySelector('.deviceHint')
    const labels = {
      desktop: 'Wide layout · full navigation',
      tablet: 'Tablet layout · balanced navigation',
      phone: 'Phone layout · touch-friendly controls',
    }
    if (!demo || !buttons.length) return

    const select = (device) => {
      if (!labels[device]) return
      demo.classList.remove('device-desktop', 'device-tablet', 'device-phone')
      demo.classList.add(`device-${device}`)
      buttons.forEach((button) => {
        const active = button.dataset.device === device
        button.hidden = false
        button.removeAttribute('aria-hidden')
        button.style.removeProperty('display')
        button.classList.toggle('active', active)
        button.setAttribute('aria-pressed', String(active))
      })
      if (hint) hint.textContent = labels[device]
    }

    buttons.forEach((button) => {
      button.onclick = null
      button.addEventListener('click', () => select(button.dataset.device))
    })
    select(buttons.find((button) => button.classList.contains('active'))?.dataset.device || 'desktop')
  }

  setupResponsiveDeviceControls()

  function hideStickyCtaOverMobileExperience() {
    const section = document.getElementById('mobile-experience')
    const stickyCta = document.querySelector('body > .mobileCta')
    if (!section || !stickyCta || typeof IntersectionObserver === 'undefined') return

    new IntersectionObserver(([entry]) => {
      document.body.classList.toggle('mobileExperienceInView', entry.isIntersecting)
    }).observe(section)
  }

  hideStickyCtaOverMobileExperience()

  const visibilityStyle = document.createElement('style')
  visibilityStyle.textContent = `
    [hidden]{display:none!important}
    .brand .mark,.mark{width:40px!important;height:40px!important;flex:0 0 40px!important;background:url('/favicon.svg') center/112% 112% no-repeat!important;border-radius:12px!important;box-shadow:0 5px 14px #3859d533!important;overflow:hidden!important;transform:none!important}
    #mobile-experience .responsiveDemo{height:200px;position:relative;overflow:hidden}
    #mobile-experience .responsiveControls{display:flex!important;visibility:visible!important;opacity:1!important}
    #mobile-experience .responsiveControls .deviceChoice{display:inline-flex!important;visibility:visible!important;opacity:1!important}
    #mobile-experience .responsiveDemo .responsiveDesktop,#mobile-experience .responsiveDemo .responsiveTablet,#mobile-experience .responsiveDemo .responsivePhone{display:none;position:absolute;left:50%;top:50%;margin:0;transform:translate(-50%,-50%)!important;opacity:1!important;filter:none!important;transition:none}
    #mobile-experience .responsiveDemo.device-desktop .responsiveDesktop{display:block;width:min(92%,360px)!important;height:150px;z-index:2}
    #mobile-experience .responsiveDemo.device-tablet .responsiveTablet{display:block;width:min(76%,290px)!important;height:150px;z-index:2}
    #mobile-experience .responsiveDemo.device-phone .responsivePhone{display:block;width:92px!important;height:160px;z-index:2}
    #mobile-experience .mobileCta{position:static!important;inset:auto!important;z-index:auto!important;box-shadow:none!important}
    #mobile-experience .dummySite{display:flex;flex-direction:column;gap:4px;width:100%;height:100%;padding:9px 11px;overflow:hidden;background:#f8faff;color:#17264b;font-family:Inter,system-ui,sans-serif;line-height:1.2}
    #mobile-experience .dummyTop{display:flex;align-items:center;gap:4px;min-width:0;min-height:9px;overflow:hidden}
    #mobile-experience .dummyTop>i{width:4px;height:4px;flex:0 0 4px;border-radius:50%;background:#a3b1ce}
    #mobile-experience .dummyBrand{margin-left:5px;font-size:7px;font-weight:800;white-space:nowrap}
    #mobile-experience .dummySample{margin-left:auto;font-size:6px;font-weight:700;letter-spacing:.04em;color:#7181a0;white-space:nowrap}
    #mobile-experience .dummyTitle{margin:4px 0 2px;font-size:10px;font-weight:750;line-height:1.2}
    #mobile-experience .dummyStats{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px}
    #mobile-experience .dummyMetric{display:flex;align-items:center;justify-content:space-between;gap:3px;min-width:0;padding:5px;border-radius:4px;background:#edf2fc}
    #mobile-experience .dummyMetric span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:6px;color:#63728e}
    #mobile-experience .dummyMetric b{font-size:7px;color:#243e72}
    #mobile-experience .dummyChartLabel{margin-top:2px;font-size:6px;color:#63728e}
    #mobile-experience .dummyChart{display:flex;flex:1;align-items:flex-end;gap:3px;min-height:24px;padding:3px 5px;border-radius:4px;background:#edf2fc}
    #mobile-experience .dummyChart i{display:block;flex:1;min-width:0;border-radius:2px 2px 0 0;background:linear-gradient(#49c9d3,#6d63ee)}
    #mobile-experience .dummyRows{display:flex;justify-content:space-between;gap:4px;flex:0 0 auto;padding-top:4px;border-top:1px solid #e2e8f5;font-size:6px}
    #mobile-experience .dummyRows span{color:#7181a0}
    #mobile-experience .dummyRows b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    #mobile-experience .responsivePhone .dummySite{gap:3px;padding:7px 5px}
    #mobile-experience .responsivePhone .dummyBrand{font-size:6px}
    #mobile-experience .responsivePhone .dummySample{display:none}
    #mobile-experience .responsivePhone .dummyTitle{font-size:7px}
    #mobile-experience .responsivePhone .dummyStats{grid-template-columns:1fr;gap:2px}
    #mobile-experience .responsivePhone .dummyMetric{padding:3px}
    #mobile-experience .responsivePhone .dummyChart{min-height:18px}
    #mobile-experience .responsivePhone .dummyRows{display:none}
    .skipLink{display:none!important}
    body.mobileExperienceInView> .mobileCta{display:none!important}
    #testimonials.testimonials{background:#fff!important;color:#0c1c4b!important}
    #testimonials .head h2{color:#0c1c4b!important}
    #testimonials .head p{color:#657594!important}
    #testimonials .testimonialCard{border-color:#d7e2f3!important;background:#fff!important;color:#0c1c4b!important;box-shadow:0 12px 32px #19367012}
    #testimonials .testimonialCard blockquote{color:#42516f}
    #testimonials .testimonialCard strong{color:#0c1c4b}
    #testimonials .testimonialCard p{color:#657594!important}
    .testimonialViewport{overflow:hidden}
    .testimonialGrid{display:flex;gap:16px;width:max-content;animation:testimonialMarquee var(--testimonial-duration,24s) linear infinite}
    .testimonialViewport:hover .testimonialGrid,.testimonialViewport:focus-within .testimonialGrid{animation-play-state:paused}
    .testimonialGroup{display:flex;flex:none;gap:16px;padding-right:16px}
    .testimonialCard{width:min(320px,calc((min(1200px,100vw - 56px) - 32px)/3));min-height:172px;padding:18px!important}
    .testimonialCard blockquote{font-size:14px;line-height:1.55!important;margin-bottom:14px!important}
    @keyframes testimonialMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
    @media(max-width:760px){.testimonialCard{width:min(300px,calc(100vw - 56px))}}
    @media(prefers-reduced-motion:reduce){.testimonialGrid{animation:none}.testimonialViewport{overflow-x:auto}.testimonialGroup[aria-hidden="true"]{display:none}}
    .mobileExperience .siteDemoFrame{display:block;width:100%;height:100%;border:0;background:#fff}
    .portfolioProjectVisual{display:grid;place-items:center;min-height:180px;padding:24px;background:radial-gradient(ellipse at 50% 30%,#7558df66,transparent 70%),linear-gradient(135deg,#111a39,#1a2a52);color:#e8edff;text-align:center;font-size:13px;font-weight:750;letter-spacing:.12em}
  `
  document.head.appendChild(visibilityStyle)

  const sectionDefinitions = [
    ['.ticker', 'Capabilities ticker'],
    ['#services', 'Services'],
    ['#mobile-experience', 'Mobile experience'],
    ['#work', 'Selected work'],
    ['#about', 'About'],
    ['#testimonials', 'Testimonials'],
    ['#pricing', 'Quotes / pricing'],
    ['#estimator', 'Project configurator'],
    ['#process', 'How we work'],
    ['#faq', 'FAQs'],
    ['#contact', 'Contact'],
    ['footer', 'Footer'],
  ]
  const legacySelectors = {
    '#pricing': ['.priceGrid'],
    '#faq': ['.faq', '.faqgrid'],
    '#work': ['.projects'],
  }

  function prepareFaqNavigation() {
    const faq = document.querySelector('section.faq')
    const navigation = document.querySelector('.links')
    if (faq && !faq.id) faq.id = 'faq'
    if (!faq || !navigation) return

    const processLink = navigation.querySelector('a[href="#process"]')
    if (processLink?.textContent.includes('FAQs')) processLink.textContent = 'How We Work'
    if (!navigation.querySelector('a[href="#faq"]')) {
      const link = document.createElement('a')
      link.href = '#faq'
      link.textContent = 'FAQs'
      const processEntry = navigation.querySelector('a[href="#process"]')
      navigation.insertBefore(link, processEntry?.nextSibling || null)
    }
  }

  function renderTestimonials(items) {
    const pricing = document.getElementById('pricing')
    if (!pricing) return
    let section = document.getElementById('testimonials')
    if (!section) {
      section = document.createElement('section')
      section.className = 'testimonials'
      section.id = 'testimonials'
      section.innerHTML = '<div class="wrap"><div class="head"><div><div class="eyebrow">CLIENT EXPERIENCES</div><h2>What our clients <span class="grad">say.</span></h2></div><p>Feedback shared by customers about working with Brew EdgeTech.</p></div><div class="testimonialViewport" aria-label="Client testimonials"><div class="testimonialGrid"></div></div></div>'
      pricing.before(section)
      const nav = document.querySelector('.links')
      if (nav && !nav.querySelector('a[href="#testimonials"]')) {
        const link = document.createElement('a')
        link.href = '#testimonials'
        link.textContent = 'Testimonials'
        const pricingLink = nav.querySelector('a[href="#pricing"]')
        nav.insertBefore(link, pricingLink || null)
      }
    }
    const visible = Array.isArray(items)
      ? items.filter((item) => item && typeof item.name === 'string' && item.name.trim() &&
        typeof item.quote === 'string' && item.quote.trim())
      : []
    const track = section.querySelector('.testimonialGrid')
    const makeGroup = (cloned) => {
      const group = document.createElement('div')
      group.className = 'testimonialGroup'
      group.setAttribute('role', 'list')
      if (cloned) group.setAttribute('aria-hidden', 'true')
      group.replaceChildren(...visible.map((item) => {
      const card = document.createElement('article')
      card.className = 'testimonialCard'
      card.setAttribute('role', 'listitem')
      card.style.cssText = 'height:100%;padding:24px;border:1px solid #293656;border-radius:16px;background:#101832;color:#edf3ff'
      const quote = document.createElement('blockquote')
      quote.textContent = `“${item.quote.trim()}”`
      quote.style.cssText = 'margin:0 0 20px;line-height:1.75'
      const name = document.createElement('strong')
      name.textContent = item.name.trim()
      card.append(quote, name)
      if (typeof item.role === 'string' && item.role.trim()) {
        const byline = document.createElement('p')
        byline.textContent = item.role.trim()
        byline.style.cssText = 'margin:5px 0 0;color:#a9b7d3;font-size:13px'
        card.appendChild(byline)
      }
      return card
      }))
      return group
    }
    track.replaceChildren(makeGroup(false), makeGroup(true))
    track.style.setProperty('--testimonial-duration', `${Math.max(18, visible.length * 6)}s`)
    section.hidden = visible.length === 0
    const testimonialLink = document.querySelector('.links a[href="#testimonials"]')
    if (testimonialLink) testimonialLink.hidden = section.hidden
  }

  function renderFaq(items = []) {
    const list = document.querySelector('.faqgrid>div:last-child')
    if (!list) return

    list.replaceChildren(...(Array.isArray(items) ? items : [])
      .filter((item) => item && typeof item.question === 'string' && item.question.trim())
      .slice(0, 20)
      .map((item) => {
        const detail = document.createElement('details')
        const question = document.createElement('summary')
        question.textContent = item.question
        const answer = document.createElement('p')
        answer.textContent = typeof item.answer === 'string' ? item.answer : ''
        detail.append(question, answer)
        return detail
      }))
  }

  function applyVisibility(visibility = {}) {
    const main = document.getElementById('main-content')
    const allowed = new Set(sectionDefinitions.map(([selector]) => selector))
    for (const [selector, label] of sectionDefinitions) {
      if (selector === '#testimonials') continue
      const legacy = legacySelectors[selector] || []
      const legacyValue = legacy.find((key) => typeof visibility[key] === 'boolean')
      const shown = typeof visibility[selector] === 'boolean'
        ? visibility[selector]
        : legacyValue ? visibility[legacyValue] : true
      const elements = selector === 'footer'
        ? [document.querySelector('footer')]
        : [...document.querySelectorAll(selector)]
      if (legacy.length && selector !== '#testimonials') {
        legacy.forEach((legacySelector) => document.querySelectorAll(legacySelector).forEach((element) => {
          element.hidden = !shown
        }))
      }
      for (const element of elements) {
        if (!element) continue
        if (selector === '#services' && main) {
          const merged = main.querySelector('.capabilitiesMerged')
          if (merged) merged.hidden = !shown
        }
        element.hidden = !shown
      }
      const navTarget = selector.startsWith('#') ? selector : null
      if (navTarget) {
        document.querySelectorAll(`a[href="${navTarget}"]`).forEach((link) => {
          link.hidden = !shown
        })
      }
    }
    const testimonial = document.getElementById('testimonials')
    if (testimonial && allowed.has('#testimonials') && visibility['#testimonials'] === false) {
      testimonial.hidden = true
    }
    const testimonialLink = document.querySelector('.links a[href="#testimonials"]')
    if (testimonialLink) testimonialLink.hidden = !testimonial || testimonial.hidden
  }

  function safePublicLink(value) {
    if (typeof value !== 'string' || !value.trim()) return null
    const link = value.trim()
    if (link.startsWith('/') && !link.startsWith('//')) return link
    try {
      const url = new URL(link)
      return url.protocol === 'https:' && !url.username && !url.password ? url.href : null
    } catch {
      return null
    }
  }

  function renderServices(items = []) {
    const grid = document.querySelector('#services .servicegrid')
    if (!grid) return

    const icons = ['⌘', '▱', '✧', '⌕']
    const cards = (Array.isArray(items) ? items : [])
      .filter((service) => service && typeof service.title === 'string' && service.title.trim())
      .slice(0, 20)
      .map((service, index) => {
        const card = document.createElement('a')
        card.className = 'service reveal show'
        card.href = safePublicLink(service?.url) || '#contact'

        const icon = document.createElement('div')
        icon.className = 'ico'
        icon.textContent = icons[index % icons.length]
        const arrow = document.createElement('em')
        arrow.textContent = '↗'
        const title = document.createElement('h3')
        title.textContent = typeof service?.title === 'string' ? service.title : ''
        const description = document.createElement('p')
        description.textContent = typeof service?.description === 'string' ? service.description : ''
        card.append(icon, arrow, title, description)
        return card
      })
    grid.replaceChildren(...cards)
  }

  function renderPricing(items = []) {
    const grid = document.querySelector('#pricing .priceGrid')
    if (!grid) return

    const cards = (Array.isArray(items) ? items : [])
      .filter((item) => item && typeof item.title === 'string' && item.title.trim())
      .slice(0, 12)
      .map((item, index) => {
        const card = document.createElement('article')
        card.className = 'priceCard'
        if (index === 1) card.classList.add('featured')

        const tag = document.createElement('span')
        tag.className = 'priceTag'
        tag.textContent = typeof item?.tag === 'string' && item.tag.trim() ? item.tag.trim() : 'PACKAGE'
        const title = document.createElement('h3')
        title.textContent = typeof item?.title === 'string' ? item.title : ''
        const price = document.createElement('p')
        price.className = 'price'
        price.textContent = typeof item?.price === 'string' && item.price.trim() ? item.price.trim() : 'Custom quote'
        const description = document.createElement('p')
        description.className = 'priceDesc'
        description.textContent = typeof item?.description === 'string' ? item.description : ''
        const features = document.createElement('ul')
        features.replaceChildren(...(Array.isArray(item?.features) ? item.features : [])
          .slice(0, 12)
          .map((feature) => {
            const entry = document.createElement('li')
            entry.textContent = String(feature)
            return entry
          }))
        const action = document.createElement('a')
        action.className = index === 1 ? 'btn' : 'btn alt'
        action.href = '#contact'
        action.textContent = 'Discuss your project ↗'
        card.append(tag, title, price, description, features, action)
        return card
      })
    grid.replaceChildren(...cards)
  }

  function applyMobileExperience(config = {}) {
    const controls = document.querySelectorAll('#mobile-experience .deviceChoice')
    controls.forEach((button) => {
      button.disabled = config.enabled === false
    })

    const devices = {
      desktop: '.responsiveDesktop',
      tablet: '.responsiveTablet',
      phone: '.responsivePhone',
    }
    for (const [device, selector] of Object.entries(devices)) {
      const settings = config[device]
      const frameUrl = safePublicLink(settings?.url)
      const mockup = document.querySelector(`${selector} .dummySite`)
      if (!frameUrl || !mockup) continue

      const frame = document.createElement('iframe')
      frame.className = 'siteDemoFrame'
      frame.src = frameUrl
      frame.title = typeof settings.title === 'string' && settings.title.trim()
        ? settings.title.trim()
        : `${device} website preview`
      frame.loading = 'lazy'
      frame.referrerPolicy = 'no-referrer'
      mockup.replaceWith(frame)
    }
  }

  function createPortfolioCard(project) {
    const card = document.createElement('article')
    card.className = 'caseCard'
    card.dataset.portfolioId = String(project.id)

    const visual = document.createElement('div')
    visual.className = 'caseVisual'
    const imageUrl = safePublicLink(project.image_url)
    if (imageUrl) {
      const image = document.createElement('img')
      image.src = imageUrl
      image.alt = project.title ? `${project.title} project` : 'Portfolio project'
      image.loading = 'lazy'
      visual.appendChild(image)
    } else {
      const placeholder = document.createElement('div')
      placeholder.className = 'portfolioProjectVisual'
      placeholder.textContent = String(project.category || 'SELECTED PROJECT').toUpperCase()
      visual.appendChild(placeholder)
    }

    const badge = document.createElement('span')
    badge.className = 'caseBadge'
    badge.textContent = String(project.category || 'SELECTED WORK')
    visual.appendChild(badge)

    const copy = document.createElement('div')
    copy.className = 'caseCopy'
    const category = document.createElement('span')
    category.className = 'caseType'
    category.textContent = String(project.category || 'PROJECT')
    const title = document.createElement('h3')
    title.textContent = String(project.title || 'Selected project')
    copy.append(category, title)

    if (typeof project.description === 'string' && project.description.trim()) {
      const description = document.createElement('p')
      description.textContent = project.description.trim()
      copy.appendChild(description)
    }
    if (typeof project.technologies === 'string' && project.technologies.trim()) {
      const technologies = document.createElement('p')
      technologies.textContent = project.technologies.trim()
      copy.appendChild(technologies)
    }

    const link = safePublicLink(project.live_url) || safePublicLink(project.demo_url)
    if (link) {
      const action = document.createElement('a')
      action.className = 'btn alt'
      action.href = link
      action.textContent = project.live_url ? 'View live project ↗' : 'View demo ↗'
      if (/^https:\/\//i.test(link)) {
        action.target = '_blank'
        action.rel = 'noopener noreferrer'
      }
      copy.appendChild(action)
    }

    card.append(visual, copy)
    return card
  }

  function syncPortfolioProjects(grid, projects) {
    const existing = new Set(
      [...grid.querySelectorAll('[data-portfolio-id]')].map((card) => card.dataset.portfolioId),
    )
    for (const project of projects) {
      const id = String(project.id || '')
      if (!id || existing.has(id)) continue
      grid.appendChild(createPortfolioCard(project))
      existing.add(id)
    }
  }

  async function loadPortfolioProjects() {
    const grid = document.querySelector('.caseGrid')
    if (!grid) return
    const response = await fetch('/api/portfolio')
    if (!response.ok) throw new Error(`Portfolio request failed (${response.status})`)
    const { projects = [] } = await response.json()
    if (!Array.isArray(projects) || !projects.length) return

    syncPortfolioProjects(grid, projects)
    const observer = new MutationObserver(() => syncPortfolioProjects(grid, projects))
    observer.observe(grid, { childList: true })
  }

  window.getPublishedSiteContent()
    .then((content) => {
      prepareFaqNavigation()
      renderTestimonials(content.testimonials?.items)
      renderServices(content.services?.items)
      renderPricing(content.pricing?.items)
      renderFaq(content.faq?.items)
      applyMobileExperience(content.mobile_experience || {})
      applyVisibility(content.homepage?.section_visibility || {})
    })
    .catch((error) => console.error('Could not load website sections:', error))

  loadPortfolioProjects()
    .catch((error) => console.error('Could not load published portfolio projects:', error))
})()
