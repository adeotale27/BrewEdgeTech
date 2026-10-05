(() => {
  const adminResponsiveStyle = document.createElement('style')
  adminResponsiveStyle.textContent = `
    @media (max-width: 900px) {
      .layout { grid-template-columns: 190px minmax(0, 1fr); gap: 14px }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)) }
      .stat, .panel { min-width: 0 }
      .project { min-width: 0 }
    }
    @media (max-width: 760px) {
      .layout { grid-template-columns: minmax(0, 1fr) }
      .stats { grid-template-columns: repeat(2, minmax(0, 1fr)) }
    }
    @media (max-width: 380px) {
      .shell { padding: 10px }
      .stats { gap: 8px }
      .stat { padding: 10px }
      .panel { padding: 14px }
    }
  `
  document.head.appendChild(adminResponsiveStyle)

  const overview = document.getElementById('overview')
  const quickActionsPanel = [...(overview?.querySelectorAll('.panel') || [])]
    .find((panel) => panel.querySelector('.panelhead h2')?.textContent.trim() === 'Quick actions')
  const quickActionsNote = quickActionsPanel?.querySelector(':scope > .muted')
  if (quickActionsNote) {
    quickActionsNote.textContent = 'Edit pages and preview before publishing, add case studies, manage demos, or upload images and videos.'
  }

  const overviewStats = overview?.querySelector('.stats')
  if (overviewStats && !overview.querySelector('.adminGettingStarted')) {
    const guide = document.createElement('div')
    guide.className = 'adminGettingStarted'
    guide.setAttribute('aria-label', 'How to update your website')
    guide.innerHTML = `
      <div class="adminGuideIntro">
        <span class="growthLabel">YOUR WEBSITE, YOUR WAY</span>
        <h2>Make a change in three simple steps</h2>
        <p>Update your content, review the preview, then choose when it goes live.</p>
      </div>
      <div class="adminGuideStep"><span>01</span><div><b>Edit a section</b><small>Choose a page section and make your changes.</small></div></div>
      <div class="adminGuideStep"><span>02</span><div><b>Save a draft</b><small>Keep changes private while you review them.</small></div></div>
      <div class="adminGuideStep"><span>03</span><div><b>Publish when ready</b><small>Make the reviewed version visible on your site.</small></div></div>
      <button class="btn primary adminGuideAction" type="button" data-guide-view="pages">Open page editor</button>`
    overviewStats.after(guide)
    guide.querySelector('[data-guide-view="pages"]')?.addEventListener('click', () => {
      document.querySelector('.nav[data-view="pages"]')?.click()
    })
  }

  const coverImage = document.getElementById('pimage')
  if (coverImage?.parentElement && !coverImage.parentElement.querySelector('.adminImageHelp')) {
    const hint = document.createElement('p')
    hint.className = 'hint adminImageHelp'
    hint.textContent = 'Upload the image in Media library, copy its key, then paste the key here. You can also use an HTTPS image URL.'
    coverImage.parentElement.appendChild(hint)
  }

  const sections = [
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
  const defaultTestimonials = []
  let testimonials = []

  async function request(path, options = {}) {
    const response = await fetch('/api' + path, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      redirect: 'manual',
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = typeof data.error === 'string'
        ? data.error
        : data.error?.message || data.message || `Request failed (${response.status})`
      throw new Error(message)
    }
    return data
  }

  function activeKey() {
    return document.querySelector('#contentTabs [data-key].active')?.dataset.key
  }

  function setStatus(message, isError = false) {
    const status = document.getElementById('contentStatus')
    if (!status) return
    status.textContent = message
    status.className = isError ? 'status error' : 'status'
  }

  function isSectionVisible(saved, selector) {
    if (typeof saved[selector] === 'boolean') return saved[selector]
    for (const legacySelector of legacySelectors[selector] || []) {
      if (typeof saved[legacySelector] === 'boolean') return saved[legacySelector]
    }
    return true
  }

  function syncTestimonialsFromFields() {
    document.querySelectorAll('[data-testimonial]').forEach((card) => {
      const index = Number(card.dataset.testimonial)
      const current = testimonials[index] || {}
      card.querySelectorAll('[data-tfield]').forEach((field) => {
        current[field.dataset.tfield] = field.value
      })
      testimonials[index] = current
    })
  }

  function renderTestimonials() {
    const fields = document.getElementById('contentFields')
    if (!fields) return
    fields.innerHTML = '<div class="field full"><p class="hint">Add real, approved customer testimonials only. Testimonials are public after you save and publish this section.</p></div>' +
      testimonials.map((item, index) => `
        <article class="panel full" data-testimonial="${index}">
          <div class="panelhead"><h3>Testimonial ${index + 1}</h3><button class="btn danger" type="button" data-remove-testimonial="${index}">Remove</button></div>
          <div class="grid2">
            <div class="field"><label for="testimonial-name-${index}">Customer name</label><input id="testimonial-name-${index}" data-tfield="name" maxlength="120" value="${escapeHtml(item.name)}" required></div>
            <div class="field"><label for="testimonial-role-${index}">Role / company (optional)</label><input id="testimonial-role-${index}" data-tfield="role" maxlength="160" value="${escapeHtml(item.role)}"></div>
            <div class="field full"><label for="testimonial-quote-${index}">Quote</label><textarea id="testimonial-quote-${index}" data-tfield="quote" maxlength="1200" required>${escapeHtml(item.quote)}</textarea></div>
          </div>
        </article>`).join('') +
      '<div class="field full"><button class="btn" id="addTestimonial" type="button">＋ Add testimonial</button></div>'

    fields.querySelectorAll('[data-remove-testimonial]').forEach((button) => {
      button.addEventListener('click', () => {
        syncTestimonialsFromFields()
        testimonials.splice(Number(button.dataset.removeTestimonial), 1)
        renderTestimonials()
      })
    })
    document.getElementById('addTestimonial')?.addEventListener('click', () => {
      syncTestimonialsFromFields()
      testimonials.push({ name: '', role: '', quote: '' })
      renderTestimonials()
      document.getElementById(`testimonial-name-${testimonials.length - 1}`)?.focus()
    })
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    })[character])
  }

  async function loadTestimonials() {
    const { items = [] } = await request('/admin/content')
    const saved = items.find((item) => item.content_key === 'testimonials')
    testimonials = Array.isArray(saved?.content?.items)
      ? saved.content.items.map((item) => ({
        name: String(item.name || ''),
        role: String(item.role || ''),
        quote: String(item.quote || ''),
      }))
      : defaultTestimonials
    renderTestimonials()
  }

  async function saveTestimonials(publish) {
    const fields = [...document.querySelectorAll('[data-tfield]')]
    const invalid = fields.find((field) => !field.checkValidity())
    if (invalid) {
      invalid.reportValidity()
      return
    }
    const items = []
    for (const field of fields) {
      const card = field.closest('[data-testimonial]')
      const index = Number(card.dataset.testimonial)
      items[index] = items[index] || {}
      items[index][field.dataset.tfield] = field.value.trim()
    }
    const content = { items }
    try {
      setStatus('Saving testimonials…')
      await request('/admin/content', {
        method: 'PUT',
        body: JSON.stringify({ key: 'testimonials', content }),
      })
      if (publish) {
        await request('/admin/content', {
          method: 'POST',
          body: JSON.stringify({ key: 'testimonials' }),
        })
        setStatus('Testimonials saved and published.')
      } else {
        setStatus('Testimonials saved as a draft.')
      }
      testimonials = items
    } catch (error) {
      setStatus(`Could not save testimonials: ${error.message}`, true)
    }
  }

  const visibilitySections = document.getElementById('layoutFields')
  if (visibilitySections) {
    window.renderLayout = async () => {
      try {
        visibilitySections.innerHTML = '<span class="hint">Loading section visibility…</span>'
        const { items = [] } = await request('/admin/content')
        const saved = items.find((item) => item.content_key === 'homepage')?.content?.section_visibility || {}
        visibilitySections.innerHTML = sections.map(([selector, label]) => {
          return `<label><input type="checkbox" data-layout="${selector}" ${isSectionVisible(saved, selector) ? 'checked' : ''}> ${label}</label>`
        }).join('')
      } catch (error) {
        visibilitySections.innerHTML = `<span class="status error">Could not load visibility settings: ${escapeHtml(error.message)}</span>`
      }
    }

    document.getElementById('saveLayout').onclick = async () => {
      const button = document.getElementById('saveLayout')
      const status = document.getElementById('layoutStatus')
      button.disabled = true
      try {
        const { items = [] } = await request('/admin/content')
        const existing = items.find((item) => item.content_key === 'homepage')?.content || {}
        const visibility = { ...(existing.section_visibility || {}), '#home': true }
        sections.forEach(([selector]) => {
          const input = [...visibilitySections.querySelectorAll('[data-layout]')]
            .find((checkbox) => checkbox.dataset.layout === selector)
          if (input) visibility[selector] = input.checked
        })
        const content = { ...existing, section_visibility: visibility }
        await request('/admin/content', {
          method: 'PUT',
          body: JSON.stringify({ key: 'homepage', content }),
        })
        await request('/admin/content', {
          method: 'POST',
          body: JSON.stringify({ key: 'homepage' }),
        })
        status.textContent = 'Section visibility saved and published.'
        status.className = 'status'
      } catch (error) {
        status.textContent = `Could not save section visibility: ${error.message}`
        status.className = 'status error'
      } finally {
        button.disabled = false
      }
    }
  }

  const tabs = document.getElementById('contentTabs')
  if (tabs) {
    const tab = document.createElement('button')
    tab.type = 'button'
    tab.className = 'tab'
    tab.dataset.key = 'testimonials'
    tab.textContent = 'Testimonials'
    tabs.insertBefore(tab, tabs.querySelector('[data-key="faq"]'))
    tab.addEventListener('click', async () => {
      document.querySelectorAll('#contentTabs [data-key]').forEach((item) => {
        item.classList.toggle('active', item === tab)
      })
      setStatus('')
      try {
        await loadTestimonials()
      } catch (error) {
        setStatus(`Could not load testimonials: ${error.message}`, true)
      }
    })

    const saveButton = document.getElementById('saveContent')
    const publishButton = document.getElementById('publishContent')
    const originalSave = saveButton.onclick
    const originalPublish = publishButton.onclick
    saveButton.onclick = (event) => activeKey() === 'testimonials'
      ? saveTestimonials(false)
      : originalSave?.call(saveButton, event)
    publishButton.onclick = (event) => activeKey() === 'testimonials'
      ? saveTestimonials(true)
      : originalPublish?.call(publishButton, event)
  }

  const revisionSelect = document.getElementById('revisionKey')
  const scheduleSelect = document.getElementById('scheduleKey')
  for (const select of [revisionSelect, scheduleSelect]) {
    if (!select || select.querySelector('option[value="testimonials"]')) continue
    const option = document.createElement('option')
    option.value = 'testimonials'
    option.textContent = 'Testimonials'
    select.appendChild(option)
  }

  document.querySelector('[data-view="growth"]')?.addEventListener('click', () => {
    window.renderLayout?.()
  })

  function installRepeatableContentEditors() {
    const fields = document.getElementById('contentFields')
    const tabs = document.getElementById('contentTabs')
    const saveButton = document.getElementById('saveContent')
    const publishButton = document.getElementById('publishContent')
    if (!fields || !tabs || !saveButton || !publishButton || typeof window.renderContent !== 'function') return

    const originalRenderContent = window.renderContent
    function activeKey() {
      return tabs.querySelector('[data-key].active')?.dataset.key || ''
    }

    function renderItemsEditor(key) {
      const items = Array.isArray(content[key]?.items) ? content[key].items : []
      const isService = key === 'services'
      const itemMarkup = items.map((item, index) => {
        const title = isService ? 'Service title' : 'Question'
        const detail = isService ? 'Description' : 'Answer'
        const nameKey = isService ? 'title' : 'question'
        const detailKey = isService ? 'description' : 'answer'
        const detailInput = isService
          ? `<textarea data-list-field="${detailKey}" maxlength="1000">${escapeHtml(item?.[detailKey] || '')}</textarea>`
          : `<textarea data-list-field="${detailKey}" maxlength="2000">${escapeHtml(item?.[detailKey] || '')}</textarea>`
        return `
          <article class="panel full sectionListItem" data-section-list-item="${index}">
            <div class="panelhead">
              <h3>${isService ? 'Service' : 'Question'} ${index + 1}</h3>
              <button class="btn danger" type="button" data-list-remove="${index}">Remove</button>
            </div>
            <div class="grid2">
              <div class="field full"><label>${title}</label><input data-list-field="${nameKey}" maxlength="160" value="${escapeHtml(item?.[nameKey] || '')}"></div>
              <div class="field full"><label>${detail}</label>${detailInput}</div>
              ${isService ? `<div class="field full"><label>Service page link (optional)</label><input data-list-field="url" maxlength="500" value="${escapeHtml(item?.url || '')}" placeholder="/services/website-design/"></div>` : ''}
            </div>
          </article>`
      }).join('')
      const name = isService ? 'service' : 'FAQ'
      fields.innerHTML = `
        <div class="field full">
          <p class="hint">Edit each ${name.toLowerCase()} below. Changes stay in draft until you choose “Save &amp; publish”.</p>
        </div>
        ${itemMarkup}
        <div class="field full"><button class="btn" type="button" data-list-add>Add ${name}</button></div>
        <textarea class="hidden" data-content="items" aria-hidden="true">${escapeHtml(JSON.stringify(items))}</textarea>`
    }

    window.renderContent = function renderContentWithStructuredLists() {
      const key = activeKey()
      if (key === 'services' || key === 'faq') return renderItemsEditor(key)
      return originalRenderContent()
    }

    function syncItems(key) {
      const nameKey = key === 'services' ? 'title' : 'question'
      const detailKey = key === 'services' ? 'description' : 'answer'
      const items = [...fields.querySelectorAll('[data-section-list-item]')].map((card) => {
        const item = {
          [nameKey]: card.querySelector(`[data-list-field="${nameKey}"]`)?.value.trim() || '',
          [detailKey]: card.querySelector(`[data-list-field="${detailKey}"]`)?.value.trim() || '',
        }
        if (key === 'services') {
          item.url = card.querySelector('[data-list-field="url"]')?.value.trim() || ''
        }
        return item
      })
      const hidden = fields.querySelector('[data-content="items"]')
      if (hidden) hidden.value = JSON.stringify(items)
      content[key] = { ...(content[key] || {}), items }
      return items
    }

    function validServiceUrl(value) {
      if (!value) return true
      if (value.startsWith('/') && !value.startsWith('//')) return true
      try {
        const url = new URL(value)
        return url.protocol === 'https:' && !url.username && !url.password
      } catch {
        return false
      }
    }

    document.addEventListener('input', (event) => {
      const key = activeKey()
      if ((key === 'services' || key === 'faq') && fields.contains(event.target)) syncItems(key)
    }, true)
    document.addEventListener('change', (event) => {
      const key = activeKey()
      if ((key === 'services' || key === 'faq') && fields.contains(event.target)) syncItems(key)
    }, true)
    fields.addEventListener('click', (event) => {
      const button = event.target instanceof Element
        ? event.target.closest('[data-list-add], [data-list-remove]')
        : null
      if (!button) return
      const key = activeKey()
      if (key !== 'services' && key !== 'faq') return
      const items = syncItems(key)
      if (button.hasAttribute('data-list-add')) {
        items.push(key === 'services'
          ? { title: '', description: '', url: '' }
          : { question: '', answer: '' })
      } else {
        items.splice(Number(button.dataset.listRemove), 1)
      }
      content[key] = { ...(content[key] || {}), items }
      window.renderContent()
      fields.querySelector('[data-content="items"]')
        ?.dispatchEvent(new Event('input', { bubbles: true }))
      fields.querySelector(`[data-section-list-item="${items.length - 1}"] [data-list-field]`)?.focus()
    })

    const validateList = (event) => {
      const key = activeKey()
      if (key !== 'services' && key !== 'faq') return
      const items = syncItems(key)
      const requiredKey = key === 'services' ? 'title' : 'question'
      const invalid = items.findIndex((item) => !item[requiredKey].trim())
      const invalidUrl = key === 'services'
        ? items.findIndex((item) => !validServiceUrl(item.url.trim()))
        : -1
      if (invalid !== -1 || invalidUrl !== -1) {
        event.preventDefault()
        event.stopImmediatePropagation()
        const message = invalid !== -1
          ? `Enter a ${key === 'services' ? 'title' : 'question'} for every item before saving.`
          : 'Service links must be a site path or an HTTPS URL.'
        setStatus(message, true)
        const firstCard = fields.querySelector(`[data-section-list-item="${invalid !== -1 ? invalid : invalidUrl}"]`)
        firstCard?.querySelector(`[data-list-field="${invalid !== -1 ? requiredKey : 'url'}"]`)?.focus()
      }
    }
    saveButton.addEventListener('click', validateList, true)
    publishButton.addEventListener('click', validateList, true)
  }

  function setupContentWorkflow() {
    const editor = document.getElementById('pages')
    const fields = document.getElementById('contentFields')
    const status = document.getElementById('contentStatus')
    const saveButton = document.getElementById('saveContent')
    const publishButton = document.getElementById('publishContent')
    const tabs = document.getElementById('contentTabs')
    if (!editor || !fields || !status || !saveButton || !publishButton || !tabs) return

    const style = document.createElement('style')
    style.textContent = `
      .contentWorkflowBar{position:sticky;bottom:12px;z-index:30;display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:18px;padding:13px 15px;border:1px solid #dce4ef;border-radius:13px;background:#ffffffed;box-shadow:0 12px 32px #19367018;backdrop-filter:blur(14px)}
      .contentWorkflowCopy{min-width:0}
      .contentWorkflowCopy strong{display:block;color:#172543;font-size:13px}
      .contentWorkflowCopy p{margin:4px 0 0;color:#64748b;font-size:11px;line-height:1.45}
      .contentWorkflowActions{display:flex;flex:none;gap:8px}
      .contentWorkflowBar .status{margin:5px 0 0;min-height:0}
      .contentWorkflowBar .status:not(.error){color:#087f5b}
      .contentWorkflowBar .status.error{color:#b4233a}
      @media(max-width:680px){.contentWorkflowBar{align-items:stretch;flex-direction:column;bottom:6px}.contentWorkflowActions{display:grid;grid-template-columns:1fr 1fr}.contentWorkflowActions .btn{white-space:normal}}
    `
    document.head.appendChild(style)

    const bar = document.createElement('div')
    bar.className = 'contentWorkflowBar'
    bar.setAttribute('role', 'region')
    bar.setAttribute('aria-label', 'Save and publish section')
    const copy = document.createElement('div')
    copy.className = 'contentWorkflowCopy'
    const label = document.createElement('strong')
    label.id = 'contentSectionLabel'
    const state = document.createElement('p')
    state.id = 'contentWorkflowState'
    state.setAttribute('role', 'status')
    state.setAttribute('aria-live', 'polite')
    const actions = document.createElement('div')
    actions.className = 'contentWorkflowActions'
    copy.append(label, state, status)
    actions.append(saveButton, publishButton)
    bar.append(copy, actions)
    fields.after(bar)

    saveButton.textContent = 'Save draft'
    publishButton.textContent = 'Save & publish'
    publishButton.title = 'Save these edits as a draft, then publish them to the live website.'

    let dirty = false
    let busy = false

    function activeKey() {
      return tabs.querySelector('[data-key].active')?.dataset.key || ''
    }

    function updateLabel() {
      const active = tabs.querySelector('[data-key].active')
      label.textContent = active ? `${active.textContent.trim()} — content actions` : 'Content actions'
    }

    async function refreshSavedState() {
      const key = activeKey()
      updateLabel()
      state.classList.remove('status', 'error')
      if (!key) return
      if (dirty) {
        state.textContent = 'Unsaved edits. Save as a draft or publish to update the live website.'
        return
      }
      state.textContent = 'Checking saved and published versions…'
      try {
        const response = await fetch('/api/admin/content', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) {
          const message = typeof data.error === 'string'
            ? data.error
            : data.error?.message || `Could not check section status (${response.status})`
          throw new Error(message)
        }
        if (key !== activeKey()) return
        const saved = (data.items || []).find((item) => item.content_key === key)
        if (!saved) {
          state.textContent = 'No saved draft yet. Save a draft before publishing.'
          return
        }
        const matchesLive = saved.published === true &&
          JSON.stringify(saved.content || {}) === JSON.stringify(saved.published_content || {})
        state.textContent = matchesLive
          ? 'Published and live. Draft matches the version visitors see.'
          : 'Draft differs from the live version. Saving keeps it private; choose “Save & publish” to make it live.'
      } catch (error) {
        state.textContent = `Could not verify database status: ${error.message}`
        state.classList.add('status', 'error')
      }
    }

    function confirmDiscard() {
      if (!dirty) return true
      const discard = window.confirm('This section has unsaved edits. Discard them and continue?')
      if (discard) {
        dirty = false
        refreshSavedState()
      }
      return discard
    }

    document.addEventListener('input', (event) => {
      if (!fields.contains(event.target)) return
      dirty = true
      state.classList.remove('status', 'error')
      updateLabel()
      state.textContent = 'Unsaved edits. Save as a draft or publish to update the live website.'
    }, true)
    document.addEventListener('change', (event) => {
      if (!fields.contains(event.target)) return
      dirty = true
      state.classList.remove('status', 'error')
      updateLabel()
      state.textContent = 'Unsaved edits. Save as a draft or publish to update the live website.'
    }, true)

    tabs.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-key]') : null
      if (target && !confirmDiscard()) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      window.setTimeout(refreshSavedState, 0)
    }, true)

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target.closest('[data-view], [data-go]') : null
      if (!target) return
      const editorNavigation = target.matches('[data-view], [data-go]')
      if (dirty && editorNavigation && !confirmDiscard()) {
        event.preventDefault()
        event.stopImmediatePropagation()
        return
      }
      if (target.dataset.view === 'pages' || target.dataset.go === 'pages') {
        window.setTimeout(refreshSavedState, 0)
      }
    }, true)

    window.addEventListener('beforeunload', (event) => {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    })

    const saveDraft = saveButton.onclick
    const publishDraft = publishButton.onclick
    saveButton.onclick = async (event) => {
      if (busy || !saveDraft) return
      busy = true
      saveButton.disabled = true
      publishButton.disabled = true
      state.classList.remove('status', 'error')
      state.textContent = 'Saving draft to the database…'
      try {
        await saveDraft.call(saveButton, event)
        if (status.classList.contains('error')) {
          state.textContent = status.textContent || 'Draft could not be saved.'
          state.classList.add('status', 'error')
          return
        }
        dirty = false
        await refreshSavedState()
      } catch (error) {
        state.textContent = `Draft could not be saved: ${error.message}`
        state.classList.add('status', 'error')
      } finally {
        busy = false
        saveButton.disabled = false
        publishButton.disabled = false
      }
    }
    publishButton.onclick = async (event) => {
      if (busy || !saveDraft || !publishDraft) return
      busy = true
      saveButton.disabled = true
      publishButton.disabled = true
      state.classList.remove('status', 'error')
      state.textContent = 'Saving your edits, then publishing to the live website…'
      try {
        if (activeKey() === 'testimonials') {
          await publishDraft.call(publishButton, event)
        } else {
          await saveDraft.call(saveButton, event)
          if (status.classList.contains('error')) {
            state.textContent = status.textContent || 'Draft could not be saved; nothing was published.'
            state.classList.add('status', 'error')
            return
          }
          dirty = false
          await publishDraft.call(publishButton, event)
        }
        if (status.classList.contains('error')) {
          state.textContent = status.textContent || 'Draft saved, but publication failed.'
          state.classList.add('status', 'error')
          return
        }
        dirty = false
        const response = await fetch('/api/admin/content', { cache: 'no-store' })
        const data = await response.json()
        if (!response.ok) throw new Error(`Publish verification failed (${response.status})`)
        const saved = (data.items || []).find((item) => item.content_key === activeKey())
        if (!saved || saved.published !== true ||
            JSON.stringify(saved.content || {}) !== JSON.stringify(saved.published_content || {})) {
          throw new Error('The database did not confirm that the saved draft is live.')
        }
        status.textContent = 'Saved and published successfully.'
        status.className = 'status'
        const preview = document.getElementById('sitePreview')
        if (preview) preview.src = `/?admin_preview=${Date.now()}`
        await refreshSavedState()
      } catch (error) {
        state.textContent = `Publish could not be verified: ${error.message}`
        state.classList.add('status', 'error')
      } finally {
        busy = false
        saveButton.disabled = false
        publishButton.disabled = false
      }
    }

    refreshSavedState()
  }

  installRepeatableContentEditors()
  setupContentWorkflow()

  function pinAdditionalSaveActions() {
    const actions = [
      ['saveSettings', 'settingsStatus', 'Website settings', 'Changes publish immediately to the public website.', 'Save & publish settings'],
      ['saveLayout', 'layoutStatus', 'Section visibility', 'Selected sections are published as soon as you save.', 'Save & publish layout'],
    ]
    for (const [buttonId, statusId, title, description, buttonText] of actions) {
      const button = document.getElementById(buttonId)
      const status = document.getElementById(statusId)
      if (!button || !status) continue
      const bar = document.createElement('div')
      bar.className = 'contentWorkflowBar'
      bar.setAttribute('role', 'region')
      bar.setAttribute('aria-label', `${title} actions`)
      status.parentElement.insertBefore(bar, status.nextSibling)
      const copy = document.createElement('div')
      copy.className = 'contentWorkflowCopy'
      const heading = document.createElement('strong')
      heading.textContent = title
      const hint = document.createElement('p')
      hint.textContent = description
      const controls = document.createElement('div')
      controls.className = 'contentWorkflowActions'
      button.textContent = buttonText
      copy.append(heading, hint, status)
      controls.appendChild(button)
      bar.append(copy, controls)
    }
  }

  pinAdditionalSaveActions()
})()
