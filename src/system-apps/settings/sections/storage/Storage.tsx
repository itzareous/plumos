import { Group, Page } from '../../ui/Page'
import { DriveList } from './DriveList'
import { PoolModeCard } from './PoolModeCard'
import { PoolOverview } from './PoolOverview'

export function Storage() {
  return (
    <Page title="Storage" description="All the drives in your server work together as one storage pool.">
      <PoolOverview />
      <Group title="Pool mode">
        <PoolModeCard />
      </Group>
      <DriveList />
    </Page>
  )
}
