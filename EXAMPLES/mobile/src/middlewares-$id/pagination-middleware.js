// {student-id} - {student-name}
// pagination-middleware.js  อ่าน ?page=&limit= → req.pagination = { page, limit, offset }
// [R2]  queryParser()        แบบหลัก ใส่ใน app.js (ค่าผิดถูกปรับให้เงียบๆ)
// [R2S] strictPagination()   แบบเข้ม ใส่ระดับ route (ค่าผิด → 400 INVALID_PAGINATION)
import { AppError } from './error-handler.js'

// ============================================================
// [R2] app.use(queryParser())   → req.pagination / null (ไม่ส่ง page และ limit)
// spec: "แบ่งหน้า", "page", "limit", "default page = 1"
// ============================================================
export const queryParser = () => {
    return (req, res, next) => {
        const query = req.query || {};
        if (query.page === undefined && query.limit === undefined) {   // ไม่ส่งทั้งคู่ → ไม่แบ่งหน้า
            req.pagination = null
            return next();
        }
        const page = Math.max(parseInt(query.page) || 1, 1)                // ← default page: ไม่ส่ง / 'abc' / 0 / ติดลบ → 1
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100) // ← default limit 20, ช่วง 1–100
        const offset = (page - 1) * limit                                  // จำนวนแถวที่ข้าม
        req.pagination = {page, limit, offset}
        next();
    }
}

// ============================================================
// [R2S] router.get('/paged', strictPagination(), ...)   → 400 INVALID_PAGINATION
// spec: "page/limit ไม่ถูกต้อง → 400", "limit ไม่เกิน 100", "invalid pagination"
// ============================================================
export const strictPagination = (defaultLimit = 20, maxLimit = 100) => {
    return (req, res, next) => {
        const page = Number(req.query.page ?? 1)                 // ไม่ส่ง → 1 ('abc' → NaN → 400)
        const limit = Number(req.query.limit ?? defaultLimit)    // ไม่ส่ง → defaultLimit
        if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
            // throw ใน middleware ธรรมดา → Express ส่งไป errorHandler ให้เอง
            throw new AppError(`Query 'page' must be an integer >= 1 and 'limit' must be between 1 and ${maxLimit}`,
                400, 'INVALID_PAGINATION')                       // ← code / ข้อความตาม spec
        }
        req.pagination = {page, limit, offset: (page - 1) * limit}   // เขียนทับค่าจาก queryParser()
        next();
    }
}
