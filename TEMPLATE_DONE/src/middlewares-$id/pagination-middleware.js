//{student-id} - {student-name}
// ?page=2&limit=10 → req.pagination = { page: 2, limit: 10, offset: 10 }
// ไม่ส่งทั้ง page และ limit → req.pagination = null (ส่งข้อมูลทั้งหมด)
export const queryParser = () => {
    return (req, res, next) => {
        const query = req.query || {};
        if (query.page === undefined && query.limit === undefined) {      // แก้: เดิมใช้ || → ส่งมาแค่ตัวเดียวก็ไม่แบ่งหน้า
            req.pagination = null
            return next();
        }
        const page = Math.max(parseInt(query.page) || 1, 1)                // ไม่ส่ง / 'abc' / 0 / ติดลบ → 1
        const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 100) // ไม่ส่ง → 20, ช่วง 1–100
        const offset = (page - 1) * limit                                  // แก้: เดิมคูณ pageSize (limit=500 → offset ผิด)
        req.pagination = {page, limit, offset}
        next();
    }
}
