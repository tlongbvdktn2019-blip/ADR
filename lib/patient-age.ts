export type PatientAgeUnit = 'year' | 'month' | 'day'

export type PatientAgeErrorCode =
  | 'INVALID_DATE'
  | 'BIRTH_AFTER_REFERENCE'
  | 'REFERENCE_IN_FUTURE'
  | 'AGE_OVER_150'

export interface PatientAgeResult {
  years: number
  displayValue: number
  displayUnit: PatientAgeUnit
}

export interface ReportPatientAgeInput {
  patient_birth_date: string
  adr_occurrence_date: string
  patient_age?: unknown
}

interface DateParts {
  year: number
  month: number
  day: number
}

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const ERROR_MESSAGES: Record<PatientAgeErrorCode, string> = {
  INVALID_DATE: 'Ngày sinh hoặc ngày xảy ra ADR không hợp lệ.',
  BIRTH_AFTER_REFERENCE: 'Ngày sinh không được nằm sau ngày xảy ra ADR.',
  REFERENCE_IN_FUTURE: 'Ngày xảy ra ADR không được nằm trong tương lai.',
  AGE_OVER_150: 'Tuổi bệnh nhân tại ngày xảy ra ADR không được vượt quá 150.',
}

export class PatientAgeError extends Error {
  constructor(public readonly code: PatientAgeErrorCode) {
    super(ERROR_MESSAGES[code])
    this.name = 'PatientAgeError'
  }
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
    return isLeapYear ? 29 : 28
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

function parseDateOnly(value: string): DateParts {
  const match = DATE_ONLY_PATTERN.exec(value)
  if (!match) {
    throw new PatientAgeError('INVALID_DATE')
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (
    year < 1 ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > daysInMonth(year, month)
  ) {
    throw new PatientAgeError('INVALID_DATE')
  }

  return { year, month, day }
}

function compareDates(left: DateParts, right: DateParts): number {
  if (left.year !== right.year) return left.year - right.year
  if (left.month !== right.month) return left.month - right.month
  return left.day - right.day
}

function anniversaryInYear(date: DateParts, year: number): DateParts {
  return {
    year,
    month: date.month,
    day: Math.min(date.day, daysInMonth(year, date.month)),
  }
}

function anniversaryAfterMonths(date: DateParts, months: number): DateParts {
  const zeroBasedMonth = date.month - 1 + months
  const year = date.year + Math.floor(zeroBasedMonth / 12)
  const month = (zeroBasedMonth % 12) + 1

  return {
    year,
    month,
    day: Math.min(date.day, daysInMonth(year, month)),
  }
}

function toUtcTimestamp(date: DateParts): number {
  const result = new Date(0)
  result.setUTCHours(0, 0, 0, 0)
  result.setUTCFullYear(date.year, date.month - 1, date.day)
  return result.getTime()
}

function differenceInCalendarDays(start: DateParts, end: DateParts): number {
  return Math.round((toUtcTimestamp(end) - toUtcTimestamp(start)) / MILLISECONDS_PER_DAY)
}

export function calculatePatientAgeAtDate(
  birthDateValue: string,
  referenceDateValue: string
): PatientAgeResult {
  const birthDate = parseDateOnly(birthDateValue)
  const referenceDate = parseDateOnly(referenceDateValue)

  if (compareDates(birthDate, referenceDate) > 0) {
    throw new PatientAgeError('BIRTH_AFTER_REFERENCE')
  }

  let years = referenceDate.year - birthDate.year
  if (compareDates(referenceDate, anniversaryInYear(birthDate, referenceDate.year)) < 0) {
    years -= 1
  }

  if (years > 150) {
    throw new PatientAgeError('AGE_OVER_150')
  }

  if (years >= 1) {
    return { years, displayValue: years, displayUnit: 'year' }
  }

  let months =
    (referenceDate.year - birthDate.year) * 12 +
    (referenceDate.month - birthDate.month)

  if (compareDates(referenceDate, anniversaryAfterMonths(birthDate, months)) < 0) {
    months -= 1
  }

  if (months >= 1) {
    return { years: 0, displayValue: months, displayUnit: 'month' }
  }

  return {
    years: 0,
    displayValue: differenceInCalendarDays(birthDate, referenceDate),
    displayUnit: 'day',
  }
}

export function formatPatientAge(age: PatientAgeResult): string {
  const unitLabels: Record<PatientAgeUnit, string> = {
    year: 'tuổi',
    month: 'tháng tuổi',
    day: 'ngày tuổi',
  }

  return `${age.displayValue} ${unitLabels[age.displayUnit]}`
}

export function getPatientAgeLabel(
  birthDate: string,
  referenceDate: string,
  invalidLabel = 'Không xác định — dữ liệu ngày không hợp lệ'
): string {
  try {
    return formatPatientAge(calculatePatientAgeAtDate(birthDate, referenceDate))
  } catch {
    return invalidLabel
  }
}

export function validateAdrOccurrenceDateNotFuture(
  adrOccurrenceDate: string,
  currentDate: string
): void {
  const adrDate = parseDateOnly(adrOccurrenceDate)
  const today = parseDateOnly(currentDate)

  if (compareDates(adrDate, today) > 0) {
    throw new PatientAgeError('REFERENCE_IN_FUTURE')
  }
}

export function getDateInTimeZone(
  date: Date = new Date(),
  timeZone = 'Asia/Ho_Chi_Minh'
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

export function calculateValidatedPatientAge(
  birthDate: string,
  adrOccurrenceDate: string,
  currentDate = getDateInTimeZone()
): PatientAgeResult {
  validateAdrOccurrenceDateNotFuture(adrOccurrenceDate, currentDate)
  return calculatePatientAgeAtDate(birthDate, adrOccurrenceDate)
}

export function calculateReportPatientAgeYears(
  input: ReportPatientAgeInput,
  currentDate = getDateInTimeZone()
): number {
  return calculateValidatedPatientAge(
    input.patient_birth_date,
    input.adr_occurrence_date,
    currentDate
  ).years
}
