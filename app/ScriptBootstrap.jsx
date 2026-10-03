'use client'

import { useEffect } from 'react'

export default function ScriptBootstrap({ scripts, bodyAttributes }) {
  useEffect(() => {
    for (const [name, value] of Object.entries(bodyAttributes)) {
      document.body.setAttribute(name === 'class' ? 'class' : name, value)
    }

    for (const { code, type } of scripts) {
      const script = document.createElement('script')
      if (type) script.type = type
      script.textContent = code
      document.body.appendChild(script)
    }
  }, [scripts, bodyAttributes])

  return null
}
