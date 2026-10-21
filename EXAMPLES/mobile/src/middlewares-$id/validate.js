// {student-id} - {student-name}
// validate.js  ตัวตรวจข้อมูลจาก client → ผิด throw 400 (errorHandler ตอบให้)
// [C4] bad / requireBody / requireFields / isRealDate / isPositive
// [U3] isEmail   [D10] isIntId
import { AppError } from './error-handler.js'

// ============================================================
// [C4] bad('ข้อความ')   → throw 400 VALIDATION_ERROR
// spec: "400 Bad Request", "VALIDATION_ERROR"
// ============================================================
export const bad = (message, code = 'VALIDATION_ERROR') => {   // ← code ตาม spec
    throw new AppError(message, 400, code)
}

// ============================================================
// [C4] requireBody(req.body)   → 400 "Request body is empty"
// spec: "body ว่าง", "Request body is empty"
// ============================================================
export function requireBody(body) {
    if (!body || Object.keys(body).length === 0) bad('Request body is empty')   // ← ข้อความตาม spec
}

// ============================================================
// [C4] requireFields(data, ['sku', 'name'])   → 400 "Field 'x' is required..."
// spec: "required", "ห้ามว่าง", "Field 'name' is required and cannot be empty"
// ============================================================
export function requireFields(data, fields) {
    for (const f of fields) {
        const v = data?.[f]
        if (v === undefined || v === null || String(v).trim() === '') {     // ไม่ส่ง / null / '' / '   '
            bad(`Field '${f}' is required and cannot be empty`)              // ← ข้อความตาม spec
        }
    }
}

// ============================================================
// [U3] isEmail('a@b.com')   → true / false
// spec: "email ไม่ถูกต้อง", "INVALID_EMAIL" (classicmodels: customers, employees)
// ============================================================
export const isEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

// ============================================================
// [C4] isRealDate('2026-02-30')   → false (วันที่ไม่มีจริง)
// spec: "YYYY-MM-DD", "release_date ไม่ถูกต้อง", "invalid date"
// ============================================================
export const isRealDate = (s) => {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false   // รูปแบบต้องเป็น YYYY-MM-DD
    const d = new Date(`${s}T00:00:00Z`)
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s   // 02-30 ถูกเลื่อนเป็น 03-01 → ไม่ตรง → false
}

// ============================================================
// [C4] isPositive(price)   → true เฉพาะ number ที่ > 0
// spec: "price ต้องมากกว่า 0", "must be greater than zero"
// ============================================================
export const isPositive = (n) => typeof n === 'number' && n > 0   // "100" (string) ไม่ผ่าน / ถ้า spec ส่ง string → Number(n) > 0

// ============================================================
// [D10] isIntId(req.params.id)   → '12' true / 'abc', '1abc', '-1' false
// spec: "id ต้องเป็นตัวเลข", "INVALID_ID", "invalid id format"
// ============================================================
export const isIntId = (id) => /^\d+$/.test(String(id))
