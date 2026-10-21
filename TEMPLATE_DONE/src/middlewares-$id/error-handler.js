// {student-id} - {student-name}
// ไฟล์ใหม่: template ไม่มี error handler → ต้องเขียนเอง
// ใช้: throw new AppError('Product with id \'99\' was not found', 404, 'PRODUCT_NOT_FOUND')

const CODES = {
    400: 'BAD_REQUEST', 401: 'UNAUTHORIZED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
    409: 'CONFLICT', 500: 'INTERNAL_SERVER_ERROR',
}

export class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = CODES[statusCode]) {
        super(message)
        this.statusCode = statusCode      // HTTP status ที่จะตอบ
        this.errorCode = errorCode        // code ใน JSON เช่น PRODUCT_NOT_FOUND
    }
}

// error จาก MySQL → [status, code, ข้อความ]  (ไม่มีในตาราง = 500)
const MYSQL_ERRORS = {
    ER_DUP_ENTRY:              [409, 'DUPLICATE_KEY', 'Resource already exists (Primary key or unique constraint violation)'], // 1062 ค่าซ้ำ
    ER_ROW_IS_REFERENCED_2:    [409, 'RESOURCE_IN_USE', 'Cannot delete or modify resource because it is referenced by related records'], // 1451 ลบแม่ที่มีลูก
    ER_NO_REFERENCED_ROW_2:    [400, 'FOREIGN_KEY_NOT_FOUND', 'Referenced foreign key record does not exist'], // 1452 FK ไม่มีจริง
    ER_BAD_NULL_ERROR:         [400, 'VALIDATION_ERROR'],  // 1048 ส่ง null ให้คอลัมน์ NOT NULL
    ER_NO_DEFAULT_FOR_FIELD:   [400, 'VALIDATION_ERROR'],  // 1364 ไม่ส่งคอลัมน์ที่บังคับ
    ER_BAD_FIELD_ERROR:        [400, 'VALIDATION_ERROR'],  // 1054 ชื่อคอลัมน์ไม่มี
    ER_TRUNCATED_WRONG_VALUE_FOR_FIELD: [400, 'VALIDATION_ERROR'], // 1366 ชนิดข้อมูลผิด
    ER_TRUNCATED_WRONG_VALUE:  [400, 'VALIDATION_ERROR'],  // 1292 วันที่ผิด
    WARN_DATA_TRUNCATED:       [400, 'VALIDATION_ERROR'],  // 1265 ค่าไม่ตรง ENUM
    ER_DATA_TOO_LONG:          [400, 'VALIDATION_ERROR'],  // 1406 string ยาวเกิน
    ER_WARN_DATA_OUT_OF_RANGE: [400, 'VALIDATION_ERROR'],  // 1264 ตัวเลขเกินขนาดคอลัมน์
}

// วางหลัง router ทุกตัว: path ที่ไม่มี → 404 JSON
export function notFound(req, res, next) {
    next(new AppError(`Route ${req.method} ${req.originalUrl} not found`, 404))
}

// error middleware ต้องมี 4 parameter และอยู่ท้ายสุดใน app.js
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
        message = 'Internal server error'
    }

    // ▼ รูปแบบ JSON ตอน error (แก้ที่นี่ที่เดียวให้ตรง spec)
    res.status(status).json({
        success: false,
        error: { code, message },
        timestamp: new Date().toISOString(),
    })
    // แบบ assignment W6: res.status(status).json({ status: 'error', error: { code, message } })
}
