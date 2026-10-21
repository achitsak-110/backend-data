// {student-id} - {student-name}
// repository = SQL อย่างเดียว ไม่มี business logic
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'   // แก้: ใช้ throw 404

const TABLE_NAME = "products"                 // แก้: เดิม "table-name"
const PK = "id"                               // แก้: เดิมเขียน primaryKey ตรงๆ ใน SQL
const NOT_FOUND_CODE = 'PRODUCT_NOT_FOUND'    // ← code ตาม spec
const notFoundMsg = (id) => `Product with id '${id}' was not found`   // ← ข้อความตาม spec

const COUNT_ALL = `SELECT COUNT(*) as total FROM ${TABLE_NAME}`
const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY ${PK}`
// detail ต้องมี brandName → JOIN brands (name ชนกัน → ตั้งชื่อใหม่ด้วย AS)
const FIND_ONE_SQL = `SELECT p.*, b.name AS brand_name
    FROM ${TABLE_NAME} p JOIN brands b ON b.id = p.brand_id
    WHERE p.${PK} = ?`
const UPDATE_SQL = `UPDATE ${TABLE_NAME} SET ? WHERE ${PK} = ?`   // ? แรก = object, ? สอง = id
const REMOVE_SQL = `DELETE FROM ${TABLE_NAME} WHERE ${PK} = ?`
const CREATE_SQL = `INSERT INTO ${TABLE_NAME} SET ?`             // ? = object → col = val, ...

export async function count() {
    const [[{ total }]] = await db.query(COUNT_ALL)    // [[{ total: 75 }], fields] → 75
    return total
}

export async function findAll(pagination = null) {
    if (!pagination) {
        const [rows] = await db.query(FIND_ALL_SQL)
        return rows
    }
    const SQL = FIND_ALL_SQL + ' LIMIT ? OFFSET ?'
    const {limit, offset} = pagination
    const [rows] = await db.query(SQL, [limit, offset])
    rows.totalItems = await count()                    // แก้: เพิ่ม → api-response ใช้คำนวณ totalPages
    return rows
}

export async function findOne(id) {
    const [row] = await db.query(FIND_ONE_SQL, [id])
    if (row.length === 0) {
        throw new AppError(notFoundMsg(id), 404, NOT_FOUND_CODE)   // แก้: เดิม return null → ไม่ได้ 404
    }
    return row[0]
}

// ใช้เช็คค่าซ้ำ: await findBy('sku', 'X')  (?? = ช่องใส่ชื่อคอลัมน์)
export async function findBy(column, value) {
    const [rows] = await db.query(`SELECT * FROM ${TABLE_NAME} WHERE ?? = ?`, [column, value])
    return rows[0] ?? null
}

export async function update(id, data) {
    await findOne(id)                        // ไม่มี id → throw 404
    await db.query(UPDATE_SQL, [data, id])
    return findOne(id)                       // คืนข้อมูลหลังแก้
}

export async function remove(id) {
    await findOne(id)                        // ไม่มี id → throw 404
    const [data] = await db.query(REMOVE_SQL, [id])   // มีตารางอื่นอ้างอยู่ → MySQL 1451 → 409
    return data
}

export async function create(data) {
    // แก้: เดิม hard code data.productLine และคืน null ตอนซ้ำ
    const [result] = await db.query(CREATE_SQL, [data])   // result = { insertId, affectedRows, ... }
    return findOne(result.insertId || data[PK])          // PK auto increment → insertId / PK ส่งเอง → data[PK]
}
