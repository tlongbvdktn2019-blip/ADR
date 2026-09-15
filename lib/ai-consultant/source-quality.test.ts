import { describe, expect, it } from 'vitest'
import { getSourceQualityTier, normalizeDomain } from './source-quality'

describe('AI evidence source quality', () => {
  it('normalizes and ranks controlled domains', () => {
    expect(normalizeDomain('https://www.who.int/publications/example')).toBe('who.int')
    expect(getSourceQualityTier('https://www.who.int/publications/example')).toBe(1)
    expect(getSourceQualityTier('https://pubmed.ncbi.nlm.nih.gov/123')).toBe(2)
    expect(getSourceQualityTier('https://unknown.example/article')).toBe(4)
  })
})
