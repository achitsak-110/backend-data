// {student-id} - {student-name}
// orders + orderdetails
// [R4] getObject (nested DTO)   [D8] removeObject (transaction)
import * as repo from '../repositories-$id/order-repository.js'
import { OrderMapper } from '../mappers-$id/entity-dto-mapper.js'

// ============================================================
// [R4] GET /orders/:orderNumber   → 200 (order + customer {} + items []) / 404
// spec: "แสดง order พร้อมรายการสินค้า", "Order with number '99999' was not found"
// ============================================================
export async function getObject(orderNumber) {
    const order = await repo.findOne(orderNumber)          // 1) ไม่มี → 404 ORDER_NOT_FOUND
    const items = await repo.findItems(orderNumber)        // 2) ลูกทั้งหมด (JOIN products)
    return OrderMapper.toDetailDTO(order, items)           // 3) รวมเป็น object ซ้อน
}

// ============================================================
// [D8] DELETE /orders/:orderNumber   → 200 / 404 / 409 (rollback)
// spec: "ลบ order พร้อม orderdetails ใน transaction เดียว"
// ============================================================
export async function removeObject(orderNumber) {
    await repo.findOne(orderNumber)                        // 1) ไม่มี → 404 (เช็คก่อนเปิด transaction)
    return await repo.removeWithDetails(orderNumber)       // 2) ลบลูก + แม่ ใน transaction
}
