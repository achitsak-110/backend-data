// {student-id} - {student-name}
// employees: list แบ่งหน้า + PUT ที่เช็คตามลำดับ 404 → email 400 → FK 400
// [R2] getAllObjects   [U3/U4] updateObject
import * as repo from '../repositories-$id/employee-repository.js'
import { AppError } from '../middlewares-$id/error-handler.js'
import { pick } from '../mappers-$id/dto-helpers.js'
import { bad, isEmail, requireBody } from '../middlewares-$id/validate.js'

// ← field ใน request body ของ spec (ไม่มี employeeNumber = PK มาจาก URL)
const ALLOWED = ['lastName', 'firstName', 'extension', 'email', 'officeCode', 'reportsTo', 'jobTitle']

// ============================================================
// [R2] GET /employees?page=&limit=   → 200 (+ pagination ถ้าส่ง page/limit)
// spec: "รองรับ ?page=&limit=", key ตามคอลัมน์ DB
// ============================================================
export async function getAllObjects(pagination = null) {
    return await repo.findAll(pagination)             // ส่งทุกคอลัมน์ตาม DB (ไม่มี DTO)
}

// ============================================================
// [U3/U4] PUT /employees/:employeeNumber   → 200 / 404 / 400
// spec: "Employee with ID '9999' was not found", "Invalid email address format", "Invalid office code or reporting manager ID"
// ============================================================
export async function updateObject(employeeNumber, body) {
    await repo.findOne(employeeNumber)                // 1) ไม่มีพนักงาน → 404 (เช็คก่อนเสมอตามลำดับ spec)
    requireBody(body)                                 //    body ว่าง → 400 VALIDATION_ERROR
    const data = pick(body, ALLOWED)
    if (Object.keys(data).length === 0) {             //    {"foo":1} → SET ว่าง = SQL พัง 500 → ดักเป็น 400
        bad('No updatable fields in request body')
    }
    if (data.email !== undefined && !isEmail(data.email)) {   // 2) ส่ง email มาแต่รูปแบบผิด → 400
        bad('Invalid email address format', 'INVALID_EMAIL')    // ← ข้อความ + code ตาม spec
    }
    try {
        return await repo.update(employeeNumber, data)          // 3) ให้ MySQL เช็ค FK เอง
    } catch (e) {
        if (e.code === 'ER_NO_REFERENCED_ROW_2') {              // 1452: officeCode / reportsTo ไม่มีจริง
            throw new AppError('Invalid office code or reporting manager ID', 400, 'FOREIGN_KEY_NOT_FOUND')   // ← ข้อความตาม spec
        }
        throw e                                                 // error อื่นโยนต่อให้ errorHandler
    }
}
