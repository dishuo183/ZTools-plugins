import { fullToDouble, matchesPinyinCached, type PinyinScheme, type PinyinCache, type DoubleSchemeName } from './pinyin-schemes'

export { PINYIN_SCHEMES, fullToDouble, matchesPinyinCached, type PinyinScheme, type PinyinCache } from './pinyin-schemes'

export async function matchesPinyin(name: string, query: string, scheme: PinyinScheme): Promise<boolean> {
  if (!name || !query) return false
  const q = query.toLowerCase()
  if (name.toLowerCase().includes(q)) return true

  const { pinyin } = await import('pinyin-pro')
  const syllables = pinyin(name, { toneType: 'none', type: 'array' }) as string[]

  if (syllables.join('').includes(q)) return true
  if (syllables.map(s => s[0]).join('').includes(q)) return true
  if (scheme !== 'quanpin') {
    const dp = syllables.map(s => fullToDouble(s, scheme as DoubleSchemeName)).join('')
    if (dp.includes(q)) return true
  }
  return false
}

export async function buildPinyinCache(name: string): Promise<PinyinCache> {
  const { pinyin } = await import('pinyin-pro')
  const syllables = pinyin(name, { toneType: 'none', type: 'array' }) as string[]
  const full = syllables.join('')
  const initials = syllables.map(s => s[0]).join('')
  const double: Partial<Record<DoubleSchemeName, string>> = {}
  for (const scheme of ['ziranma', 'xiaohe', 'pinyinjiajia', 'microsoft', 'sogou'] as DoubleSchemeName[]) {
    double[scheme] = syllables.map(s => fullToDouble(s, scheme)).join('')
  }
  return { full, initials, double }
}
