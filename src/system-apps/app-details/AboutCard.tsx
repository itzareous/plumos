import { Code2, FolderDown, Hash, Package, Tag } from 'lucide-react'
import { categoryLabels, type AppInfo } from '@/apps/types'
import { Card, Row, SectionTitle } from '@/components/ui/controls'
import { formatBytes } from '@/lib/format'

export function AboutCard({ app }: { app: AppInfo }) {
  const value = (v: string) => <span className="max-w-[55%] truncate text-sm text-white/70 tabular-nums">{v}</span>
  return (
    <section>
      <SectionTitle>About</SectionTitle>
      <Card>
        <Row icon={<Package size={16} />} title="Version">
          {value(app.version)}
        </Row>
        <Row icon={<Code2 size={16} />} title="Developer">
          {value(app.developer)}
        </Row>
        <Row icon={<Tag size={16} />} title="Category">
          {value(categoryLabels[app.category])}
        </Row>
        {app.size && (
          <Row icon={<FolderDown size={16} />} title="Install size">
            {value(formatBytes(app.size))}
          </Row>
        )}
        {app.port && (
          <Row icon={<Hash size={16} />} title="Port">
            {value(String(app.port))}
          </Row>
        )}
      </Card>
    </section>
  )
}
