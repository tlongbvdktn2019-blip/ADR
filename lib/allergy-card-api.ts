import { NextResponse } from 'next/server'

export function allergyCardError(
  code: string,
  message: string,
  status: number,
  fieldErrors?: Record<string, string>
) {
  return NextResponse.json({ error: { code, message, field_errors: fieldErrors } }, { status })
}

export async function parseJsonBody<T>(request: Request): Promise<T | null> {
  try {
    const value = await request.json()
    return value && typeof value === 'object' && !Array.isArray(value) ? value as T : null
  } catch {
    return null
  }
}

export function sanitizeSearchTerm(value: string | null): string {
  return (value || '').trim().replace(/[,%()]/g, ' ').replace(/\s+/g, ' ').slice(0, 100)
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function clampInteger(value: string | null, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(min, Math.min(max, parsed))
}

export function mapDatabaseWorkflowError(message = ''): { code: string; message: string; status: number } {
  if (message.includes('REPORT_ALREADY_ISSUED')) {
    return { code: 'REPORT_ALREADY_ISSUED', message: 'Báo cáo này đã được cấp thẻ', status: 409 }
  }
  if (message.includes('REPORT_STALE')) {
    return { code: 'REPORT_STALE', message: 'Báo cáo vừa được cập nhật. Vui lòng tải lại dữ liệu.', status: 409 }
  }
  if (message.includes('REPORT_FORBIDDEN') || message.includes('ORGANIZATION_MISMATCH') || message.includes('CARD_FORBIDDEN')) {
    return { code: 'FORBIDDEN', message: 'Bạn không có quyền thao tác dữ liệu của đơn vị này', status: 403 }
  }
  if (message.includes('REPORT_NOT_FOUND') || message.includes('CARD_NOT_FOUND')) {
    return { code: 'NOT_FOUND', message: 'Không tìm thấy dữ liệu yêu cầu', status: 404 }
  }
  if (message.includes('CARD_CODE_MISMATCH')) {
    return { code: 'CARD_CODE_MISMATCH', message: 'Mã thẻ xác nhận không chính xác', status: 400 }
  }
  if (message.includes('DELETE_REASON_REQUIRED')) {
    return { code: 'DELETE_REASON_REQUIRED', message: 'Lý do xóa phải có ít nhất 5 ký tự', status: 400 }
  }
  return { code: 'DATABASE_ERROR', message: 'Không thể hoàn tất thao tác. Vui lòng thử lại.', status: 500 }
}

