// {student-id} - {student-name}
// customers (แม่) + payments (ลูก, composite PK = customerNumber + checkNumber)
// [R2A] findAll   [D2] findOne, remove   [R7] findPayments
// [C8] findPayment, createPayment   [D7] removePayment
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'
import { isIntId } from '../middlewares-$id/validate.js'

const TABLE_NAME = 'customers'                    // ← ตารางแม่
const PK = 'customerNumber'                       // ← PK (INT)
const NOT_FOUND_CODE = 'CUSTOMER_NOT_FOUND'       // ← code ตาม spec
const notFoundMsg = (id) => `Customer with number '${id}' was not found`   // ← ข้อความ (spec ไม่ให้ → ตั้งแบบเดียวกับ office)

const COUNT_ALL = `SELECT COUNT(*) AS total FROM ${TABLE_NAME}`
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY ${PK} LIMIT ? OFFSET ?`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE ${PK} = ?`
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE ${PK} = ?`

// ตารางลูก payments: PK มี 2 คอลัมน์ → WHERE ต้องครบทั้งคู่ (ขาดตัวไหน = โดนแถวของลูกค้าคนอื่น)
const FIND_PAYMENTS_SQL = 'SELECT * FROM payments WHERE customerNumber = ? ORDER BY paymentDate'
const FIND_PAYMENT_SQL = 'SELECT * FROM payments WHERE customerNumber = ? AND checkNumber = ?'
const CREATE_PAYMENT_SQL = 'INSERT INTO payments SET ?'
const REMOVE_PAYMENT_SQL = 'DELETE FROM payments WHERE customerNumber = ? AND checkNumber = ?'

// ============================================================
// [R2A] GET /customers   → 1 หน้า + totalItems (pagination มีเสมอ)
// spec: "default page = 1, limit = 10", "total / totalPages"
// ============================================================
export async function findAll(pagination) {
    const {limit, offset} = pagination                         // alwaysPaginate → ไม่มีทางเป็น null
    const [rows] = await db.query(FIND_ALL_SQL, [limit, offset])
    const [[{ total }]] = await db.query(COUNT_ALL)            // [[{ total: 122 }], fields] → 122
    rows.totalItems = total                                    // api-response ใช้คำนวณ totalPages
    return rows
}

// ============================================================
// [D2] หา customer 1 คน (ใช้เช็คแม่ก่อนทุกข้อ: D2 R7 C8 D7)   → 404 CUSTOMER_NOT_FOUND
// spec: "ตรวจสอบว่าลูกค้า :customerNumber มีตัวตนหรือไม่", "CUSTOMER_NOT_FOUND"
// ============================================================
export async function findOne(customerNumber) {
    if (!isIntId(customerNumber)) {             // '103abc' → MySQL แปลงเป็น 103 = เจอผิดคน → 404 เลย
        throw new AppError(notFoundMsg(customerNumber), 404, NOT_FOUND_CODE)
    }
    const [rows] = await db.query(FIND_ONE_SQL, [customerNumber])
    if (rows.length === 0) {
        throw new AppError(notFoundMsg(customerNumber), 404, NOT_FOUND_CODE)
    }
    return rows[0]
}

// ============================================================
// [D2] DELETE customer   → true / 404 / มีลูกอ้างอยู่ = MySQL 1451
// spec: "DELETE FROM customers WHERE customerNumber = ?"
// ============================================================
export async function remove(customerNumber) {
    await findOne(customerNumber)                        // 1) ไม่มี → 404
    await db.query(REMOVE_SQL, [customerNumber])         // 2) มี orders / payments → throw ER_ROW_IS_REFERENCED_2
    return true
}

// ============================================================
// [R7] payments ทั้งหมดของลูกค้า 1 คน   → [] ได้ (ไม่ใช่ error)
// spec: "GET /customers/:customerNumber/payments"
// ============================================================
export async function findPayments(customerNumber) {
    const [rows] = await db.query(FIND_PAYMENTS_SQL, [customerNumber])
    return rows
}

// ============================================================
// [C8] หา payment ด้วย composite PK   → แถว / null
// spec: "Composite Key คู่ (customerNumber, checkNumber)"
// ============================================================
export async function findPayment(customerNumber, checkNumber) {
    const [rows] = await db.query(FIND_PAYMENT_SQL, [customerNumber, checkNumber])
    return rows[0] ?? null                                // ไม่เจอ → null (service เป็นคนตัดสินว่า 404 ไหม)
}

// ============================================================
// [C8] INSERT payment   → แถวที่สร้าง / PK คู่ซ้ำ = MySQL 1062
// spec: "checkNumber ซ้ำเดิมสำหรับลูกค้ารายเดิม → ER_DUP_ENTRY"
// ============================================================
export async function createPayment(data) {
    await db.query(CREATE_PAYMENT_SQL, [data])                  // PK คู่ซ้ำ → throw ER_DUP_ENTRY
    return findPayment(data.customerNumber, data.checkNumber)   // ไม่มี insertId → อ่านกลับด้วย PK ทั้ง 2 ตัว
}

// ============================================================
// [D7] DELETE payment ด้วย composite PK   → true (ลบได้) / false (ไม่มีแถวนี้)
// spec: "DELETE /customers/:customerNumber/payments/:checkNumber"
// ============================================================
export async function removePayment(customerNumber, checkNumber) {
    const [result] = await db.query(REMOVE_PAYMENT_SQL, [customerNumber, checkNumber])
    return result.affectedRows > 0                       // 0 แถว = ไม่มี payment นี้ของลูกค้าคนนี้
}
