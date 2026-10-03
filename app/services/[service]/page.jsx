import { notFound } from 'next/navigation'
import HtmlPage, { getTemplateMetadata, getTemplateViewport } from '../../HtmlPage'

const services = [
  'website-design',
  'custom-software',
  'ai-automation',
  'seo-visibility',
]

export function generateStaticParams() {
  return services.map((service) => ({ service }))
}

export async function generateMetadata({ params }) {
  const { service } = await params
  if (!services.includes(service)) notFound()
  return getTemplateMetadata(`services/${service}.html`)
}

export async function generateViewport({ params }) {
  const { service } = await params
  if (!services.includes(service)) notFound()
  return getTemplateViewport(`services/${service}.html`)
}

export default async function ServicePage({ params }) {
  const { service } = await params
  if (!services.includes(service)) notFound()
  return <HtmlPage template={`services/${service}.html`} className="service-page" />
}
