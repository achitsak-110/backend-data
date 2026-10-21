// {student-id} - {student-name}
// route = อ่าน request → เรียก service → ส่ง status + JSON
// error ที่ service / repository throw → Express 5 ส่งไป errorHandler เอง (ไม่ต้อง try/catch)
import * as service from "../services-$id/service.js"
import { apiResponse } from '../mappers-$id/api-response.js'   // แก้: ใช้ส่ง JSON ตาม spec
import express from "express"

const router = express.Router()

// GET /api/รหัส/products?page=1&limit=10
router.get("/", async (req, res) => {
    const objects = await service.getAllObjects(req.pagination, req.query.view || 'summary')  // แก้: ส่ง pagination
    return apiResponse(res, objects, req.pagination)          // แก้: เดิมตอบ string placeholder
})

// GET /api/รหัส/products/:id   → 200 / 404
router.get("/:id", async (req, res) => {
    const id = req.params.id
    const object = await service.getObject(id, req.query.view || 'full')
    return apiResponse(res, object)                           // แก้: เดิมตอบ string placeholder
})

// POST /api/รหัส/products   → 201 / 400 / 409
router.post("/", async (req, res) => {
    const object = req.body
    const result = await service.createObject(object)
    return apiResponse(res, result, null, 201)                // แก้: เดิมตอบ 200 + { result }
})

// PUT /api/รหัส/products/:id   → 200 / 404 / 400 / 409
router.put("/:id", async (req, res) => {
    const id = req.params.id
    const object = await service.updateObject(id, req.body)  // แก้: เดิมเรียก updateObject() ไม่ส่งค่า
    return apiResponse(res, object)
})

// DELETE /api/รหัส/products/:id   → 204 ไม่มี body / 404 / 409
router.delete("/:id", async (req, res) => {
    const id = req.params.id
    await service.removeObject(id)
    return res.status(204).end()                              // แก้: เดิม res.end() = 200
    // spec ให้ 200 + message: return apiResponse(res, { message: 'Product successfully deleted' })
})

export default router
