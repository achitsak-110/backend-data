// {student-id} - {student-name}
// brand-route.js  mount ที่ /api/รหัส/brands (path คงที่ / ยาวกว่า วางก่อน '/:id')
// [R1] GET /  [R12] GET /stats  [R6] GET /:id/products  [R4B] GET /:id  [C2] POST /
// [D2] DELETE /:id/with-message  [D3][D10] DELETE /:id  [D9] PATCH /:id/deactivate
import * as service from "../services-$id/brand-service.js"
import { apiResponse } from '../mappers-$id/api-response.js'
import express from "express"

const router = express.Router()

// ============================================================
// [R1] GET /brands   → 200 แถวดิบ
// spec: "รายการแบรนด์ทั้งหมด", "country_of_origin", "created_at"
// ============================================================
router.get("/", async (req, res) => {
    return apiResponse(res, await service.getAllObjects())
})

// ============================================================
// [R12] GET /brands/stats   → 200
// spec: "สถิติ", "stats", "summary ต่อแบรนด์", "count / sum / avg"
// ============================================================
// path คงที่ต้องอยู่ "ก่อน" '/:id' ไม่งั้น Express จับ 'stats' เป็น :id → 404 BRAND_NOT_FOUND
router.get("/stats", async (req, res) => {
    return apiResponse(res, await service.getStats())
})

// ============================================================
// [R6] GET /brands/:id/products?page=1&limit=5   → 200 (+ pagination) / 404
// spec: "สินค้าของแบรนด์", "GET /brands/:id/products"
// ============================================================
router.get("/:id/products", async (req, res) => {
    const objects = await service.getProducts(req.params.id, req.pagination)
    return apiResponse(res, objects, req.pagination)      // ไม่ส่ง page/limit → ไม่มี pagination
})

// ============================================================
// [R4B] GET /brands/:id   → 200 / 404 BRAND_NOT_FOUND
// spec: "ข้อมูลแบรนด์ตามรหัส ID", "404 Not Found (ไม่พบข้อมูล)"
// ============================================================
router.get("/:id", async (req, res) => {
    return apiResponse(res, await service.getObject(req.params.id))
})

// ============================================================
// [C2] POST /brands   → 201 / 400 / 409 DUPLICATE_KEY
// spec: "เพิ่มแบรนด์", "ชื่อแบรนด์ห้ามซ้ำ", "409 Conflict"
// ============================================================
router.post("/", async (req, res) => {
    const result = await service.createObject(req.body)
    return apiResponse(res, result, null, 201)
})

// ============================================================
// [D2] DELETE /brands/:id/with-message   → 200 + { message } / 404 / 409
// spec: "200 OK", "message": "... successfully deleted"
// ============================================================
// แยก path ไว้ให้เห็นคู่กับ [D3] วันสอบใช้ router.delete("/:id", ...) ตัวเดียว
router.delete("/:id/with-message", async (req, res) => {
    await service.removeObject(req.params.id)
    return apiResponse(res, { message: 'Brand successfully deleted' })   // ← ข้อความตาม spec
})

// ============================================================
// [D3][D10] DELETE /brands/:id   → 204 / 400 INVALID_ID / 404 / 409 RESOURCE_IN_USE
// spec: "ลบแบรนด์", "ยังมีสินค้าอ้างอยู่ → 409", "id ไม่ใช่ตัวเลข → 400"
// ============================================================
router.delete("/:id", async (req, res) => {
    await service.removeObject(req.params.id)
    return res.status(204).end()                          // 204 = ไม่มี body
})

// ============================================================
// [D9] PATCH /brands/:id/deactivate   → 200 + แถวหลังแก้ / 404
// spec: "soft delete", "ปิดใช้งานแบรนด์", "is_active = false"
// ============================================================
// spec เขียนว่า DELETE แต่ให้ soft delete → router.delete("/:id", ...) แล้วเรียก service.deactivate แทน
router.patch("/:id/deactivate", async (req, res) => {
    return apiResponse(res, await service.deactivate(req.params.id))
})

export default router
