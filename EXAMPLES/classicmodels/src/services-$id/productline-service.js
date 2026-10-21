// {student-id} - {student-name}
// productlines: PK = productLine (VARCHAR ที่ client ส่งเอง)
// [C7] createObject   [U8] updateObject   [D6] removeObject
import * as repo from '../repositories-$id/productline-repository.js'
import { AppError } from '../middlewares-$id/error-handler.js'
import { pick } from '../mappers-$id/dto-helpers.js'
import { bad, requireBody, requireFields } from '../middlewares-$id/validate.js'

const ALLOWED = ['productLine', 'textDescription', 'htmlDescription']   // ← field ที่ POST รับ (ไม่รับ image BLOB)
const UPDATABLE = ['textDescription', 'htmlDescription']                // ← field ที่ PUT แก้ได้ (PK มาจาก URL)

// ============================================================
// [C7] POST /productlines   → 201 / 400 / 409
// spec: "Field 'productLine' is required and cannot be empty", "Product line 'X' already exists"
// ============================================================
export async function createObject(body) {
    const data = pick(body, ALLOWED)                   // ไม่ส่ง body / {} → {} → บรรทัดถัดไปตอบ 400
    requireFields(data, ['productLine'])               // ← field บังคับตาม spec
    try {
        return await repo.create(data)                 // ต้อง await ใน try ไม่งั้น catch จับไม่ได้
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {               // 1062: PK ซ้ำ → spec อยากได้ข้อความเฉพาะ
            throw new AppError(`Product line '${data.productLine}' already exists`, 409, 'DUPLICATE_KEY')   // ← ข้อความตาม spec
        }
        throw e                                        // อื่นๆ (ยาวเกิน 50 ตัว = 1406) → errorHandler ตอบ 400
    }
}

// ============================================================
// [U8] PUT /productlines/:productLine   → 200 / 404 / 400
// spec: "PK เป็น VARCHAR", "/productlines/Classic%20Cars"
// ============================================================
export async function updateObject(productLine, body) {
    await repo.findOne(productLine)                    // 1) ไม่มี → 404 ก่อน
    requireBody(body)                                  // 2) body ว่าง → 400
    const data = pick(body, UPDATABLE)                 //    productLine ใน body ถูกทิ้ง (ห้ามแก้ PK)
    if (Object.keys(data).length === 0) {              // 3) ส่งแต่ field แปลก → SET ว่าง = SQL พัง → ดักเป็น 400
        bad('No updatable fields in request body')
    }
    return await repo.update(productLine, data)        // 4) แก้ + คืนแถวหลังแก้
}

// ============================================================
// [D6] DELETE /productlines/:productLine   → 200 / 404 / 409
// spec: "ห้ามลบถ้ามีสินค้าใช้อยู่", "used by 3 products" (นับลูกก่อนแบบ D4)
// ============================================================
export async function removeObject(productLine) {
    await repo.findOne(productLine)                        // 1) ไม่มี → 404 PRODUCTLINE_NOT_FOUND
    const used = await repo.countProducts(productLine)     // 2) มี products ใช้อยู่กี่ตัว
    if (used > 0) {                                        // 3) ยังมีลูก → 409 ไม่ไปถึง DELETE
        throw new AppError(`Cannot delete product line '${productLine}' because it is used by ${used} products`,
            409, 'RESOURCE_IN_USE')                        // ← ข้อความ / code ตาม spec
    }
    // ไม่นับก็ได้: ลบเลย → MySQL 1451 → errorHandler ตอบ 409 RESOURCE_IN_USE (ข้อความกลาง)
    return await repo.remove(productLine)                  // 4) ไม่มีลูก → ลบจริง
}
