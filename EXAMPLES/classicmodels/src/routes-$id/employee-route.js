// {student-id} - {student-name}
// mount ใน app.js: app.use(`${BASE}/employees`, employeeRouter)
// [R2] GET /?page=&limit=   [U3/U4] PUT /:employeeNumber
import * as service from '../services-$id/employee-service.js'
import { apiResponse } from '../mappers-$id/api-response.js'
import express from 'express'

const router = express.Router()

// ============================================================
// [R2] GET /employees?page=2&limit=5   → 200 (+ pagination)
// spec: "รองรับ pagination", "ไม่ส่ง page/limit → แสดงทั้งหมด"
// ============================================================
router.get('/', async (req, res) => {
    const objects = await service.getAllObjects(req.pagination)   // req.pagination มาจาก queryParser ใน app.js
    return apiResponse(res, objects, req.pagination)              // null → ไม่มี key pagination
})

// ============================================================
// [U3/U4] PUT /employees/:employeeNumber   → 200 / 404 / 400
// spec: "INVALID_EMAIL", "FOREIGN_KEY_NOT_FOUND", "EMPLOYEE_NOT_FOUND"
// ============================================================
router.put('/:employeeNumber', async (req, res) => {
    const employeeNumber = req.params.employeeNumber
    const object = await service.updateObject(employeeNumber, req.body)
    return apiResponse(res, object)                               // 200 + แถวหลังแก้
})

export default router
