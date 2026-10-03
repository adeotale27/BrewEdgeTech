import fs from 'node:fs/promises'
import path from 'node:path'
import parse from 'html-react-parser'
import ScriptBootstrap from './ScriptBootstrap'

const TEMPLATE_ROOT = path.join(process.cwd(), 'app', 'templates')

export async function readHtmlTemplate(template) {
  return fs.readFile(path.join(TEMPLATE_ROOT, template), 'utf8')
}

function readAttribute(attributes, name) {
  const match = attributes.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'))
  return match?.[1] ?? match?.[2] ?? match?.[3] ?? ''
}

function metadataFromSource(source) {
  const head = source.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''
  const title = head.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim()
  const descriptionTag = head.match(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>/i)?.[0] || ''
  const canonicalTag = head.match(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>/i)?.[0] || ''
  const robotsTag = head.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*>/i)?.[0] || ''

  const metadata = {}
  if (title) metadata.title = title.replace(/<[^>]+>/g, '')

  const description = readAttribute(descriptionTag, 'content')
  if (description) metadata.description = description

  const canonical = readAttribute(canonicalTag, 'href')
  if (canonical) metadata.alternates = { canonical }

  if (robotsTag) {
    const robots = readAttribute(robotsTag, 'content').toLowerCase()
    metadata.robots = {
      index: !robots.includes('noindex'),
      follow: !robots.includes('nofollow'),
    }
  }

  return metadata
}

export async function getTemplateMetadata(template) {
  return metadataFromSource(await readHtmlTemplate(template))
}

export async function getTemplateViewport(template) {
  const source = await readHtmlTemplate(template)
  const head = source.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''
  const themeColorTag = head.match(/<meta\b(?=[^>]*\bname=["']theme-color["'])[^>]*>/i)?.[0] || ''
  const themeColor = readAttribute(themeColorTag, 'content')
  return themeColor ? { themeColor } : {}
}

function readBodyAttributes(source) {
  const attributes = source.match(/<body\b([^>]*)>/i)?.[1] || ''
  return Object.fromEntries(
    [...attributes.matchAll(/([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)]
      .map((match) => [match[1].toLowerCase(), match[2] ?? match[3] ?? match[4] ?? ''])
  )
}

function renderableSource(source) {
  const head = source.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''
  const body = source.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]
  if (body === undefined) throw new Error('Page template is missing its body element.')

  const scripts = []
  const structuredData = []
  const bodyContent = body.replace(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi, (script, attributes, code) => {
    if (readAttribute(attributes, 'type').toLowerCase() === 'application/ld+json') {
      structuredData.push(code)
    } else {
      scripts.push({
        code,
        type: readAttribute(attributes, 'type'),
      })
    }
    return ''
  })
  for (const match of head.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    if (readAttribute(match[1], 'type').toLowerCase() === 'application/ld+json') {
      structuredData.push(match[2])
    } else {
      scripts.unshift({
        code: match[2],
        type: readAttribute(match[1], 'type'),
      })
    }
  }

  const headStyles = [
    ...head.matchAll(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi),
    ...head.matchAll(/<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*>/gi),
  ].map(([element]) => element).join('\n')

  return {
    markup: parse(`${headStyles}\n${bodyContent}`),
    scripts,
    structuredData,
    bodyAttributes: readBodyAttributes(source),
  }
}

export default async function HtmlPage({ template, className }) {
  const source = await readHtmlTemplate(template)
  const { markup, scripts, structuredData, bodyAttributes } = renderableSource(source)

  return (
    <>
      <main className={className}>{markup}</main>
      {structuredData.map((data, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: data.replace(/</g, '\\u003c') }}
        />
      ))}
      <ScriptBootstrap scripts={scripts} bodyAttributes={bodyAttributes} />
    </>
  )
}
