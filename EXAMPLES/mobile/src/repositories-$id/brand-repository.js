// {student-id} - {student-name}
// brand-repository.js  SQL ของตาราง brands + ลูก (products ของ brand)
// [R1] findAll  [R4B] findOne  [R6] findProducts  [R12] findStats
// [C2] create  [D3] remove  [D9] setActive
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'

const TABLE_NAME = "brands"                   // ← ชื่อตาราง
const PK = "id"                               // ← primary key
const NOT_FOUND_CODE = 'BRAND_NOT_FOUND'      // ← code ตาม spec
const notFoundMsg = (id) => `Brand with id '${id}' was not found`   // ← ข้อความตาม spec

const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY ${PK}`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE ${PK} = ?`
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE ${PK} = ?`
const SET_ACTIVE_SQL = `UPDATE ${TABLE_NAME} SET is_active = ? WHERE ${PK} = ?`   // ← คอลัมน์สถานะ

// ============================================================
// [R1] findAll()   → ทุกแถว key = ชื่อคอลัมน์ (snake_case) ไม่ทำ DTO
// spec: "country_of_origin", "is_active": 1, "created_at": "2024-01-01T00:00:00.000Z"
// ============================================================
export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)        // * = ทุกคอลัมน์ / created_at เป็น ISO เพราะ timezone 'Z'
    return rows
}

// ============================================================
// [R4B] findOne(id)   → แถวเดียว / ไม่เจอ → 404 BRAND_NOT_FOUND
// spec: "GET /brands/:id", "404 Not Found", "BRAND_NOT_FOUND"
// ============================================================
export async function findOne(id) {
    const [rows] = await db.query(FIND_ONE_SQL, [id])
    if (rows.length === 0) throw new AppError(notFoundMsg(id), 404, NOT_FOUND_CODE)
    return rows[0]
}

// ============================================================
// [R6] findProducts(brandId, req.pagination)   → products ของ brand นี้ (+ COUNT WHERE เดียวกัน)
// spec: "GET /brands/:id/products", "สินค้าของแบรนด์", "sub-collection"
// ============================================================
const PRODUCTS_OF_BRAND = 'SELECT * FROM products WHERE brand_id = ? ORDER BY id'          // ← ตารางลูก + FK
const COUNT_PRODUCTS_OF_BRAND = 'SELECT COUNT(*) AS total FROM products WHERE brand_id = ?'

export async function findProducts(brandId, pagination = null) {
    if (!pagination) {
        const [rows] = await db.query(PRODUCTS_OF_BRAND, [brandId])
        return rows                                    // ไม่มีสินค้า → [] (ไม่ใช่ 404)
    }
    const {limit, offset} = pagination
    // ? 3 ตัว → ค่า 3 ตัวเรียงตามลำดับ: brand_id, LIMIT, OFFSET
    const [rows] = await db.query(PRODUCTS_OF_BRAND + ' LIMIT ? OFFSET ?', [brandId, limit, offset])
    const [[{ total }]] = await db.query(COUNT_PRODUCTS_OF_BRAND, [brandId])   // นับเฉพาะของ brand นี้
    rows.totalItems = total
    return rows
}

// ============================================================
// [R12] findStats()   → COUNT / SUM / AVG ต่อ brand (LEFT JOIN)
// spec: "สถิติ", "stats", "จำนวนสินค้าต่อแบรนด์", "ราคาเฉลี่ย", "รวม stock"
// ============================================================
// LEFT JOIN → brand ที่ไม่มีสินค้ายังออกมา (product_count = 0) / JOIN ธรรมดา → brand นั้นหาย
const STATS_SQL = `SELECT b.id, b.name, b.is_active,
        COUNT(p.id) AS product_count,
        COALESCE(SUM(p.stock_quantity), 0) AS total_stock,
        ROUND(AVG(p.price), 2) AS avg_price
    FROM brands b LEFT JOIN products p ON p.brand_id = b.id
    GROUP BY b.id, b.name, b.is_active
    ORDER BY b.id`                                     // ← COUNT(p.id) ไม่ใช่ COUNT(*) (COUNT(*) ได้ 1 แทน 0)

export async function findStats() {
    const [rows] = await db.query(STATS_SQL)
    return rows                                        // SUM / AVG มาเป็น string → แปลงใน service
}

// ============================================================
// [C2] create(data)   → INSERT (name ซ้ำ → MySQL 1062 → 409 DUPLICATE_KEY)
// spec: "POST /brands", "201 Created", "409 Conflict เมื่อชื่อซ้ำ"
// ============================================================
export async function create(data) {
    const [result] = await db.query(CREATE_SQL, [data])   // name UNIQUE ซ้ำ → throw ER_DUP_ENTRY ออกไปเอง
    return findOne(result.insertId)                       // อ่านกลับทั้งแถว (ได้ is_active, created_at จาก DEFAULT)
}

// ============================================================
// [D3] remove(id)   → 404 ก่อน / ยังมีลูก → MySQL 1451 (service แปลงเป็น 409)
// spec: "DELETE /brands/:id", "ลบแบรนด์ที่ยังมีสินค้า", "409 Conflict"
// ============================================================
export async function remove(id) {
    await findOne(id)                                  // 1) ไม่มี → 404 BRAND_NOT_FOUND (ต้องเช็คก่อน 409)
    const [result] = await db.query(REMOVE_SQL, [id])  // 2) products ยังอ้างอยู่ → ER_ROW_IS_REFERENCED_2 (1451)
    return result
}

// ============================================================
// [D9] setActive(id, false)   → UPDATE is_active (soft delete ไม่ลบแถวจริง)
// spec: "soft delete", "ปิดใช้งาน", "deactivate", "is_active = false"
// ============================================================
export async function setActive(id, active) {
    await findOne(id)                                    // ไม่มี → 404
    await db.query(SET_ACTIVE_SQL, [active ? 1 : 0, id]) // BOOLEAN ของ MySQL = TINYINT 0 / 1
    return findOne(id)                                   // คืนแถวหลังแก้ (is_active: 0)
}
