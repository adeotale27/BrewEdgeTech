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

  const navCta = document.querySelector('.navCta')
  if (navCta) {
    const arrow = navCta.querySelector('span')
    navCta.replaceChildren(document.createTextNode('Discuss a Project '))
    if (arrow) navCta.appendChild(arrow)
  }
  const heroEyebrow = hero?.querySelector('.eyebrow')
  if (heroEyebrow) heroEyebrow.textContent = '✧  DIGITAL EXPERIENCES, MADE FOR WHAT’S NEXT'

  if (hero && ticker && hero.nextElementSibling !== ticker) hero.after(ticker)
  if (mobileExperience && valueBand && mobileExperience.nextElementSibling !== valueBand) {
    mobileExperience.after(valueBand)
  }
  const contactPrompts = [
    ['services', 'Planning a new website or product?', 'Share the outcome you’re aiming for. We’ll help you find a practical way to get there.'],
    ['work', 'Exploring a digital product?', 'Let’s shape a considered experience around your audience and goals.'],
    ['process', 'Want to know what comes next?', 'Start with a conversation about your goals, constraints and the right next step.'],
  ]
  for (const [sectionId, heading, description] of contactPrompts) {
    const section = document.getElementById(sectionId)
    if (!section || section.nextElementSibling?.classList.contains('sectionContactPrompt')) continue
    const prompt = document.createElement('aside')
    prompt.className = 'sectionContactPrompt'
    prompt.setAttribute('aria-label', 'Discuss a project')
    const copy = document.createElement('div')
    const title = document.createElement('h3')
    title.textContent = heading
    const detail = document.createElement('p')
    detail.textContent = description
    copy.append(title, detail)
    const link = document.createElement('a')
    link.className = 'btn'
    link.href = '#contact'
    link.append(document.createTextNode('Discuss a Project '))
    const arrow = document.createElement('span')
    arrow.setAttribute('aria-hidden', 'true')
    arrow.textContent = '↗'
    link.appendChild(arrow)
    prompt.append(copy, link)
    section.after(prompt)
  }
  const responsivePreview = document.querySelector('#mobile-experience .responsiveDemo')
  if (responsivePreview) {
    responsivePreview.setAttribute('aria-label', 'Sample dashboard previews in desktop, tablet, and phone layouts')
    responsivePreview.closest('.mobileCard')?.querySelector('.responsiveControls')?.remove()
  }

  const enquiryNote = document.getElementById('note')
  const enquiryForm = enquiryNote?.closest('form')
  if (enquiryNote && enquiryForm) {
    const defaultNote = enquiryNote.textContent.trim()
    const showConfirmation = () => {
      if (!enquiryNote.classList.contains('success') || enquiryForm.classList.contains('is-submitted')) return
      const confirmationText = enquiryNote.textContent.trim()
      enquiryForm.classList.add('is-submitted')

      const icon = document.createElement('span')
      icon.className = 'enquiryConfirmationIcon'
      icon.setAttribute('aria-hidden', 'true')
      icon.textContent = '✓'

      const content = document.createElement('div')
      content.className = 'enquiryConfirmationContent'
      const eyebrow = document.createElement('span')
      eyebrow.className = 'enquiryConfirmationEyebrow'
      eyebrow.textContent = 'ENQUIRY RECEIVED'
      const heading = document.createElement('h3')
      heading.textContent = 'Thank you. We’ll take it from here.'
      const message = document.createElement('p')
      message.textContent = confirmationText.includes('our team has been notified')
        ? 'Your project details are saved and our team has been notified.'
        : 'Your project details are saved securely.'
      const nextSteps = document.createElement('ul')
      nextSteps.className = 'enquiryConfirmationSteps'
      for (const stepText of ['Our team will review your project details.', 'We’ll follow up using the email you provided.']) {
        const step = document.createElement('li')
        step.textContent = stepText
        nextSteps.appendChild(step)
      }
      const reset = document.createElement('button')
      reset.className = 'enquiryConfirmationReset'
      reset.type = 'button'
      reset.textContent = 'Send another enquiry'
      reset.addEventListener('click', () => {
        enquiryForm.classList.remove('is-submitted')
        enquiryNote.classList.remove('success')
        enquiryNote.replaceChildren(document.createTextNode(defaultNote))
        enquiryForm.reset()
        enquiryForm.querySelector('input, select, textarea')?.focus()
      })
      content.append(eyebrow, heading, message, nextSteps, reset)
      enquiryNote.replaceChildren(icon, content)
    }
    new MutationObserver(showConfirmation).observe(enquiryNote, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      characterData: true,
      subtree: true,
    })
  }

  const visibilityStyle = document.createElement('style')
  visibilityStyle.textContent = `
    [hidden]{display:none!important}
    .brand .mark,.mark{width:40px!important;height:40px!important;flex:0 0 40px!important;background:url('/favicon.svg') center/112% 112% no-repeat!important;border-radius:12px!important;box-shadow:0 5px 14px #3859d533!important;overflow:hidden!important;transform:none!important}
    #mobile-experience .responsiveDemo{display:flex!important;align-items:flex-end!important;justify-content:center!important;gap:clamp(7px,1.4vw,14px)!important;width:100%!important;height:clamp(210px,22vw,260px)!important;min-height:210px!important;position:relative!important;overflow:hidden!important;box-sizing:border-box!important;padding:28px 12px 18px!important}
    #mobile-experience .responsiveDemo:before{content:'ALL SCREENS · ONE EXPERIENCE'!important;top:10px!important;font-size:7px!important;letter-spacing:1.1px!important}
    #mobile-experience .responsiveDemo:after{content:none!important}
    #mobile-experience .responsiveControls{display:none!important}
    #mobile-experience .deviceLabels{display:grid!important;grid-template-columns:minmax(0,57fr) minmax(0,24fr) minmax(42px,12fr)!important;gap:clamp(7px,1.4vw,14px)!important;width:calc(100% - 24px)!important;margin:6px auto 2px!important;text-align:center!important;color:#71809b!important;font-size:10px!important;font-weight:700!important;line-height:1.3!important}
    #mobile-experience .responsiveDemo .responsiveDesktop,#mobile-experience .responsiveDemo .responsiveTablet,#mobile-experience .responsiveDemo .responsivePhone{display:block!important;position:relative!important;inset:auto!important;align-self:flex-end!important;flex-shrink:1!important;min-width:0!important;max-width:none!important;margin:0!important;box-sizing:border-box!important;transform:none!important;opacity:1!important;filter:none!important;transition:none!important}
    #mobile-experience .responsiveDemo .responsiveDesktop{width:57%!important;height:clamp(108px,15vw,150px)!important;flex:0 1 57%!important;z-index:2!important}
    #mobile-experience .responsiveDemo .responsiveTablet{width:24%!important;height:clamp(112px,15vw,145px)!important;flex:0 1 24%!important;z-index:2!important}
    #mobile-experience .responsiveDemo .responsivePhone{width:12%!important;min-width:42px!important;height:clamp(122px,17vw,160px)!important;flex:0 1 12%!important;z-index:2!important}
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
    @media(max-width:680px){#mobile-experience .responsiveDemo{height:210px!important;min-height:210px!important;gap:7px!important;padding:26px 8px 15px!important}#mobile-experience .responsiveDemo .responsiveDesktop{height:108px!important}#mobile-experience .responsiveDemo .responsiveTablet{height:112px!important}#mobile-experience .responsiveDemo .responsivePhone{height:122px!important;min-width:42px!important}#mobile-experience .deviceLabels{width:calc(100% - 16px)!important;gap:7px!important;font-size:9px!important}}
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
      section.setAttribute('aria-labelledby', 'testimonialHeading')
      section.innerHTML = '<div class="wrap"><div class="testimonialHeading"><div><div class="eyebrow">CLIENT EXPERIENCES</div><h2 id="testimonialHeading">Words from the people<br><span class="grad">we build with.</span></h2></div><p>Real feedback from customers who have worked with Brew EdgeTech.</p></div><div class="testimonialGrid" role="list" aria-label="Customer testimonials"></div></div>'
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
    track.replaceChildren(...visible.map((item) => {
      const card = document.createElement('article')
      card.className = 'testimonialCard'
      card.setAttribute('role', 'listitem')
      const quoteMark = document.createElement('span')
      quoteMark.className = 'testimonialQuoteMark'
      quoteMark.setAttribute('aria-hidden', 'true')
      quoteMark.textContent = '“'
      const quote = document.createElement('blockquote')
      quote.textContent = item.quote.trim()
      const attribution = document.createElement('div')
      attribution.className = 'testimonialAttribution'
      const initials = item.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
      const avatar = document.createElement('span')
      avatar.className = 'testimonialAvatar'
      avatar.setAttribute('aria-hidden', 'true')
      avatar.textContent = initials
      const identity = document.createElement('span')
      identity.className = 'testimonialIdentity'
      const name = document.createElement('strong')
      name.textContent = item.name.trim()
      identity.appendChild(name)
      if (typeof item.role === 'string' && item.role.trim()) {
        const byline = document.createElement('span')
        byline.className = 'testimonialRole'
        byline.textContent = item.role.trim()
        identity.appendChild(byline)
      }
      attribution.append(avatar, identity)
      card.append(quoteMark, quote, attribution)
      return card
    }))
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

    const defaultServices = [
      {
        title: 'Web Design & Development',
        description: 'Responsive, accessible websites with a distinctive identity and a smooth experience on every screen.',
        url: '/services/website-design/',
      },
      {
        title: 'Custom Software',
        description: 'Purpose-built web applications, dashboards and workflows that fit how your team works.',
        url: '/services/custom-software/',
      },
      {
        title: 'AI & Automation',
        description: 'Practical AI integrations and automated workflows that reduce repetitive work while keeping people in control.',
        url: '/services/ai-automation/',
      },
      {
        title: 'SEO & Digital Visibility',
        description: 'Search-friendly site structure and clear content that help customers discover your business.',
        url: '/services/seo-visibility/',
      },
    ]
    const icons = ['⌘', '▱', '✧', '⌕']
    const configuredServices = (Array.isArray(items) ? items : [])
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
    const cards = configuredServices.length
      ? configuredServices
      : grid.children.length
        ? null
        : defaultServices.map((service, index) => {
            const card = document.createElement('a')
            card.className = 'service reveal show'
            card.href = service.url
            const icon = document.createElement('div')
            icon.className = 'ico'
            icon.textContent = icons[index]
            const arrow = document.createElement('em')
            arrow.textContent = '↗'
            const title = document.createElement('h3')
            title.textContent = service.title
            const description = document.createElement('p')
            description.textContent = service.description
            card.append(icon, arrow, title, description)
            return card
          })
    if (cards) grid.replaceChildren(...cards)
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

  document.addEventListener('error', (event) => {
    const image = event.target
    if (!(image instanceof HTMLImageElement) || !image.matches('.caseVisual > img')) return

    const visual = image.parentElement
    if (!visual) return

    const placeholder = document.createElement('div')
    placeholder.className = 'portfolioProjectVisual'
    placeholder.textContent = visual.querySelector('.caseBadge')?.textContent?.trim().toUpperCase()
      || 'PROJECT PREVIEW UNAVAILABLE'
    image.replaceWith(placeholder)
  }, true)

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
