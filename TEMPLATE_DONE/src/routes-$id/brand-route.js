// {student-id} - {student-name}
// resource ที่ 2: copy route.js มาแล้วแก้ / mount ใน app.js: app.use(`${BASE}/brands`, brandRouter)
import * as service from "../services-$id/brand-service.js"
import { apiResponse } from '../mappers-$id/api-response.js'
import express from "express"

const router = express.Router()

// GET /api/รหัส/brands
router.get("/", async (req, res) => {
    return apiResponse(res, await service.getAllObjects())
})

// GET /api/รหัส/brands/:id/products   (path ที่ยาวกว่าวางก่อน /:id)
router.get("/:id/products", async (req, res) => {
    return apiResponse(res, await service.getProducts(req.params.id))
})

// GET /api/รหัส/brands/:id   → 200 / 404
router.get("/:id", async (req, res) => {
    return apiResponse(res, await service.getObject(req.params.id))
})

export default router
