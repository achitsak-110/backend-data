// {student-id} - {student-name}
// ตรวจข้อมูลจาก client → ผิด throw AppError 400 (errorHandler ตอบ JSON ให้)
// [ALL] bad, requireBody   [C7] requireFields   [U3] isEmail   [C8] isRealDate, isPositive   [R7] isIntId
import { AppError } from './error-handler.js'

// ============================================================
// [ALL] bad(message, code)   → 400 (code ไม่ส่ง = VALIDATION_ERROR)
// spec: "ส่ง HTTP 400 Bad Request", "code": "INVALID_EMAIL"
// ============================================================
export function bad(message, code = 'VALIDATION_ERROR') {
    throw new AppError(message, 400, code)
}

// ============================================================
// [ALL] requireBody(req.body)   → 400 "Request body is empty"
// spec: "Body ว่าง"
// ============================================================
export function requireBody(body) {
    if (!body || Object.keys(body).length === 0) bad('Request body is empty')   // ไม่ส่ง body / {} → 400
}

// ============================================================
// [C7] requireFields(data, ['productLine'])   → 400 VALIDATION_ERROR
// spec: "Field 'productLine' is required and cannot be empty"
// ============================================================
export function requireFields(data, fields) {
    for (const f of fields) {
        const v = data?.[f]
        if (v === undefined || v === null || String(v).trim() === '') {   // ไม่ส่ง / null / "   " → 400
            bad(`Field '${f}' is required and cannot be empty`)            // ← ข้อความตาม spec ทุกตัวอักษร
        }
    }
}

// ============================================================
// [U3] isEmail('a@b.com') → true / 'not-an-email' → false
// spec: "ตรวจสอบรูปแบบ email", "INVALID_EMAIL"
// ============================================================
export function isEmail(s) {
    return typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)   // มี @ และมี . หลัง @
}

// ============================================================
// [C8] isRealDate('2026-09-18') → true / '18/09/2026', '2026-02-30' → false
// spec: "paymentDate ต้องเป็นฟอร์แมตวันที่แบบ ISO (YYYY-MM-DD)"
// ============================================================
export function isRealDate(s) {
    if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false   // รูปแบบต้อง YYYY-MM-DD
    const [y, m, d] = s.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))                                // 2026-02-30 → เลื่อนเป็น 2 มี.ค.
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d   // เลื่อน = วันไม่มีจริง
}

// ============================================================
// [C8] isPositive(2500.5) → true / 0, -1, '100' → false
// spec: "amount ต้องเป็นตัวเลขและมากกว่า 0"
// ============================================================
export function isPositive(n) {
    return typeof n === 'number' && Number.isFinite(n) && n > 0   // string '100' ไม่นับเป็นตัวเลข
}

// ============================================================
// [R7] isIntId('103') → true / '103abc', 'abc' → false
// spec: PK เป็น INT (customerNumber)
// ============================================================
export function isIntId(id) {
    return /^\d+$/.test(String(id))   // MySQL แปลง '103abc' เป็น 103 → เจอผิดตัว จึงต้องเช็คก่อน
}
