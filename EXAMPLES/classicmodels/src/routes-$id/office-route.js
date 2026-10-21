// {student-id} - {student-name}
// mount ใน app.js: app.use(`${BASE}/offices`, officeRouter)
// [R1] GET /   [R5] GET /:officeCode
import * as service from '../services-$id/office-service.js'
import { apiResponse } from '../mappers-$id/api-response.js'
import express from 'express'

const router = express.Router()

// ============================================================
// [R1] GET /offices   → 200
// spec: "แสดงสำนักงานทั้งหมด"
// ============================================================
router.get('/', async (req, res) => {
    return apiResponse(res, await service.getAllObjects())      // { status: 'success', data: [...] }
})

// ============================================================
// [R5] GET /offices/:officeCode   → 200 / 404
// spec: "GET /api/66011234/offices/:officeCode", "OFFICE_NOT_FOUND"
// ============================================================
router.get('/:officeCode', async (req, res) => {
    const officeCode = req.params.officeCode                    // ← ชื่อหลัง : ต้องตรงกับที่อ่าน
    return apiResponse(res, await service.getObject(officeCode))
})

export default router
