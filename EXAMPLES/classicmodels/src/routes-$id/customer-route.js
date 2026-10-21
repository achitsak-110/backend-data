// {student-id} - {student-name}
// mount ใน app.js: app.use(`${BASE}/customers`, customerRouter)  (payments อยู่ใต้ customers)
// [R2A] GET /   [D2/D3] DELETE /:customerNumber   [R7] GET /:customerNumber/payments
// [C8] POST /:customerNumber/payments   [D7] DELETE /:customerNumber/payments/:checkNumber
import * as service from '../services-$id/customer-service.js'
import { apiResponse } from '../mappers-$id/api-response.js'
import { alwaysPaginate } from '../middlewares-$id/pagination-middleware.js'
import express from 'express'

const router = express.Router()

// ============================================================
// [R2A] GET /customers?page=&limit=&view=   → 200 + pagination เสมอ
// spec: "default page = 1, limit = 10", "ไม่ส่ง page/limit ก็ต้องแบ่งหน้า"
// ============================================================
router.get('/', alwaysPaginate(10), async (req, res) => {          // ← middleware ตรงกลาง: ทำก่อน handler
    const objects = await service.getAllObjects(req.pagination, req.query.view || 'summary')
    return apiResponse(res, objects, req.pagination)
})

// ============================================================
// [D2/D3] DELETE /customers/:customerNumber   → 200 + message / 404 / 409
// spec: "Customer record successfully deleted", "RESOURCE_IN_USE"
// ============================================================
router.delete('/:customerNumber', async (req, res) => {
    await service.removeObject(req.params.customerNumber)
    return apiResponse(res, { message: 'Customer record successfully deleted' })   // ← spec นี้ 200 + message (ไม่ใช่ 204)
})

// ============================================================
// [R7] GET /customers/:customerNumber/payments   → 200 / 404
// spec: "sub-collection payments ของลูกค้า"
// ============================================================
router.get('/:customerNumber/payments', async (req, res) => {
    return apiResponse(res, await service.getPayments(req.params.customerNumber))
})

// ============================================================
// [C8] POST /customers/:customerNumber/payments   → 201 / 404 / 400 / 409
// spec: "Composite Key", "checkNumber ซ้ำ", "amount > 0"
// ============================================================
router.post('/:customerNumber/payments', async (req, res) => {
    const result = await service.createPayment(req.params.customerNumber, req.body)   // customerNumber มาจาก URL
    return apiResponse(res, result, null, 201)
})

// ============================================================
// [D7] DELETE /customers/:customerNumber/payments/:checkNumber   → 200 + message / 404
// spec: "ลบ payment ด้วย PK 2 คอลัมน์"
// ============================================================
router.delete('/:customerNumber/payments/:checkNumber', async (req, res) => {
    const { customerNumber, checkNumber } = req.params              // path parameter 2 ตัว = PK 2 คอลัมน์
    await service.removePayment(customerNumber, checkNumber)
    return apiResponse(res, { message: 'Payment record successfully deleted' })   // ← ข้อความตาม spec
})

export default router
