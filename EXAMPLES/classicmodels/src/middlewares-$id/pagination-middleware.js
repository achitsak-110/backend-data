// {student-id} - {student-name}
// [R2]  queryParser()       ใช้ทั้งแอป: app.use(queryParser())  ไม่ส่ง page/limit → null (ส่งทั้งหมด)
// [R2A] alwaysPaginate(10)  ใช้ทีละ route: router.get('/', alwaysPaginate(10), ...)  แบ่งหน้าเสมอ

// ============================================================
// [R2] ?page=2&limit=10 → req.pagination = { page: 2, limit: 10, offset: 10 }   (ไม่ส่ง → null)
// spec: "รองรับ ?page=&limit=", "ไม่ส่ง page/limit → แสดงทั้งหมด"
// ============================================================
export const queryParser = () => {
    return (req, res, next) => {
        const query = req.query || {}
        if (query.page === undefined && query.limit === undefined) {        // ไม่ได้ขอแบ่งหน้า
            req.pagination = null
            return next()
        }
        const page = Math.max(parseInt(query.page) || 1, 1)                  // ไม่ส่ง / 'abc' / 0 / ติดลบ → 1
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100) // ← ไม่ส่ง → 20, ช่วง 1–100
        const offset = (page - 1) * limit                                    // หน้า 2 limit 10 → ข้าม 10 แถว
        req.pagination = { page, limit, offset }
        next()
    }
}

// ============================================================
// [R2A] แบ่งหน้าเสมอ: ไม่ส่ง page/limit → page 1, limit = defaultLimit
// spec: "default page = 1, limit = 10", "ถ้าไม่ระบุให้ใช้ค่าเริ่มต้น"
// ============================================================
export const alwaysPaginate = (defaultLimit = 10) => {
    return (req, res, next) => {
        const page = Math.max(parseInt(req.query.page) || 1, 1)                          // ไม่ส่ง / ผิด → 1
        const limit = Math.min(Math.max(parseInt(req.query.limit) || defaultLimit, 1), 100) // ← ไม่ส่ง → default
        req.pagination = { page, limit, offset: (page - 1) * limit }   // ทับค่า null ของ queryParser
        next()
    }
}
