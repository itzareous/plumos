import { Contrast, Thermometer } from 'lucide-react'
import { findWallpaper } from '@/lib/wallpapers'
import { Card, Row, Segmented, Switch } from '@/components/ui/controls'
import { useSettings } from '@/stores/settings'
import { Group, Page } from '../../ui/Page'
import { WallpaperPicker } from './WallpaperPicker'

export function Appearance() {
  const wallpaper = useSettings((s) => s.wallpaper)
  const unit = useSettings((s) => s.temperatureUnit)
  const reduceTransparency = useSettings((s) => s.reduceTransparency)
  const set = useSettings((s) => s.set)
  const accent = findWallpaper(wallpaper).accent

  return (
    <Page title="Appearance">
      <Group
        title="Wallpaper"
        footer={
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full ring-1 ring-white/20" style={{ background: accent }} />
            The accent colour follows your wallpaper.
          </span>
        }
      >
        <WallpaperPicker />
      </Group>

      <Group title="Display">
        <Card>
          <Row icon={<Thermometer size={16} />} title="Temperature" description="Used for CPU and drive temperatures.">
            <Segmented
              value={unit}
              onChange={(temperatureUnit) => set({ temperatureUnit })}
              options={[
                { value: 'c', label: '°C' },
                { value: 'f', label: '°F' },
              ]}
            />
          </Row>
          <Row icon={<Contrast size={16} />} title="Reduce transparency" description="Makes panels solid for easier reading.">
            <Switch checked={reduceTransparency} onChange={(v) => set({ reduceTransparency: v })} label="Reduce transparency" />
          </Row>
        </Card>
      </Group>
    </Page>
  )
}
