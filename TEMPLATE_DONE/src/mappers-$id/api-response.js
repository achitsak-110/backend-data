//{student-id} - {student-name}
import httpStatus from "http-status";

// apiResponse(res, data)                    → 200 { success, data, timestamp }
// apiResponse(res, data, req.pagination)    → 200 + pagination
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
        timestamp: new Date().toISOString(),   // แก้: เพิ่ม timestamp ตาม spec
    });
    // แบบ assignment W6: res.status(statusCode).json({ status: 'success', data })
}

/**
 * ส่ง Success Response สำหรับข้อมูลแบบ Paginated
 */
async function paginate(res, data, pagination, statusCode) {
    const {limit, page} = pagination
    const total = data.totalItems ?? data.length;   // แก้: totalItems มาจาก repository.findAll
    return res.status(statusCode).json({
        success: true,
        data,
        pagination: {
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            hasNextPage: page * limit < total,
            hasPrevPage: page > 1
        },
        timestamp: new Date().toISOString(),   // แก้: เพิ่ม timestamp ตาม spec
    });
}
