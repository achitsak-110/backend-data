// {student-id} - {student-name}
// product-repository.js  SQL ของตาราง products อย่างเดียว (ไม่มี business logic)
// [R1] findAll  [R2] findPage  [R8] buildFilter  [R9] buildSearch  [R10] buildSort  [R8-10] findFiltered
// [R4] findOne (JOIN)  [C1] findBy / create  [U1][U7] update  [D1] remove
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'

const TABLE_NAME = "products"                 // ← ชื่อตาราง
const PK = "id"                               // ← primary key
const NOT_FOUND_CODE = 'PRODUCT_NOT_FOUND'    // ← code ตาม spec
const notFoundMsg = (id) => `Product with id '${id}' was not found`   // ← ข้อความตาม spec

const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY ${PK}`
const COUNT_ALL = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`
// detail ต้องมี brandName → JOIN brands (name ชนกัน → ตั้งชื่อใหม่ด้วย AS)
const FIND_ONE_SQL = `SELECT p.*, b.name AS brand_name
    FROM ${TABLE_NAME} p JOIN brands b ON b.id = p.brand_id
    WHERE p.${PK} = ?`                                            // ← brands / brand_id = ตารางแม่ + FK
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`             // ? = object → col = val, ...
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE ${PK} = ?`   // ? แรก = object, ? สอง = id
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE ${PK} = ?`    // ต้องมี WHERE เสมอ ไม่งั้นหายทั้งตาราง

// ============================================================
// [R1] findAll()   → ทุกแถว ไม่แบ่งหน้า
// spec: "รายการทั้งหมด", "GET all", "list"
// ============================================================
export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)        // [rows, fields] → เอาแค่ rows
    return rows
}

// ============================================================
// [R2] count()   → จำนวนแถวทั้งตาราง (ใช้คำนวณ totalPages)
// spec: "total", "totalPages"
// ============================================================
export async function count() {
    const [[{ total }]] = await db.query(COUNT_ALL)    // [[{ total: 75 }], fields] → 75
    return total
}

// ============================================================
// [R2] findPage(req.pagination)   → LIMIT ? OFFSET ? + totalItems
// spec: "แบ่งหน้า", "page", "limit", "pagination"
// ============================================================
export async function findPage(pagination) {
    const {limit, offset} = pagination                 // number แล้ว (middleware parseInt ให้)
    const [rows] = await db.query(FIND_ALL_SQL + ' LIMIT ? OFFSET ?', [limit, offset])   // เว้นวรรคก่อน LIMIT
    rows.totalItems = await count()                    // แปะบน array → api-response ใช้คำนวณ totalPages
    return rows
}

// ============================================================
// [R8] buildFilter(req.query)   → WHERE category = ? AND status = ? AND brand_id = ?
// spec: "filter", "กรองตาม", "?category=", "?status=", "?brandId="
// ============================================================
function buildFilter(query) {
    const conditions = []
    const params = []
    if (query.category) {                              // ?category=FLAGSHIP
        conditions.push('category = ?')                // ← ชื่อคอลัมน์จริงใน DB
        params.push(query.category)                    // ค่าจาก client ใส่ผ่าน ? เสมอ (ห้ามต่อ string)
    }
    if (query.status) {                                // ?status=AVAILABLE
        conditions.push('status = ?')
        params.push(query.status)
    }
    if (query.brandId) {                               // ?brandId=2  (ชื่อใน URL ≠ ชื่อคอลัมน์)
        conditions.push('brand_id = ?')
        params.push(query.brandId)
    }
    return { conditions, params }
}

// ============================================================
// [R9] buildSearch(req.query)   → WHERE name LIKE '%คำ%'
// spec: "search", "ค้นหา", "?q=", "ชื่อมีคำว่า", "keyword"
// ============================================================
function buildSearch(query) {
    if (!query.q) return { conditions: [], params: [] }                    // ไม่ส่ง q → ไม่ค้นหา
    return { conditions: ['name LIKE ?'], params: [`%${query.q}%`] }       // ← คอลัมน์ที่ค้น / % ใส่ในค่า ไม่ใช่ใน SQL
    // ค้นหลายคอลัมน์: conditions: ['(name LIKE ? OR sku LIKE ?)'], params: [`%${q}%`, `%${q}%`]
}

// ============================================================
// [R10] buildSort(req.query)   → ORDER BY ?? ASC|DESC / ชื่อนอก whitelist → 400
// spec: "sort", "เรียงตาม", "?sort=price&order=desc", "INVALID_SORT_FIELD"
// ============================================================
const SORTABLE = {                                     // ← ชื่อที่ client ส่ง : คอลัมน์จริงใน DB
    id: 'id',
    name: 'name',
    price: 'price',
    releaseDate: 'release_date',
    stockQuantity: 'stock_quantity',
}

function buildSort(query) {
    const column = SORTABLE[query.sort || 'id']        // ไม่ส่ง sort → เรียงตาม id
    if (!column) {                                     // ชื่อนอก whitelist → 400 (spec ให้ใช้ default → column = 'id')
        throw new AppError(`Cannot sort by '${query.sort}'`, 400, 'INVALID_SORT_FIELD')   // ← ข้อความ / code ตาม spec
    }
    const dir = String(query.order).toLowerCase() === 'desc' ? 'DESC' : 'ASC'   // เลือกได้แค่ 2 คำนี้ (ห้ามเอาค่า client ไปต่อ SQL)
    return { orderBy: ` ORDER BY ?? ${dir}, ${PK}`, orderParams: [column] }      // ?? = ช่องชื่อคอลัมน์ / ต่อ id กันลำดับสลับ
}

// ============================================================
// [R8][R9][R10] findFiltered(req.query, req.pagination)   → WHERE + ORDER BY + LIMIT
// spec: "?category=FLAGSHIP&q=pro&sort=price&order=desc&page=1&limit=10"
// ============================================================
export async function findFiltered(query = {}, pagination = null) {
    const filter = buildFilter(query)                                  // [R8]
    const search = buildSearch(query)                                  // [R9]
    const conditions = [...filter.conditions, ...search.conditions]
    const params = [...filter.params, ...search.params]                // ลำดับค่า = ลำดับ ? ใน SQL
    const where = conditions.length ? ' WHERE ' + conditions.join(' AND ') : ''
    const { orderBy, orderParams } = buildSort(query)                  // [R10]

    const sql = `SELECT * FROM ${TABLE_NAME}` + where + orderBy
    if (!pagination) {
        const [rows] = await db.query(sql, [...params, ...orderParams])
        return rows
    }
    const {limit, offset} = pagination
    const [rows] = await db.query(sql + ' LIMIT ? OFFSET ?', [...params, ...orderParams, limit, offset])
    // COUNT ต้องใช้ WHERE เดียวกัน (ไม่ใช่นับทั้งตาราง) ไม่งั้น total / totalPages ผิด
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM ${TABLE_NAME}` + where, params)
    rows.totalItems = total
    return rows
}

// ============================================================
// [R4] findOne(id)   → แถวเดียว + brand_name (JOIN) / ไม่เจอ → 404
// spec: "GET by id", "brandName", "404 Not Found", "PRODUCT_NOT_FOUND"
// ============================================================
export async function findOne(id) {
    const [rows] = await db.query(FIND_ONE_SQL, [id])
    if (rows.length === 0) {
        throw new AppError(notFoundMsg(id), 404, NOT_FOUND_CODE)   // ห้าม return null → ต้อง throw ถึงได้ 404
    }
    return rows[0]                                                 // object เดียว (ไม่ใช่ array)
}

// ============================================================
// [C1][U1] findBy('sku', 'X')   → แถวแรกที่เจอ / null (ไม่ throw)
// spec: "ซ้ำ", "already exists", "unique" (ใช้เช็คก่อน insert / update)
// ============================================================
export async function findBy(column, value) {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE ?? = ?`, [column, value])   // ?? = ชื่อคอลัมน์, ? = ค่า
    return rows[0] ?? null
}

// ============================================================
// [C1] create(data)   → INSERT แล้วอ่านกลับทั้งแถว (ได้ DEFAULT + brand_name)
// spec: "POST", "เพิ่ม", "201 Created"
// ============================================================
export async function create(data) {
    const [result] = await db.query(CREATE_SQL, [data])   // result = { insertId: 76, affectedRows: 1, ... }
    // brand_id ไม่มีจริง → MySQL 1452 → errorHandler ตอบ 400 FOREIGN_KEY_NOT_FOUND
    return findOne(result.insertId || data[PK])           // PK auto increment → insertId / PK ส่งเอง → data[PK]
}

// ============================================================
// [U1][U7] update(id, data)   → UPDATE ... SET ? แล้วอ่านแถวใหม่
// spec: "PUT", "PATCH", "แก้ไข", "200 OK"
// ============================================================
export async function update(id, data) {
    await findOne(id)                        // ไม่มี id → throw 404
    await db.query(UPDATE_SQL, [data, id])   // { name: 'x', price: 1 } → SET `name` = 'x', `price` = 1
    return findOne(id)                       // อ่านใหม่ → brand_name ตรงกับ brand_id ใหม่
}

// ============================================================
// [D1] remove(id)   → 404 ก่อน แล้วค่อย DELETE
// spec: "DELETE", "ลบ", "204 No Content"
// ============================================================
export async function remove(id) {
    await findOne(id)                                  // ไม่มี id → throw 404 แล้วหยุดตรงนี้
    const [result] = await db.query(REMOVE_SQL, [id])  // มีตารางอื่นอ้างอยู่ → MySQL 1451 → 409
    return result                                      // { affectedRows: 1 } (route ไม่ใช้ → ตอบ 204)
}
