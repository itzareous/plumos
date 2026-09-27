/** Made-up web content for the guests' browsers. Every site lives under the reserved .example domain. */

export type WebPage = { kind: 'home' } | { kind: 'results'; q: string } | { kind: 'article'; q: string; i: number }

export interface Result {
  site: string
  url: string
  title: string
  snippet: string
}

type Topic = 'recipe' | 'travel' | 'weather' | 'general'

export function topicOf(q: string): Topic {
  const s = q.toLowerCase()
  if (/recipe|soup|bread|cook|bake|dinner|salad|pasta|curry|cake|lunch/.test(s)) return 'recipe'
  if (/trip|travel|flight|hotel|visit|holiday|vacation|beach/.test(s)) return 'travel'
  if (/weather|forecast|rain|temperature/.test(s)) return 'weather'
  return 'general'
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export function results(q: string): Result[] {
  const Q = cap(q.trim())
  const s = slug(q)
  const byTopic: Record<Topic, [string, string, string][]> = {
    recipe: [
      ['kitchen.example', `${Q} — ready in 30 minutes`, 'A cosy, budget-friendly version with pantry staples. Step-by-step photos and tips for making it ahead.'],
      ['homecook.example', `The only ${q} guide you'll need`, 'We tested eleven versions side by side. Here is what actually makes a difference, and what you can skip.'],
      ['forum.example', `What's your go-to ${q}? (312 replies)`, 'I add smoked paprika and a squeeze of lemon at the end. Game changer. Also: blend only half of it.'],
      ['video.example', `${Q} for beginners · 8:41`, 'Watch a home cook make it start to finish, with a shopping list in the description.'],
      ['nutrition.example', `${Q}: nutrition facts per serving`, 'Calories, protein, fibre and a few easy swaps to make it lighter or more filling.'],
    ],
    travel: [
      ['guides.example', `${Q}: a local's three-day plan`, 'Where to stay, what to skip and the small places worth the detour. Updated for this season.'],
      ['forum.example', `Tips for ${q}? (88 replies)`, 'Go early in the morning, book the train in advance and bring a light jacket for the evenings.'],
      ['maps.example', `${Q} — map and directions`, 'Opening hours, transit options and walking routes between the main sights.'],
      ['stays.example', `Where to stay: ${q}`, 'Quiet neighbourhoods, family-friendly rentals and what each area is like at night.'],
      ['video.example', `${Q} in 60 seconds · 1:02`, 'A quick visual tour to help you decide if it is the right trip for you.'],
    ],
    weather: [
      ['sky.example', `${Q} — hourly and 10-day`, 'Mild and bright this afternoon, clouds building tonight. Light rain likely on Thursday.'],
      ['radar.example', `Live rain radar`, 'Watch showers move across your area in real time, with alerts for your neighbourhood.'],
      ['forum.example', `Is it going to rain this weekend? (41 replies)`, 'Saturday looks fine until about four. Sunday is a coin toss, bring an umbrella.'],
      ['sky.example', `Pollen and air quality`, 'Low pollen today. Air quality is good for outdoor exercise.'],
    ],
    general: [
      ['wiki.example', `${Q} — overview`, `Everything you need to know about ${q}, from the basics to the details, written and checked by volunteers.`],
      ['howto.example', `${Q}: a beginner's guide`, 'Clear explanations with pictures, common mistakes and a short checklist to get started.'],
      ['forum.example', `Anyone have experience with ${q}? (129 replies)`, 'Honestly it was easier than I expected. Take it one step at a time and ask questions.'],
      ['news.example', `The latest on ${q}`, 'What changed this week and why people are talking about it, in a two-minute read.'],
      ['video.example', `${Q} explained · 6:18`, 'A friendly walkthrough with examples you can follow along with at home.'],
    ],
  }
  return byTopic[topicOf(q)].map(([site, title, snippet]) => ({
    site,
    url: `https://${site}/${s}`,
    title,
    snippet,
  }))
}

export interface Article {
  site: string
  title: string
  byline: string
  intro: string
  listTitle: string
  list: string[]
  sections: { heading: string; body: string }[]
}

export function article(q: string, i: number): Article {
  const r = results(q)[i] ?? results(q)[0]
  const topic = topicOf(q)
  const common = { site: r.site, title: r.title, byline: 'By Robin Hale · 6 min read · Updated this week' }
  if (topic === 'recipe') {
    return {
      ...common,
      intro: `This is the ${q} we make on busy weeknights: one pot, cheap ingredients and it tastes even better the next day.`,
      listTitle: 'What you need',
      list: ['1 onion, 2 carrots, 2 celery sticks', '200 g red lentils, rinsed', '1 tin chopped tomatoes', '1 litre vegetable stock', '1 tsp cumin and a pinch of chilli', '1 lemon and a handful of parsley'],
      sections: [
        { heading: '1. Soften the vegetables', body: 'Chop everything small and cook it gently in a little oil for eight minutes, until sweet and soft but not brown.' },
        { heading: '2. Simmer', body: 'Stir in the spices for a minute, then add the lentils, tomatoes and stock. Simmer for 25 minutes, stirring now and then.' },
        { heading: '3. Finish', body: 'Blend about half of it for a creamy texture, then season well and squeeze in the lemon. Top with parsley.' },
        { heading: 'Make ahead', body: 'It keeps for four days in the fridge and freezes well. Add a splash of water when reheating.' },
      ],
    }
  }
  if (topic === 'travel') {
    return {
      ...common,
      intro: `Planning ${q}? Here is a relaxed plan that leaves room for wandering, long lunches and the odd rainy afternoon.`,
      listTitle: 'Pack these',
      list: ['Comfortable walking shoes', 'A light rain jacket', 'Reusable water bottle', 'Offline maps on your phone', 'A small day bag'],
      sections: [
        { heading: 'Day one', body: 'Start with the old town on foot. Stop for coffee by the river and save the museum for the afternoon.' },
        { heading: 'Day two', body: 'Take the early train to the coast, walk the cliff path and eat at the harbour before heading back.' },
        { heading: 'Day three', body: 'Markets in the morning, a slow lunch and time to pick up something small to bring home.' },
      ],
    }
  }
  return {
    ...common,
    intro: `A short, friendly introduction to ${q}. No jargon, just the parts that matter when you are getting started.`,
    listTitle: 'Key points',
    list: ['Start with the basics and build from there', 'Keep notes as you go', 'Ask for help early', 'Small steps add up quickly'],
    sections: [
      { heading: 'Why it matters', body: 'Most people find that a little background makes everything else click. Take ten minutes for this part.' },
      { heading: 'Getting started', body: 'Pick one small goal for this week. Write it down, and check back in on Friday to see how it went.' },
      { heading: 'Going further', body: 'Once the basics feel easy, look for a local group or an online forum. Learning with others is more fun.' },
    ],
  }
}

export const urlOf = (page: WebPage) =>
  page.kind === 'home'
    ? 'wander.example'
    : page.kind === 'results'
      ? `wander.example/search?q=${encodeURIComponent(page.q).replace(/%20/g, '+')}`
      : results(page.q)[page.i]?.url.replace('https://', '') ?? 'wander.example'

export const titleOf = (page: WebPage) =>
  page.kind === 'home' ? 'Wander' : page.kind === 'results' ? `${page.q} - Wander` : article(page.q, page.i).title

/** Turns whatever was typed in the address bar into a page. */
export function navigate(input: string): WebPage {
  const text = input.trim()
  if (!text || /^(https?:\/\/)?wander\.example\/?$/i.test(text)) return { kind: 'home' }
  const m = text.match(/[?&]q=([^&]+)/)
  if (m) return { kind: 'results', q: decodeURIComponent(m[1].replace(/\+/g, ' ')) }
  return { kind: 'results', q: text }
}
