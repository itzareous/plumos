/** The guest's demo home folder, shared by the Files app and the terminal. */
export interface FsNode {
  name: string
  type: 'dir' | 'file'
  children?: FsNode[]
  content?: string
  /** Bytes. */
  size?: number
  modified: string
}

const dir = (name: string, children: FsNode[], modified = 'Sep 21'): FsNode => ({ name, type: 'dir', children, modified })
const file = (name: string, size: number, modified: string, content?: string): FsNode => ({
  name,
  type: 'file',
  size: content ? new TextEncoder().encode(content).length : size,
  modified,
  content,
})

const RECEIPTS = `Receipts for 2025 taxes
=======================

Jan 14  Office chair (home office)        $189.00
Feb 02  Laptop repair                     $120.00
Mar 19  Internet, Q1 (50% business)       $105.00
Apr 30  Charity: food bank                $250.00
Jun 11  Printer ink and paper              $64.20
Jul 08  Internet, Q2 (50% business)       $105.00
Aug 22  Conference ticket                 $299.00
Oct 03  Internet, Q3 (50% business)       $105.00
Nov 28  Charity: animal shelter           $150.00

Total deductible                         $1,387.20

Originals are scanned in Pictures/Scans.
Ask Priya whether the conference counts.`

const WELCOME = `Welcome to your virtual PC!

This computer runs on your Plumos home server, so it stays
on even when you close the browser tab.

Things to try:
- Open the launcher from the taskbar
- Drag windows around by their title bar
- Let an agent drive and watch its cursor`

const TODO = `# This week

- [x] Back up the family photos
- [ ] Renew the car insurance
- [ ] Book a dentist appointment
- [ ] Fix the garden gate
`

const SOUP = `Lentil soup (serves 4)

1 onion, 2 carrots, 2 celery sticks
200 g red lentils
1 tin chopped tomatoes
1 litre vegetable stock
1 tsp cumin, 1 lemon

Soften the veg, add everything else,
simmer 25 minutes, blend half, squeeze in the lemon.`

const BUDGET = `Household budget, 2026

Rent / mortgage     1,450
Groceries             520
Utilities             190
Transport             160
Savings               400
Fun                   150
`

export const FS: FsNode = dir('guest', [
  dir('Desktop', [file('Welcome.txt', 0, 'Sep 20', WELCOME)]),
  dir('Documents', [
    dir('Taxes 2025', [
      file('receipts.txt', 0, 'Sep 12', RECEIPTS),
      file('checklist.txt', 0, 'Sep 10', 'Tax checklist\n\n- Income statements\n- Receipts\n- Bank interest\n- Charity letters\n'),
      file('statement-scan.pdf', 1_830_000, 'Aug 30'),
    ]),
    dir('Recipes', [
      file('lentil-soup.txt', 0, 'Sep 02', SOUP),
      file('banana-bread.txt', 0, 'Jul 18', 'Banana bread\n\n3 ripe bananas, 75 g butter, 150 g sugar,\n1 egg, 1 tsp soda, 190 g flour.\n\n175°C for 55 minutes.'),
    ]),
    file('Budget 2026.txt', 0, 'Sep 18', BUDGET),
    file('Letter to landlord.txt', 0, 'Aug 04', 'Hi Sam,\n\nThe kitchen tap has started dripping again. Could someone take a look this week?\n\nThanks,\nAlex'),
    file('Resume.pdf', 214_000, 'Jun 21'),
  ]),
  dir('Downloads', [
    file('holiday-itinerary.pdf', 486_000, 'Sep 24'),
    file('invoice-0142.pdf', 92_000, 'Sep 23'),
    file('dunes-wallpaper.jpg', 3_200_000, 'Sep 19'),
    file('driver-setup.zip', 48_700_000, 'Sep 15'),
    file('meeting-notes.txt', 0, 'Sep 25', 'Planning call\n\n- Launch moved to October\n- Priya owns the checklist\n- Next sync Thursday'),
  ]),
  dir('Pictures', [
    dir('Screenshots', [file('Screenshot 09-12.png', 820_000, 'Sep 12'), file('Screenshot 09-20.png', 760_000, 'Sep 20')]),
    dir('Scans', [file('receipt-chair.jpg', 1_100_000, 'Jan 14')]),
    file('beach-day.jpg', 4_100_000, 'Aug 09'),
    file('birthday-cake.jpg', 3_600_000, 'Jul 27'),
    file('garden.jpg', 2_900_000, 'May 30'),
  ]),
  dir('Music', [file('Morning playlist.m3u', 2_000, 'Apr 02'), file('voice-memo.m4a', 1_400_000, 'Sep 01')]),
  dir('projects', [dir('website', [file('README.md', 0, 'Sep 14', '# website\n\nOur family site. Run `npm start`.\n')]), file('todo.md', 0, 'Sep 26', TODO)]),
])

export const HOME_PATH = '/home/guest'

/** Finds a node by path relative to the home folder, e.g. "Documents/Taxes 2025". */
export function nodeAt(path: string): FsNode | null {
  const parts = path.split('/').filter(Boolean)
  let cur: FsNode = FS
  for (const p of parts) {
    const next = cur.children?.find((c) => c.name === p)
    if (!next) return null
    cur = next
  }
  return cur
}

export const isText = (name: string) => /\.(txt|md|m3u|csv|log)$/i.test(name)
