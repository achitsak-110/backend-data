// {student-id} - {student-name}
// service = business logic: เลือก field, ตรวจข้อมูล, เช็คซ้ำ, แปลง DTO
import * as repo from "../repositories-$id/repository.js"
import mapper from "../mappers-$id/entity-dto-mapper.js"
import { AppError } from '../middlewares-$id/error-handler.js'

// ← คอลัมน์ที่ client ส่งมาได้ (ดู request body ใน spec) field อื่นถูกทิ้ง
const ALLOWED = ['sku', 'name', 'brand_id', 'category', 'price', 'ram_gb', 'storage_gb',
    'color', 'stock_quantity', 'status', 'release_date']
// ← คอลัมน์ NOT NULL ที่ไม่มี DEFAULT (ดูในไฟล์ .sql) ขาด → 400
const REQUIRED = ['sku', 'name', 'brand_id', 'category', 'price', 'ram_gb', 'storage_gb', 'color']

// เอาเฉพาะ key ที่อนุญาต
const pick = (obj, keys) => Object.fromEntries(keys.filter(k => obj?.[k] !== undefined).map(k => [k, obj[k]]))
const bad = (message, code = 'VALIDATION_ERROR') => { throw new AppError(message, 400, code) }

export async function getObject(id, viewType = 'full') {
    return mapper.map(await repo.findOne(id), viewType);     // แก้: ส่ง viewType ต่อ / ไม่เจอ repo throw 404
}

export async function getAllObjects(pagination = null, viewType = 'summary') {
    const objects = await repo.findAll(pagination)           // แก้: เดิมไม่ส่ง pagination
    return mapper.maps(objects, viewType)                    // แก้: เดิมไม่แปลง DTO
}

export async function createObject(data) {
    if (!data || Object.keys(data).length === 0) bad('Request body is empty')
    const row = pick(data, ALLOWED)
    for (const f of REQUIRED) {                               // ขาด / ว่าง → 400
        if (row[f] === undefined || row[f] === null || String(row[f]).trim() === '') {
            bad(`Field '${f}' is required and cannot be empty`)
        }
    }
    if (await repo.findBy('sku', row.sku)) {                  // ← คอลัมน์ UNIQUE → ซ้ำ 409
        throw new AppError(`SKU '${row.sku}' already exists`, 409, 'DUPLICATE_KEY')
    }
    // brand_id ไม่มีจริง → MySQL 1452 → errorHandler ตอบ 400 FOREIGN_KEY_NOT_FOUND เอง
    return mapper.map(await repo.create(row), 'full')
}

export async function updateObject(id, data) {
    await repo.findOne(id)                                    // ไม่มี id → 404 ก่อน
    if (!data || Object.keys(data).length === 0) bad('Request body is empty')
    const row = pick(data, ALLOWED)
    if (Object.keys(row).length === 0) bad('No updatable fields in request body')   // กัน SET ว่าง → 500
    if (row.sku !== undefined) {                              // sku ไปซ้ำกับสินค้าตัวอื่น → 409
        const other = await repo.findBy('sku', row.sku)
        if (other && String(other.id) !== String(id)) {
            throw new AppError(`SKU '${row.sku}' already exists`, 409, 'DUPLICATE_KEY')
        }
    }
    return mapper.map(await repo.update(id, row), 'full')
}

export async function removeObject(id) {
    return await repo.remove(id)                              // ไม่มี → 404 / ถูกอ้าง → 409
}
