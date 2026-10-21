// {student-id} - {student-name}
// product-service.js  business logic: เลือก field, ตรวจข้อมูล, เช็คซ้ำ, แปลง DTO
// [R1][R2][R3][R8-10] getAllObjects  [R4][R11] getObject  [C1][C4] createObject  [C5] createObjectCamel
// [U1] updateObject  [U7] patchObject  [D1] removeObject
import * as repo from "../repositories-$id/product-repository.js"
import mapper from "../mappers-$id/entity-dto-mapper.js"
import { AppError } from '../middlewares-$id/error-handler.js'
import { pick, snakeKeys } from '../mappers-$id/dto-helpers.js'
import { bad, requireBody, requireFields, isPositive, isRealDate } from '../middlewares-$id/validate.js'

// ← คอลัมน์ที่ client ส่งมาได้ (ดู request body ใน spec) field อื่น (id, created_at) ถูกทิ้งตอน pick
const ALLOWED = ['sku', 'name', 'brand_id', 'category', 'price', 'ram_gb', 'storage_gb',
    'color', 'stock_quantity', 'status', 'release_date']
// ← คอลัมน์ NOT NULL ที่ไม่มี DEFAULT (ดูในไฟล์ .sql) ขาด → 400
const REQUIRED = ['sku', 'name', 'brand_id', 'category', 'price', 'ram_gb', 'storage_gb', 'color']
// ← ค่าที่อนุญาต (comment ในไฟล์ .sql / spec) ข้อมูลตั้งต้นมี STANDARD ด้วย
const CATEGORIES = ['FLAGSHIP', 'MID_RANGE', 'BUDGET', 'FOLDABLE', 'STANDARD']
const STATUSES = ['AVAILABLE', 'OUT_OF_STOCK', 'DISCONTINUED']
// query ที่ต้องใช้ findFiltered (ไม่มีตัวไหนเลย → findAll / findPage)
const LIST_QUERY_KEYS = ['category', 'status', 'brandId', 'q', 'sort', 'order']

// ============================================================
// [R1][R2][R3][R8-10] getAllObjects(req.pagination, 'summary', req.query)   → array DTO
// spec: "รายการ", "แบ่งหน้า", "Summary DTO", "filter", "search", "sort"
// ============================================================
export async function getAllObjects(pagination = null, viewType = 'summary', query = {}) {
    let objects
    if (LIST_QUERY_KEYS.some((k) => query[k] !== undefined)) {
        objects = await repo.findFiltered(query, pagination)   // [R8][R9][R10] มี filter / q / sort
    } else if (pagination) {
        objects = await repo.findPage(pagination)              // [R2] มีแค่ page / limit
    } else {
        objects = await repo.findAll()                         // [R1] ไม่มี query เลย
    }
    return mapper.maps(objects, viewType)                      // [R3] แถว DB → Summary DTO
}

// ============================================================
// [R4][R11] getObject(id, 'full' | 'nested')   → 200 / 404
// spec: "Detail DTO", "brandName", "?view=nested", "brand": { "id", "name" }
// ============================================================
export async function getObject(id, viewType = 'full') {
    return mapper.map(await repo.findOne(id), viewType)        // ไม่เจอ → repo throw 404
}

// ============================================================
// [C4][U3] validateProduct(data)   → ค่าผิด → 400 VALIDATION_ERROR (ตรวจเฉพาะ field ที่ส่งมา)
// spec: "ต้องมากกว่า 0", "ค่าที่อนุญาต", "YYYY-MM-DD", "must be one of"
// ============================================================
// undefined = ไม่ได้ส่ง → ข้าม จึงใช้ได้ทั้ง POST (หลัง requireFields) / PUT / PATCH
function validateProduct(data) {
    for (const f of REQUIRED) {                                // ส่งมาแต่เป็น null / '' → 400 (PUT / PATCH)
        if (data[f] !== undefined) requireFields(data, [f])
    }
    if (data.price !== undefined && !isPositive(data.price)) {                 // 0, -5, "abc" → 400
        bad("Field 'price' must be a number greater than 0")                   // ← ข้อความตาม spec
    }
    for (const f of ['ram_gb', 'storage_gb']) {                                // INT: 1.5 MySQL ปัดเงียบๆ ต้องดักเอง
        if (data[f] !== undefined && !(Number.isInteger(data[f]) && data[f] > 0)) {
            bad(`Field '${f}' must be a positive integer`)
        }
    }
    if (data.stock_quantity !== undefined && !(Number.isInteger(data.stock_quantity) && data.stock_quantity >= 0)) {
        bad("Field 'stock_quantity' must be an integer >= 0")
    }
    if (data.category !== undefined && !CATEGORIES.includes(data.category)) {
        bad(`Field 'category' must be one of: ${CATEGORIES.join(', ')}`)
    }
    if (data.status !== undefined && !STATUSES.includes(data.status)) {
        bad(`Field 'status' must be one of: ${STATUSES.join(', ')}`)
    }
    if (data.release_date != null && !isRealDate(data.release_date)) {       // null = ไม่ระบุวัน (คอลัมน์ NULL ได้)
        bad("Field 'release_date' must be a valid date (YYYY-MM-DD)")
    }
}

// ============================================================
// [C1] POST /products   → 201 / 400 ค่าผิด / 409 sku ซ้ำ / 400 brand_id ไม่มีจริง
// spec: "เพิ่มสินค้า", "201 Created", "409 Conflict เมื่อ SKU ซ้ำ"
// ============================================================
export async function createObject(body) {
    requireBody(body)                                     // body ว่าง → 400
    const data = pick(body, ALLOWED)                      // id / field แปลก ถูกทิ้ง
    requireFields(data, REQUIRED)                         // ขาด → 400 "Field 'x' is required..."
    validateProduct(data)                                 // [C4] ค่าผิด → 400
    if (await repo.findBy('sku', data.sku)) {             // [C2] ← คอลัมน์ UNIQUE: เช็คก่อน insert เพื่อคุมข้อความเอง
        throw new AppError(`SKU '${data.sku}' already exists`, 409, 'DUPLICATE_KEY')   // ← ข้อความตาม spec
    }
    // [C3] brand_id ไม่มีจริง → MySQL 1452 → errorHandler ตอบ 400 FOREIGN_KEY_NOT_FOUND เอง
    return mapper.map(await repo.create(data), 'full')    // คืน Detail DTO (route ส่ง 201)
}

// ============================================================
// [C5] POST /products/camel   → body camelCase (brandId, ramGb) → คอลัมน์ snake_case
// spec: request body เป็น "brandId", "ramGb", "storageGb", "stockQuantity"
// ============================================================
const REQUIRED_CAMEL = ['sku', 'name', 'brandId', 'category', 'price', 'ramGb', 'storageGb', 'color']   // ← ชื่อตาม spec

export async function createObjectCamel(body) {
    requireBody(body)
    requireFields(body, REQUIRED_CAMEL)                   // ข้อความ error ใช้ชื่อที่ client ส่ง ("Field 'brandId' ...")
    return createObject(snakeKeys(body))                  // brandId → brand_id แล้วใช้ [C1] ต่อทั้งหมด
}

// ============================================================
// [U1] PUT /products/:id   → 200 / 404 → 400 → 409 sku ซ้ำ → 400 FK
// spec: "แก้ไขสินค้า", "200 OK", "404 Not Found หากไม่พบ ID"
// ============================================================
// รับบาง field ได้ (test อาจารย์ W8 ส่งมาแค่ name, price, stock_quantity)
export async function updateObject(id, body) {
    await repo.findOne(id)                                // 1) ไม่มี id → 404 ก่อนเรื่องอื่น
    requireBody(body)                                     // 2) body ว่าง → 400
    const data = pick(body, ALLOWED)                      //    body camelCase → pick(snakeKeys(body), ALLOWED) แบบ [C5]
    if (Object.keys(data).length === 0) {                 //    {"foo": 1} → เหลือ {} → SET ว่าง = SQL พัง 500
        bad('No updatable fields in request body')
    }
    validateProduct(data)                                 //    [U3] ค่าผิด → 400
    if (data.sku !== undefined) {                         // 3) [U5] sku ซ้ำกับ "สินค้าตัวอื่น" → 409
        const other = await repo.findBy('sku', data.sku)
        if (other && String(other.id) !== String(id)) {   //    เจอตัวเอง = ส่ง sku เดิมมา ไม่ใช่ซ้ำ
            throw new AppError(`SKU '${data.sku}' already exists`, 409, 'DUPLICATE_KEY')
        }
    }
    // 4) [U4] brand_id ไม่มีจริง → MySQL 1452 → 400 FOREIGN_KEY_NOT_FOUND
    return mapper.map(await repo.update(id, data), 'full')
}

// ============================================================
// [U7] PATCH /products/:id   → 200 แก้เฉพาะ field ที่ส่งมา / 404 / 400
// spec: "PATCH", "แก้บาง field", "partial update", "อัปเดตสถานะ"
// ============================================================
export async function patchObject(id, body) {
    await repo.findOne(id)                                // ไม่มี id → 404
    const data = pick(body, ALLOWED)                      // field ที่ไม่ส่ง = undefined → ถูกตัด → คอลัมน์นั้นไม่ถูกแตะ
    if (Object.keys(data).length === 0) bad('No updatable fields in request body')
    validateProduct(data)                                 // ตรวจเฉพาะที่ส่งมา
    // ไม่ pre-check sku → ซ้ำ = MySQL 1062 → errorHandler ตอบ 409 DUPLICATE_KEY (ข้อความกลาง)
    return mapper.map(await repo.update(id, data), 'full')
}

// ============================================================
// [D1] DELETE /products/:id   → 204 / 404
// spec: "ลบสินค้า", "204 No Content", "404 Not Found หากไม่พบ ID"
// ============================================================
export async function removeObject(id) {
    return await repo.remove(id)                          // ไม่มี → 404 (repo throw) / ถูกอ้าง → 409
}
