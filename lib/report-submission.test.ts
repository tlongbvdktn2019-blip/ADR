import { describe, expect, it } from 'vitest'
import { REPORT_SUBMISSION_STATUS } from './report-submission'

describe('report submission workflow', () => {
  it('marks a submitted report as valid immediately', () => {
    expect(REPORT_SUBMISSION_STATUS).toBe('approved')
  })
})
