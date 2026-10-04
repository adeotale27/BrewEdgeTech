(() => {
  function applySettings(content = {}) {
    const footer = content.footer || {}
    const set = (selector, value) => {
      if (typeof value !== 'string' || !value.trim()) return
      document.querySelectorAll(selector).forEach((element) => {
        element.textContent = value.trim()
      })
    }

    if (typeof footer.company === 'string' && footer.company.trim()) {
      document.querySelectorAll('.brand').forEach((brand) => {
        const name = brand.querySelector('b')
        if (!name) return
        name.textContent = footer.company.trim()
        brand.querySelector('small')?.remove()
      })
      const schema = document.querySelector('script[type="application/ld+json"]')
      if (schema) {
        try {
          const data = JSON.parse(schema.textContent)
          if (data['@type'] === 'Organization') {
            data.name = footer.company.trim()
            schema.textContent = JSON.stringify(data)
          }
        } catch (error) {
          console.error('Could not update organization structured data:', error)
        }
      }
    }

    set('footer .footcol:last-child p', [footer.phone, footer.location].filter(Boolean).join(' · '))
    if (typeof footer.email === 'string' && footer.email.trim()) {
      document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
        link.href = `mailto:${footer.email.trim()}`
        if (!link.textContent.trim() || link.textContent.includes('@')) {
          link.textContent = footer.email.trim()
        }
      })
    }

    const contact = document.querySelector('footer .footcol:last-child')
    if (contact) {
      let socialLinks = contact.querySelector('.site-social-links')
      const socials = [
        ['Instagram', footer.instagram],
        ['LinkedIn', footer.linkedin],
      ].filter(([, url]) => typeof url === 'string' && /^https:\/\//i.test(url.trim()))
      if (socials.length) {
        if (!socialLinks) {
          socialLinks = document.createElement('div')
          socialLinks.className = 'site-social-links'
          socialLinks.style.cssText = 'display:flex;gap:14px;margin-top:12px'
          contact.appendChild(socialLinks)
        }
        socialLinks.replaceChildren(...socials.map(([label, url]) => {
          const link = document.createElement('a')
          link.href = url.trim()
          link.target = '_blank'
          link.rel = 'noopener noreferrer'
          link.textContent = label
          return link
        }))
      } else {
        socialLinks?.remove()
      }
    }

    document.querySelector('#siteAnnouncement')?.remove()
    if (typeof footer.banner === 'string' && footer.banner.trim()) {
      const banner = document.createElement('div')
      banner.id = 'siteAnnouncement'
      banner.textContent = footer.banner.trim()
      banner.style.cssText = 'position:relative;z-index:20;text-align:center;padding:10px;background:#0c1c4b;color:white;font-size:13px'
      if (typeof footer.banner_url === 'string' && /^https:\/\//i.test(footer.banner_url.trim())) {
        const link = document.createElement('a')
        link.href = footer.banner_url.trim()
        link.textContent = footer.banner.trim()
        link.style.color = 'white'
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        banner.replaceChildren(link)
      }
      document.body.prepend(banner)
    }
  }

  window.getPublishedSiteContent()
    .then(applySettings)
    .catch((error) => console.error('Could not load public site settings:', error))
})()
