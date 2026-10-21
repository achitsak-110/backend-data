// {student-id} - {student-name}
// brand-service.js  brands ส่งแถวจาก DB ตรงๆ (spec ใช้ key snake_case) / สินค้าของ brand ใช้ mapper
// [R1] getAllObjects  [R4B] getObject  [R6] getProducts  [R12] getStats
// [C2] createObject  [D3][D10] removeObject  [D9] deactivate
import * as repo from "../repositories-$id/brand-repository.js"
import mapper from "../mappers-$id/entity-dto-mapper.js"
import { AppError } from '../middlewares-$id/error-handler.js'
import { pick, num, camelKeys } from '../mappers-$id/dto-helpers.js'
import { requireBody, requireFields, isIntId } from '../middlewares-$id/validate.js'

const ALLOWED = ['name', 'country_of_origin', 'website', 'is_active']   // ← คอลัมน์ที่ client ส่งได้
const REQUIRED = ['name', 'country_of_origin']                          // ← NOT NULL ที่ไม่มี DEFAULT

// ============================================================
// [R1] GET /brands   → 200 แถวดิบ (snake_case)
// spec: "country_of_origin", "is_active": 1, "created_at"
// ============================================================
export async function getAllObjects() {
    return await repo.findAll()                    // spec ใช้ key ตามคอลัมน์ DB → ไม่แปลง DTO
}

// ============================================================
// [R4B] GET /brands/:id   → 200 / 404 BRAND_NOT_FOUND
// spec: "ข้อมูลแบรนด์ตามรหัส ID", "404 Not Found"
// ============================================================
export async function getObject(id) {
    return await repo.findOne(id)                  // ไม่เจอ → repo throw 404
}

// ============================================================
// [R6] GET /brands/:id/products   → 200 (ไม่มีลูก = []) / 404 (ไม่มีแม่)
// spec: "สินค้าของแบรนด์", "sub-collection", "brand ไม่มีสินค้า → []"
// ============================================================
export async function getProducts(id, pagination = null) {
    await repo.findOne(id)                                                   // 1) ไม่มี brand → 404 (ไม่ใช่ [])
    return mapper.maps(await repo.findProducts(id, pagination), 'summary')   // 2) มี brand ไม่มีสินค้า → []
}

// ============================================================
// [R12] GET /brands/stats   → 200 สถิติต่อ brand (ตัวเลขเป็น number)
// spec: "productCount", "totalStock", "avgPrice", "สรุปยอด"
// ============================================================
// SUM / AVG / ROUND ได้ string, BOOLEAN ได้ 1 / 0 → แปลงให้ตรง spec
const toStatDTO = (row) => ({
    ...camelKeys(row),                 // id, name, isActive, productCount, totalStock, avgPrice
    isActive: row.is_active === 1,     // ทับค่า: 1 / 0 → true / false
    totalStock: num(row.total_stock),  // ทับค่า: SUM "55" → 55
    avgPrice: num(row.avg_price),      // ทับค่า: AVG "36300.00" → 36300 (ไม่มีสินค้า → null)
})

export async function getStats() {
    return (await repo.findStats()).map(toStatDTO)   // COUNT ได้ number อยู่แล้ว ไม่ต้องแปลง
}

// ============================================================
// [C2] POST /brands   → 201 / 400 ขาด field / 409 ชื่อซ้ำ (ER_DUP_ENTRY)
// spec: "เพิ่มแบรนด์", "201 Created", "409 Conflict เมื่อชื่อซ้ำ"
// ============================================================
export async function createObject(body) {
    requireBody(body)                              // body ว่าง → 400
    const data = pick(body, ALLOWED)
    requireFields(data, REQUIRED)                  // ขาด → 400
    // ไม่ pre-check: ชื่อซ้ำ → MySQL 1062 → errorHandler ตอบ 409 DUPLICATE_KEY ข้อความกลางให้เอง
    return await repo.create(data)                 // คืนแถวดิบ (snake_case เหมือน GET /brands)
}

// ============================================================
// [D3][D10] DELETE /brands/:id   → 204 / 400 INVALID_ID / 404 / 409 RESOURCE_IN_USE
// spec: "ลบแบรนด์ที่ยังมีสินค้า → 409", "Cannot delete brand", "id ต้องเป็นตัวเลข"
// ============================================================
export async function removeObject(id) {
    if (!isIntId(id)) {                                        // 0) [D10] 'abc' → 400 ก่อนถึง DB (ใส่เฉพาะถ้า spec สั่ง)
        throw new AppError(`Invalid brand id '${id}'`, 400, 'INVALID_ID')   // ← ข้อความ / code ตาม spec
    }
    try {
        return await repo.remove(id)                           // 1) ไม่มี → 404  2) DELETE
    } catch (err) {                                            // ต้องมี await ข้างบน ไม่งั้น catch ไม่ทำงาน
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {           // 3) MySQL 1451: products ยังอ้าง brand นี้
            throw new AppError('Cannot delete brand because related products exist', 409, 'RESOURCE_IN_USE')   // ←
        }
        throw err                                              // error อื่น (เช่น 404) โยนต่อให้ errorHandler
    }
}

// ============================================================
// [D9] PATCH /brands/:id/deactivate   → 200 + แถวหลังแก้ (is_active: 0) / 404
// spec: "soft delete", "ปิดใช้งาน", "ไม่ลบจริง", "is_active = false"
// ============================================================
export async function deactivate(id) {
    return await repo.setActive(id, false)         // แถวยังอยู่ → ลูกยังอ้างได้ ไม่มี 1451
}
