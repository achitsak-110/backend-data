// {student-id} - {student-name}
// product-route.js  อ่าน request → เรียก service → ส่ง status + JSON (mount ที่ /api/รหัส/products)
// [R1][R2][R8-10] GET /  [R2S] GET /paged  [R4][R11] GET /:id  [C1] POST /  [C5] POST /camel
// [U1] PUT /:id  [U7] PATCH /:id  [D1] DELETE /:id   (error ที่ throw → Express 5 ส่งไป errorHandler เอง)
import * as service from "../services-$id/product-service.js"
import { apiResponse } from '../mappers-$id/api-response.js'
import { strictPagination } from '../middlewares-$id/pagination-middleware.js'
import express from "express"

const router = express.Router()

// ============================================================
// [R1][R2][R8-10] GET /products?page=1&limit=10&category=&q=&sort=   → 200 (+ pagination)
// spec: "รายการสินค้า", "แบ่งหน้า", "filter", "ค้นหา", "เรียงตาม"
// ============================================================
router.get("/", async (req, res) => {
    const view = req.query.view || 'summary'                            // [R3] ไม่ส่ง view → Summary DTO
    const objects = await service.getAllObjects(req.pagination, view, req.query)   // req.pagination มาจาก queryParser()
    return apiResponse(res, objects, req.pagination)                    // pagination = null → ไม่มี key pagination
})

// ============================================================
// [R2S] GET /products/paged?page=1&limit=10   → 200 / 400 INVALID_PAGINATION
// spec: "page/limit ไม่ถูกต้อง → 400", "limit สูงสุด 100"
// ============================================================
// path คงที่ ('/paged') ต้องอยู่ "ก่อน" '/:id' ไม่งั้น Express จับ 'paged' เป็น :id → 404
// วันสอบ: ใส่ strictPagination() เป็น parameter ที่ 2 ของ router.get("/", ...) ได้เลย
router.get("/paged", strictPagination(), async (req, res) => {
    const objects = await service.getAllObjects(req.pagination, 'summary')
    return apiResponse(res, objects, req.pagination)
})

// ============================================================
// [R4][R11] GET /products/:id?view=nested   → 200 / 404 PRODUCT_NOT_FOUND
// spec: "รายละเอียดสินค้าตาม ID", "Detail DTO", "brand": { "id", "name" }
// ============================================================
router.get("/:id", async (req, res) => {
    const id = req.params.id                                            // /products/5 → '5' (string)
    const object = await service.getObject(id, req.query.view || 'full')   // ?view=nested → [R11] / ?view=summary
    return apiResponse(res, object)                                     // 200
})

// ============================================================
// [C1] POST /products   → 201 / 400 / 409 DUPLICATE_KEY / 400 FOREIGN_KEY_NOT_FOUND
// spec: "เพิ่มสินค้าใหม่", "201 Created", "409 Conflict เมื่อ SKU ซ้ำ"
// ============================================================
router.post("/", async (req, res) => {
    const result = await service.createObject(req.body)   // req.body มาจาก express.json() ใน app.js
    return apiResponse(res, result, null, 201)            // สร้างสำเร็จ = 201 ไม่ใช่ 200
})

// ============================================================
// [C5] POST /products/camel   → 201 (body camelCase: brandId, ramGb, ...)
// spec: request body ใช้ชื่อ "brandId", "ramGb" แต่คอลัมน์เป็น brand_id, ram_gb
// ============================================================
// แยก path ไว้ให้ทดสอบคู่กับ [C1] ได้ วันสอบใส่ใน router.post("/", ...) ตัวเดียว
router.post("/camel", async (req, res) => {
    const result = await service.createObjectCamel(req.body)
    return apiResponse(res, result, null, 201)
})

// ============================================================
// [U1] PUT /products/:id   → 200 / 404 / 400 / 409 / 400 FK
// spec: "แก้ไขข้อมูลสินค้า", "200 OK", "404 Not Found หากไม่พบ ID"
// ============================================================
router.put("/:id", async (req, res) => {
    const object = await service.updateObject(req.params.id, req.body)   // id จาก URL, ข้อมูลจาก body
    return apiResponse(res, object)                                      // ไม่ใส่ status = 200
})

// ============================================================
// [U7] PATCH /products/:id   → 200 / 404 / 400 / 409
// spec: "PATCH", "แก้บาง field", "อัปเดตเฉพาะที่ส่งมา"
// ============================================================
router.patch("/:id", async (req, res) => {
    const object = await service.patchObject(req.params.id, req.body)
    return apiResponse(res, object)
})

// ============================================================
// [D1] DELETE /products/:id   → 204 ไม่มี body / 404
// spec: "ลบสินค้า", "204 No Content (ไม่มี Response Body)"
// ============================================================
router.delete("/:id", async (req, res) => {
    await service.removeObject(req.params.id)             // ไม่เจอ → throw → errorHandler ตอบ 404
    return res.status(204).end()                          // end() = ไม่มี body (ห้ามใช้ .json() กับ 204)
    // spec ให้ 200 + message → ดู [D2] ใน brand-route.js
})

export default router
