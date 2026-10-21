// {student-id} - {student-name}
// entity = แถวจาก DB  →  DTO = JSON ที่ส่งให้ client (ชื่อ field ตาม spec)
// [R2A] CustomerMapper (summary / full)   [R7 / C8] PaymentMapper   [R4] OrderMapper (object ซ้อน + items)
import { num, toDateOnly } from './dto-helpers.js'

const round2 = (n) => Math.round(n * 100) / 100   // 49 * 35.29 = 1729.2099999 → 1729.21

// ============================================================
// [R2A] CustomerMapper   GET /customers?view=summary|full
// spec: "Summary DTO: id, name, country, creditLimit", "creditLimit เป็นตัวเลข"
// ============================================================
export class CustomerMapper {
    // list (summary): เปลี่ยนชื่อ field ตาม spec
    static toSummaryDTO(entity) {
        return {
            id: entity.customerNumber,              // ← rename ตาม spec
            name: entity.customerName,
            country: entity.country,
            creditLimit: num(entity.creditLimit),   // DECIMAL "21000.00" → 21000
        }
    }

    // ?view=full: ส่งทุกคอลัมน์ แก้แค่ DECIMAL
    static toDetailDTO(entity) {
        return { ...entity, creditLimit: num(entity.creditLimit) }
    }

    static map(entity, viewType = 'full') {
        if (viewType == 'summary') {
            return this.toSummaryDTO(entity)
        } else {
            return this.toDetailDTO(entity)
        }
    }

    static maps(entities, viewType = 'summary') {
        const {totalItems} = entities
        const entitiesMap = entities.map(item => this.map(item, viewType))
        if (totalItems !== undefined) {
            entitiesMap.totalItems = totalItems     // .map() ทำ totalItems หาย ต้องใส่คืน
        }
        return entitiesMap
    }
}

// ============================================================
// [R7 / C8] PaymentMapper   payments (composite PK)
// spec: "paymentDate": "2026-09-18", "amount": 2500.50
// ============================================================
export class PaymentMapper {
    static toDTO(entity) {
        return {
            customerNumber: entity.customerNumber,
            checkNumber: entity.checkNumber,
            paymentDate: toDateOnly(entity.paymentDate),   // Date → "YYYY-MM-DD"
            amount: num(entity.amount),                    // "2500.50" → 2500.5
        }
    }

    static maps(entities) {
        return entities.map(item => this.toDTO(item))
    }
}

// ============================================================
// [R4] OrderMapper   GET /orders/:orderNumber → order + customer {} + items []
// spec: "แสดง order พร้อมรายการสินค้า (items)", "totalAmount"
// ============================================================
export class OrderMapper {
    // แถวลูก 1 แถว (orderdetails JOIN products) → item
    static toItemDTO(row) {
        const priceEach = num(row.priceEach)
        return {
            productCode: row.productCode,
            productName: row.productName,                          // มาจาก JOIN products
            quantityOrdered: row.quantityOrdered,
            priceEach: priceEach,
            lineTotal: round2(row.quantityOrdered * priceEach),    // field คำนวณเพิ่ม
        }
    }

    // order 1 แถว + items หลายแถว → object เดียว (nested)
    static toDetailDTO(order, items) {
        const itemDTOs = items.map(item => this.toItemDTO(item))
        return {
            orderNumber: order.orderNumber,
            orderDate: toDateOnly(order.orderDate),
            requiredDate: toDateOnly(order.requiredDate),
            shippedDate: toDateOnly(order.shippedDate),           // null ได้ (ยังไม่ส่ง)
            status: order.status,
            comments: order.comments,
            customer: {                                           // ← object ซ้อนตาม spec
                customerNumber: order.customerNumber,
                customerName: order.customerName,                 // มาจาก JOIN customers
            },
            items: itemDTOs,                                      // ← array ซ้อน
            totalAmount: round2(itemDTOs.reduce((sum, item) => sum + item.lineTotal, 0)),
        }
    }
}
