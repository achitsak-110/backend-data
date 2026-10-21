// {student-id} - {student-name}
// mount ใน app.js: app.use(`${BASE}/orders`, orderRouter)
// [R4] GET /:orderNumber   [D8] DELETE /:orderNumber
import * as service from '../services-$id/order-service.js'
import { apiResponse } from '../mappers-$id/api-response.js'
import express from 'express'

const router = express.Router()

// ============================================================
// [R4] GET /orders/:orderNumber   → 200 / 404
// spec: "order พร้อม customer และ items", "ORDER_NOT_FOUND"
// ============================================================
router.get('/:orderNumber', async (req, res) => {
    return apiResponse(res, await service.getObject(req.params.orderNumber))
})

// ============================================================
// [D8] DELETE /orders/:orderNumber   → 200 + message / 404 / 409
// spec: "ลบ order และ orderdetails", "transaction"
// ============================================================
router.delete('/:orderNumber', async (req, res) => {
    await service.removeObject(req.params.orderNumber)
    return apiResponse(res, { message: 'Order and its order details successfully deleted' })   // ← ข้อความตาม spec
})

export default router
