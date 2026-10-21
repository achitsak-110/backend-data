// {student-id} - {student-name}
// api-response.js  รูปแบบ JSON ตอนสำเร็จ (envelope A = ข้อสอบซ้อม W8) เหมือน TEMPLATE_DONE
// [ENV-A] apiResponse → { success, data, pagination?, timestamp }
// [ENV-B] แบบ assignment W6 { status: 'success', data } อยู่ใน comment ท้ายไฟล์
import httpStatus from "http-status";

// ============================================================
// [ENV-A] apiResponse(res, data, req.pagination, 201)   → 200 / 201 (+ pagination)
// spec: "success": true, "data", "pagination", "timestamp"
// ============================================================
// apiResponse(res, data)                    → 200 { success, data, timestamp }
// apiResponse(res, data, req.pagination)    → 200 + pagination (pagination = null → ไม่มี key นี้)
// apiResponse(res, data, null, 201)         → 201 (POST)
export async function apiResponse(
    res, data, pagination = null, status = httpStatus.OK) {
    return await (pagination ?
            paginate(res, data, pagination, status.valueOf()) :
            success(res, data, status.valueOf())
    )
}

/**
 * ส่ง Success Response ทั่วไป
 */
async function success(res, data, statusCode) {
    return res.status(statusCode).json({
        success: true,
        data: data,
        timestamp: new Date().toISOString(),   // เวลาปัจจุบัน ห้าม hard code
    });
}

/**
 * ส่ง Success Response สำหรับข้อมูลแบบ Paginated
 */
async function paginate(res, data, pagination, statusCode) {
    const {limit, page} = pagination
    const total = data.totalItems ?? data.length;   // totalItems มาจาก COUNT(*) ใน repository
    return res.status(statusCode).json({
        success: true,
        data,
        pagination: {
            total: total,                           // ← ชื่อ key ตาม spec (บางที่ใช้ totalItems)
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),   // 75 / 10 = 7.5 → 8 หน้า
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1                   // ← บางที่ใช้ hasPreviousPage
        },
        timestamp: new Date().toISOString(),
    });
}

// ============================================================
// [ENV-B] { status: 'success', data, pagination? }   → ไม่มี timestamp
// spec: "status": "success", "status": "error" (assignment W6)
// ============================================================
// ถ้า spec เป็นแบบ B → แก้ 2 ไฟล์ 3 จุด:
// 1) success():  return res.status(statusCode).json({ status: 'success', data: data })
// 2) paginate(): return res.status(statusCode).json({ status: 'success', data, pagination: { ...เหมือนเดิม } })
// 3) error-handler.js: res.status(status).json({ status: 'error', error: { code, message } })
