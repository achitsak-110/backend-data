// {student-id} - {student-name}
// productlines: PK = productLine เป็น VARCHAR(50) ที่ client ส่งมาเอง (ไม่ใช่ auto increment)
// [C7] findOne, create   [U8] update   [D6] countProducts, remove
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'

const TABLE_NAME = 'productlines'                 // ← ชื่อตาราง
const PK = 'productLine'                          // ← PK (VARCHAR)
const NOT_FOUND_CODE = 'PRODUCTLINE_NOT_FOUND'    // ← code ตาม spec
const notFoundMsg = (id) => `Product line '${id}' was not found`   // ← ข้อความตาม spec

// ไม่ SELECT * เพราะมีคอลัมน์ image (MEDIUMBLOB) → เลือกเฉพาะคอลัมน์ที่จะส่งกลับ
const FIND_ONE_SQL = `SELECT productLine, textDescription, htmlDescription FROM ${TABLE_NAME} WHERE ${PK} = ?`
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`               // ? = object → col = val, ...
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE ${PK} = ?`    // ? แรก = object, ? สอง = PK
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE ${PK} = ?`
const COUNT_PRODUCTS_SQL = 'SELECT COUNT(*) AS total FROM products WHERE productLine = ?'   // ← ตารางลูก

// ============================================================
// [C7] หา productline 1 ตัว (ใช้ทั้ง C7 U8 D6)   → 404 PRODUCTLINE_NOT_FOUND
// spec: "Product line 'X' was not found"
// ============================================================
export async function findOne(productLine) {
    const [rows] = await db.query(FIND_ONE_SQL, [productLine])
    if (rows.length === 0) {
        throw new AppError(notFoundMsg(productLine), 404, NOT_FOUND_CODE)
    }
    return rows[0]
}

// ============================================================
// [C7] INSERT productline (PK มาจาก body)   → แถวที่สร้าง / PK ซ้ำ = MySQL 1062
// spec: "productLine เป็น VARCHAR(50) (Non-Auto-Increment รับค่าจาก Client)"
// ============================================================
export async function create(data) {
    await db.query(CREATE_SQL, [data])       // PK ซ้ำ → throw ER_DUP_ENTRY (service ดักต่อ)
    return findOne(data[PK])                 // ไม่มี insertId (ได้ 0) → หาด้วยค่าที่ client ส่งมา
}

// ============================================================
// [U8] UPDATE productline ด้วย PK string ('Classic Cars')   → แถวหลังแก้ / 404
// spec: "PUT /productlines/:productLine", "แก้ textDescription"
// ============================================================
export async function update(productLine, data) {
    await findOne(productLine)                          // ไม่มี → 404
    await db.query(UPDATE_SQL, [data, productLine])     // เรียง ? ตามลำดับใน SQL
    return findOne(productLine)                         // คืนข้อมูลหลังแก้
}

// ============================================================
// [D6] นับ products ที่ยังใช้ productLine นี้   → จำนวน (0 = ลบได้)
// spec: "ห้ามลบถ้ายังมีสินค้าใช้อยู่", "used by 3 products"
// ============================================================
export async function countProducts(productLine) {
    const [[{ total }]] = await db.query(COUNT_PRODUCTS_SQL, [productLine])   // [[{ total: 3 }], fields] → 3
    return total
}

// ============================================================
// [D6] DELETE productline ด้วย PK string   → true / 404
// spec: "DELETE /productlines/:productLine"
// ============================================================
export async function remove(productLine) {
    const [result] = await db.query(REMOVE_SQL, [productLine])   // ยังมีลูก (ไม่ได้นับก่อน) → MySQL 1451 → 409
    if (result.affectedRows === 0) {                              // ไม่มีแถวให้ลบ → 404
        throw new AppError(notFoundMsg(productLine), 404, NOT_FOUND_CODE)
    }
    return true
}
