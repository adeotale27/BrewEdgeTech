import HtmlPage, { getTemplateMetadata, getTemplateViewport } from './HtmlPage'

export async function generateMetadata() {
  return getTemplateMetadata('site.html')
}

export async function generateViewport() {
  return getTemplateViewport('site.html')
}

export default function Page() {
  return <HtmlPage template="site.html" className="marketing-page" />
}
