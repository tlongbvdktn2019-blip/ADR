import { describe, expect, it } from 'vitest'
import {
  PatientAgeError,
  calculatePatientAgeAtDate,
  calculateReportPatientAgeYears,
  calculateValidatedPatientAge,
  formatPatientAge,
  getDateInTimeZone,
  getPatientAgeLabel,
  validateAdrOccurrenceDateNotFuture,
} from './patient-age'

describe('calculatePatientAgeAtDate', () => {
  it('calculates completed years before, on, and after the birthday', () => {
    expect(calculatePatientAgeAtDate('2000-09-13', '2026-09-12').years).toBe(25)
    expect(calculatePatientAgeAtDate('2000-09-13', '2026-09-13').years).toBe(26)
    expect(calculatePatientAgeAtDate('2000-09-13', '2026-09-14').years).toBe(26)
  })

  it('uses February 28 as the anniversary of February 29 in non-leap years', () => {
    expect(calculatePatientAgeAtDate('2000-02-29', '2021-02-27').years).toBe(20)
    expect(calculatePatientAgeAtDate('2000-02-29', '2021-02-28').years).toBe(21)
  })

  it('calculates completed calendar months for infants', () => {
    expect(calculatePatientAgeAtDate('2024-01-31', '2024-02-29')).toEqual({
      years: 0,
      displayValue: 1,
      displayUnit: 'month',
    })
    expect(calculatePatientAgeAtDate('2024-01-31', '2024-03-30')).toEqual({
      years: 0,
      displayValue: 1,
      displayUnit: 'month',
    })
  })

  it('calculates days for infants under one completed month', () => {
    expect(calculatePatientAgeAtDate('2024-01-31', '2024-02-28')).toEqual({
      years: 0,
      displayValue: 28,
      displayUnit: 'day',
    })
  })

  it('switches from months to years at the first birthday', () => {
    expect(formatPatientAge(calculatePatientAgeAtDate('2025-09-13', '2026-09-12'))).toBe(
      '11 tháng tuổi'
    )
    expect(formatPatientAge(calculatePatientAgeAtDate('2025-09-13', '2026-09-13'))).toBe(
      '1 tuổi'
    )
  })

  it('accepts ADR on the birth date as zero days old', () => {
    expect(formatPatientAge(calculatePatientAgeAtDate('2026-09-12', '2026-09-12'))).toBe(
      '0 ngày tuổi'
    )
  })

  it.each(['2024-02-30', '2024-13-01', '12/09/2024', '']) (
    'rejects invalid date %s',
    (value) => {
      expect(() => calculatePatientAgeAtDate(value, '2026-09-12')).toThrowError(
        new PatientAgeError('INVALID_DATE')
      )
    }
  )

  it('rejects a birth date after the ADR date', () => {
    expect(() => calculatePatientAgeAtDate('2026-09-13', '2026-09-12')).toThrowError(
      new PatientAgeError('BIRTH_AFTER_REFERENCE')
    )
  })

  it('allows 150 completed years and rejects 151', () => {
    expect(calculatePatientAgeAtDate('1876-09-12', '2026-09-12').years).toBe(150)
    expect(() => calculatePatientAgeAtDate('1875-09-12', '2026-09-12')).toThrowError(
      new PatientAgeError('AGE_OVER_150')
    )
  })
})

describe('validation and formatting helpers', () => {
  it('validates future ADR dates against an injected current date', () => {
    expect(() => validateAdrOccurrenceDateNotFuture('2026-09-13', '2026-09-12')).toThrowError(
      new PatientAgeError('REFERENCE_IN_FUTURE')
    )
    expect(() => validateAdrOccurrenceDateNotFuture('2026-09-12', '2026-09-12')).not.toThrow()
  })

  it('calculates a fully validated age', () => {
    expect(calculateValidatedPatientAge('2000-09-13', '2026-09-12', '2026-09-12').years).toBe(25)
  })

  it('derives report age from dates and ignores a client-provided age', () => {
    expect(
      calculateReportPatientAgeYears(
        {
          patient_birth_date: '2026-01-31',
          adr_occurrence_date: '2026-02-28',
          patient_age: 99,
        },
        '2026-09-12'
      )
    ).toBe(0)
  })

  it('returns a safe label for invalid historical dates', () => {
    expect(getPatientAgeLabel('2026-09-13', '2026-09-12')).toBe(
      'Không xác định — dữ liệu ngày không hợp lệ'
    )
  })

  it('gets the calendar date in Vietnam rather than UTC', () => {
    const instant = new Date('2026-09-11T18:00:00.000Z')
    expect(getDateInTimeZone(instant)).toBe('2026-09-12')
  })
})
