// {student-id} - {student-name}
// employees: PK = employeeNumber (INT) / FK: officeCode → offices, reportsTo → employees
// [R2] count, findAll   [U3] findOne, update
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'

const TABLE_NAME = 'employees'                    // ← ชื่อตาราง
const PK = 'employeeNumber'                       // ← PK
const NOT_FOUND_CODE = 'EMPLOYEE_NOT_FOUND'       // ← code ตาม spec
const notFoundMsg = (id) => `Employee with ID '${id}' was not found`   // ← ข้อความตาม spec

const COUNT_ALL = `SELECT COUNT(*) AS total FROM ${TABLE_NAME}`
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY ${PK}`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE ${PK} = ?`
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE ${PK} = ?`   // ? แรก = object ของ field ที่จะแก้

// ============================================================
// [R2] นับทั้งตาราง (ใช้คำนวณ totalPages)   → 23
// spec: "pagination: total, totalPages"
// ============================================================
export async function count() {
    const [[{ total }]] = await db.query(COUNT_ALL)    // [[{ total: 23 }], fields] → 23
    return total
}

// ============================================================
// [R2] GET /employees?page=&limit=   → ทั้งหมด (ไม่ส่ง page/limit) / หน้าเดียว + totalItems
// spec: "รองรับ ?page=&limit=", "ไม่ส่ง → แสดงทั้งหมด"
// ============================================================
export async function findAll(pagination = null) {
    if (!pagination) {                                 // queryParser ให้ null = ไม่แบ่งหน้า
        const [rows] = await db.query(FIND_ALL_SQL)
        return rows
    }
    const SQL = FIND_ALL_SQL + ' LIMIT ? OFFSET ?'
    const {limit, offset} = pagination
    const [rows] = await db.query(SQL, [limit, offset])
    rows.totalItems = await count()                    // api-response ใช้คำนวณ totalPages
    return rows
}

// ============================================================
// [U3] หา employee 1 คน   → 404 EMPLOYEE_NOT_FOUND
// spec: "Employee with ID '9999' was not found"
// ============================================================
export async function findOne(employeeNumber) {
    const [rows] = await db.query(FIND_ONE_SQL, [employeeNumber])
    if (rows.length === 0) {
        throw new AppError(notFoundMsg(employeeNumber), 404, NOT_FOUND_CODE)
    }
    return rows[0]
}

// ============================================================
// [U3] UPDATE employee   → แถวหลังแก้ / FK ไม่มีจริง = MySQL 1452
// spec: "officeCode ต้องมีอยู่จริง", "reportsTo ต้องมีอยู่จริง"
// ============================================================
export async function update(employeeNumber, data) {
    await findOne(employeeNumber)                          // กันพลาด: ไม่มี → 404
    await db.query(UPDATE_SQL, [data, employeeNumber])     // FK ผิด → throw ER_NO_REFERENCED_ROW_2 ออกไป
    return findOne(employeeNumber)                         // คืนแถวหลังแก้
}
