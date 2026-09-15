const TIER_ONE_DOMAINS = [
  'who.int',
  'fda.gov',
  'ema.europa.eu',
  'moh.gov.vn',
  'dav.gov.vn',
  'gov.uk',
]

const TIER_TWO_DOMAINS = [
  'pubmed.ncbi.nlm.nih.gov',
  'ncbi.nlm.nih.gov',
  'cochranelibrary.com',
  'bmj.com',
  'thelancet.com',
  'nejm.org',
  'jamanetwork.com',
]

const TIER_THREE_DOMAINS = [
  'medlineplus.gov',
  'msdmanuals.com',
  'drugs.com',
]

export function normalizeDomain(url: string) {
  try {
    return new URL(url).hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}
function matchesDomain(domain: string, allowed: string[]) {
  return allowed.some((item) => domain === item || domain.endsWith(`.${item}`))
}

export function getSourceQualityTier(url: string): 1 | 2 | 3 | 4 {
  const domain = normalizeDomain(url)
  if (matchesDomain(domain, TIER_ONE_DOMAINS)) return 1
  if (matchesDomain(domain, TIER_TWO_DOMAINS)) return 2
  if (matchesDomain(domain, TIER_THREE_DOMAINS)) return 3
  return 4
}
