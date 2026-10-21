// {student-id} - {student-name}
// resource ที่ 2: copy repository.js มาแล้วแก้ค่าบนสุด
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'

const TABLE_NAME = "brands"
const PK = "id"

const FIND_ALL_SQL = `SELECT * FROM ${TABLE_NAME} ORDER BY ${PK}`
const FIND_ONE_SQL = `SELECT * FROM ${TABLE_NAME} WHERE ${PK} = ?`
const FIND_PRODUCTS_SQL = `SELECT * FROM products WHERE brand_id = ? ORDER BY id`   // sub-collection

export async function findAll() {
    const [rows] = await db.query(FIND_ALL_SQL)
    return rows
}

export async function findOne(id) {
    const [rows] = await db.query(FIND_ONE_SQL, [id])
    if (rows.length === 0) throw new AppError(`Brand with id '${id}' was not found`, 404, 'BRAND_NOT_FOUND')
    return rows[0]
}

// GET /brands/:id/products → ไม่มีแม่ 404 / มีแม่แต่ไม่มีลูก → []
export async function findProducts(id) {
    await findOne(id)
    const [rows] = await db.query(FIND_PRODUCTS_SQL, [id])
    return rows
}
