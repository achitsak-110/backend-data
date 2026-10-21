// {student-id} - {student-name}
// offices: PK = officeCode เป็น VARCHAR(10) ('1', '7') → ห้ามแปลงเป็น number
// [R1] findAll   [R5] findOne
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'

const TABLE_NAME = 'offices'                  // ← ชื่อตาราง
const PK = 'officeCode'                       // ← PK
const NOT_FOUND_CODE = 'OFFICE_NOT_FOUND'     // ← code ตาม spec
const notFoundMsg = (code) => `Office with code '${code}' was not found`   // ← ข้อความตาม spec

const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY ${PK}`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE ${PK} = ?`

// ============================================================
// [R1] GET /offices   → 200 (ทุกแถว ไม่แบ่งหน้า)
// spec: "แสดงสำนักงานทั้งหมด", key ตามชื่อคอลัมน์ DB
// ============================================================
export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)   // [rows, fields] → เอาแค่ rows
    return rows
}

// ============================================================
// [R5] GET /offices/:officeCode   → 200 / 404
// spec: "Office with code '99' was not found", "OFFICE_NOT_FOUND"
// ============================================================
export async function findOne(officeCode) {
    const [rows] = await db.query(FIND_ONE_SQL, [officeCode])   // ? ใส่ quote ให้ string เอง
    if (rows.length === 0) {
        throw new AppError(notFoundMsg(officeCode), 404, NOT_FOUND_CODE)   // ไม่เจอ → 404 (ห้ามส่ง null)
    }
    return rows[0]
}
