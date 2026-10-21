// {student-id} - {student-name}
// ส่ง JSON ตอนสำเร็จ: envelope B (assignment W6) = { status: 'success', data }
// [ALL] 200 / 201   [R2 / R2A] + pagination
import httpStatus from "http-status";

// ============================================================
// [ALL] apiResponse(res, data, pagination?, status?)   → 200 / 201
// spec: { "status": "success", "data": { ... } }, "201 Created"
// ============================================================
// apiResponse(res, data)                    → 200 { status, data }
// apiResponse(res, data, req.pagination)    → 200 + pagination
// apiResponse(res, data, null, 201)         → 201 (POST)
export async function apiResponse(
    res, data, pagination = null, status = httpStatus.OK) {
    return await (pagination ?
            paginate(res, data, pagination, status.valueOf()) :
            success(res, data, status.valueOf())
    )
}

// ส่ง Success Response ทั่วไป
async function success(res, data, statusCode) {
    return res.status(statusCode).json({
        status: 'success',                     // ← envelope B (assignment W6)
        data: data,
    });
    // envelope A (midterm): res.status(statusCode).json({ success: true, data, timestamp: new Date().toISOString() })
}

// ส่ง Success Response สำหรับข้อมูลแบบ Paginated
async function paginate(res, data, pagination, statusCode) {
    const {limit, page} = pagination
    const total = data.totalItems ?? data.length;   // totalItems มาจาก repository.findAll (COUNT(*))
    return res.status(statusCode).json({
        status: 'success',                     // ← envelope B
        data,
        pagination: {                          // ← ชื่อ key ตาม spec
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        },
    });
    // envelope A: เพิ่ม success: true และ timestamp: new Date().toISOString() แทน status
}
