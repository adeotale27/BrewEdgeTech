(() => {
  function setText(selector, value) {
    if (typeof value !== 'string' || !value.trim()) return
    const element = document.querySelector(selector)
    if (element) element.textContent = value.trim()
  }

  function setMeta(selector, attribute, value) {
    if (typeof value !== 'string' || !value.trim()) return
    document.querySelector(selector)?.setAttribute(attribute, value.trim())
  }

  function setSocialImage(value) {
    if (typeof value !== 'string' || !/^https:\/\//i.test(value.trim())) return
    for (const [selector, attribute, name] of [
      ['meta[property="og:image"]', 'property', 'og:image'],
      ['meta[name="twitter:image"]', 'name', 'twitter:image'],
    ]) {
      let element = document.querySelector(selector)
      if (!element) {
        element = document.createElement('meta')
        element.setAttribute(attribute, name)
        document.head.appendChild(element)
      }
      element.content = value.trim()
    }
  }

  function applyOrganizationName(value) {
    if (typeof value !== 'string' || !value.trim()) return
    const schema = document.querySelector('script[type="application/ld+json"]')
    if (!schema) return
    try {
      const data = JSON.parse(schema.textContent)
      if (data['@type'] === 'Organization') {
        data.name = value.trim()
        schema.textContent = JSON.stringify(data)
      }
    } catch (error) {
      console.error('Could not update organization structured data:', error)
    }
  }

  window.getPublishedSiteContent()
    .then((content) => {
      const homepage = content.homepage || {}
      const seo = content.seo || {}
      if (typeof homepage.hero_title === 'string' && homepage.hero_title.trim()) {
        const heading = document.querySelector('.hero h1')
        if (heading) {
          const lines = homepage.hero_title.split('\n')
          const emphasized = document.createElement('span')
          emphasized.className = 'grad'
          emphasized.textContent = lines.slice(1).join(' ') || ''
          heading.replaceChildren(
            document.createTextNode(lines[0] || ''),
            document.createElement('br'),
            emphasized,
          )
        }
      }
      setText('.hero .lead', homepage.hero_subtitle)
      setText('.why h2', homepage.about_title)
      setText('.whygrid>div:last-child>p', homepage.about_text)

      if (typeof seo.title === 'string' && seo.title.trim()) {
        document.title = seo.title.trim()
        setMeta('meta[property="og:title"]', 'content', seo.title)
      }
      setMeta('meta[name="description"]', 'content', seo.description)
      setMeta('meta[property="og:description"]', 'content', seo.description)
      setSocialImage(seo.og_image)
      if (typeof seo.canonical_url === 'string' && /^https:\/\//i.test(seo.canonical_url.trim())) {
        setMeta('link[rel="canonical"]', 'href', seo.canonical_url)
      }
      setMeta('meta[name="robots"]', 'content', seo.robots)
      if (['summary', 'summary_large_image'].includes(seo.twitter_card)) {
        setMeta('meta[name="twitter:card"]', 'content', seo.twitter_card)
      }
      applyOrganizationName(seo.organization_name)
    })
    .catch((error) => console.error('Could not render published website content:', error))
})()
