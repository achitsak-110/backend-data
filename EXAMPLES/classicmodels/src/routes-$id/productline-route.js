// {student-id} - {student-name}
// mount ใน app.js: app.use(`${BASE}/productlines`, productLineRouter)
// [C7] POST /   [U8] PUT /:productLine   [D6] DELETE /:productLine
import * as service from '../services-$id/productline-service.js'
import { apiResponse } from '../mappers-$id/api-response.js'
import express from 'express'

const router = express.Router()

// ============================================================
// [C7] POST /productlines   → 201 / 400 / 409
// spec: "เมื่อบันทึกสำเร็จ ให้ตอบกลับ HTTP 201 Created"
// ============================================================
router.post('/', async (req, res) => {
    const result = await service.createObject(req.body)
    return apiResponse(res, result, null, 201)                  // ← 201 ตอนสร้าง
})

// ============================================================
// [U8] PUT /productlines/:productLine   → 200 / 404 / 400
// spec: "PUT /productlines/Classic%20Cars" (Express แปลง %20 เป็นเว้นวรรคให้เอง)
// ============================================================
router.put('/:productLine', async (req, res) => {
    const productLine = req.params.productLine                  // 'Classic Cars' (decode แล้ว)
    return apiResponse(res, await service.updateObject(productLine, req.body))
})

// ============================================================
// [D6] DELETE /productlines/:productLine   → 200 + message / 404 / 409
// spec: "ลบ product line", "ยังมีสินค้าใช้อยู่ → 409"
// ============================================================
router.delete('/:productLine', async (req, res) => {
    await service.removeObject(req.params.productLine)
    return apiResponse(res, { message: 'Product line record successfully deleted' })   // ← ข้อความตาม spec
    // spec ให้ 204: return res.status(204).end()
})

export default router
