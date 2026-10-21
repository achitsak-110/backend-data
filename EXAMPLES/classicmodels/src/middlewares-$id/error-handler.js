// {student-id} - {student-name}
// error กลางทั้งแอป: AppError + notFound + errorHandler (envelope B แบบ assignment W6)
// [ALL] ทุกข้อ throw AppError มาที่นี่ / MySQL 1062 1451 1452 1264 1292 ... → 400 / 409

const CODES = {
    400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
    409: 'CONFLICT', 500: 'INTERNAL_SERVER_ERROR',
}

// ============================================================
// [ALL] throw new AppError(message, status, code)   → 400 / 404 / 409
// spec: "โยน AppError ไปที่ Error Middleware", "code": "OFFICE_NOT_FOUND"
// ============================================================
export class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = CODES[statusCode]) {
        super(message)
        this.statusCode = statusCode      // HTTP status ที่จะตอบ
        this.errorCode = errorCode        // code ใน JSON เช่น OFFICE_NOT_FOUND
    }
}

// error จาก MySQL → [status, code, ข้อความ]  (ไม่มีในตาราง = 500)
// ไม่ใส่ข้อความ → ใช้ข้อความของ MySQL เอง (err.sqlMessage)
const MYSQL_ERRORS = {
    ER_DUP_ENTRY:              [409, 'DUPLICATE_KEY', 'Resource already exists (Primary key or unique constraint violation)'], // 1062 PK / UNIQUE ซ้ำ
    ER_ROW_IS_REFERENCED_2:    [409, 'RESOURCE_IN_USE', 'Cannot delete or modify resource because it is referenced by related records'], // 1451 ลบแม่ที่มีลูก
    ER_NO_REFERENCED_ROW_2:    [400, 'FOREIGN_KEY_NOT_FOUND', 'Referenced foreign key record does not exist'], // 1452 FK ไม่มีจริง
    ER_BAD_NULL_ERROR:         [400, 'VALIDATION_ERROR'],  // 1048 ส่ง null ให้คอลัมน์ NOT NULL
    ER_NO_DEFAULT_FOR_FIELD:   [400, 'VALIDATION_ERROR'],  // 1364 ไม่ส่งคอลัมน์ที่บังคับ
    ER_BAD_FIELD_ERROR:        [400, 'VALIDATION_ERROR'],  // 1054 ชื่อคอลัมน์ไม่มี
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: [400, 'VALIDATION_ERROR'], // 1366 ชนิดข้อมูลผิด ('abc' ใส่ INT)
    ER_TRUNCATED_WRONG_VALUE:  [400, 'VALIDATION_ERROR'],  // 1292 วันที่ผิด ('2026-02-30')
    WARN_DATA_TRUNCATED:       [400, 'VALIDATION_ERROR'],  // 1265 ค่าไม่ตรง ENUM
    ER_DATA_TOO_LONG:          [400, 'VALIDATION_ERROR'],  // 1406 string ยาวเกิน VARCHAR
    ER_WARN_DATA_OUT_OF_RANGE: [400, 'VALIDATION_ERROR'],  // 1264 ตัวเลขเกินขนาดคอลัมน์ (DECIMAL(10,2) > 99999999.99)
    ER_CHECK_CONSTRAINT_VIOLATED: [400, 'VALIDATION_ERROR'], // 3819 ผิด CHECK constraint
}

// ============================================================
// [ALL] path ที่ไม่มี (วางหลัง router ทุกตัว)   → 404 NOT_FOUND
// spec: "ห้ามส่ง Default HTML error page ของ Express เด็ดขาด"
// ============================================================
export function notFound(req, res, next) {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
}

// ============================================================
// [ALL] errorHandler (4 parameter, วางท้ายสุดใน app.js)   → 400 / 404 / 409 / 500
// spec: "Centralized Error Middleware", { "status": "error", "error": { code, message } }
// ============================================================
export function errorHandler(err, req, res, next) {
    let status = err.statusCode || 500
    let code = err.errorCode || CODES[status] || 'INTERNAL_SERVER_ERROR'
    let message = err.message

    if (MYSQL_ERRORS[err.code]) {                        // error จาก MySQL
        const [s, c, m] = MYSQL_ERRORS[err.code]
        status = s
        code = c
        message = m || err.sqlMessage
    } else if (err.type === 'entity.parse.failed') {     // body ไม่ใช่ JSON ที่ถูกต้อง
        status = 400
        code = 'INVALID_JSON'
        message = 'Request body is not valid JSON'
    }
    if (status === 500) {
        console.error(err)                               // ดู error จริงใน console
        message = 'Internal server error'                // ไม่ส่งรายละเอียดภายในให้ client
    }

    // ▼ รูปแบบ JSON ตอน error (แก้ที่นี่ที่เดียวให้ตรง spec)
    res.status(status).json({ status: 'error', error: { code, message } })   // ← envelope B (assignment W6)
    // envelope A (midterm): res.status(status).json({ success: false, error: { code, message }, timestamp: new Date().toISOString() })
}
