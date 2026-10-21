// {student-id} - {student-name}
// orders (แม่) + orderdetails (ลูก, FK ไม่มี ON DELETE CASCADE → ต้องลบลูกเอง)
// [R4] findOne, findItems (JOIN)   [D8] removeWithDetails (transaction)
import db from '../configs-$id/db-config.js'
import { AppError } from '../middlewares-$id/error-handler.js'

const NOT_FOUND_CODE = 'ORDER_NOT_FOUND'                                    // ← code ตาม spec
const notFoundMsg = (id) => `Order with number '${id}' was not found`       // ← ข้อความตาม spec

// order + ชื่อลูกค้า (JOIN customers)
const FIND_ONE_SQL = `SELECT o.*, c.customerName
    FROM orders o JOIN customers c ON c.customerNumber = o.customerNumber
    WHERE o.orderNumber = ?`
// รายการสินค้าใน order (JOIN products เอาชื่อสินค้า)
const FIND_ITEMS_SQL = `SELECT d.productCode, p.productName, d.quantityOrdered, d.priceEach
    FROM orderdetails d JOIN products p ON p.productCode = d.productCode
    WHERE d.orderNumber = ?
    ORDER BY d.orderLineNumber`
const REMOVE_DETAILS_SQL = 'DELETE FROM orderdetails WHERE orderNumber = ?'   // ← ตารางลูก
const REMOVE_ORDER_SQL = 'DELETE FROM orders WHERE orderNumber = ?'           // ← ตารางแม่

// ============================================================
// [R4] หา order 1 ตัว + customerName (JOIN)   → แถว / 404 ORDER_NOT_FOUND
// spec: "Order with number '99999' was not found", "แสดงชื่อลูกค้า"
// ============================================================
export async function findOne(orderNumber) {
    const [rows] = await db.query(FIND_ONE_SQL, [orderNumber])
    if (rows.length === 0) {
        throw new AppError(notFoundMsg(orderNumber), 404, NOT_FOUND_CODE)
    }
    return rows[0]
}

// ============================================================
// [R4] รายการสินค้าของ order (orderdetails JOIN products)   → array
// spec: "items: [{ productCode, productName, quantityOrdered, priceEach }]"
// ============================================================
export async function findItems(orderNumber) {
    const [rows] = await db.query(FIND_ITEMS_SQL, [orderNumber])
    return rows
}

// ============================================================
// [D8] ลบ orderdetails + orders ใน transaction เดียว   → จำนวนลูกที่ลบ / พัง = rollback
// spec: "ลบ order พร้อม orderdetails", "ต้องสำเร็จทั้งหมดหรือไม่เกิดอะไรเลย"
// ============================================================
export async function removeWithDetails(orderNumber) {
    const conn = await db.getConnection()          // transaction ต้องใช้ connection เดียวกันทุกคำสั่ง (ห้ามใช้ db.query)
    try {
        await conn.beginTransaction()              // เริ่ม: ยังไม่บันทึกจริงจนกว่าจะ commit
        const [details] = await conn.query(REMOVE_DETAILS_SQL, [orderNumber])   // 1) ลบลูกก่อน
        await conn.query(REMOVE_ORDER_SQL, [orderNumber])                       // 2) แล้วค่อยลบแม่
        await conn.commit()                        // ผ่านทั้ง 2 คำสั่ง → บันทึกจริง
        return details.affectedRows
    } catch (e) {
        await conn.rollback()                      // พังกลางทาง → orderdetails ที่ลบไปแล้วกลับมาครบ
        throw e                                    // โยนต่อให้ errorHandler (เช่น 1451 → 409)
    } finally {
        conn.release()                             // คืน connection ให้ pool ทุกกรณี ไม่งั้น pool หมด
    }
}
