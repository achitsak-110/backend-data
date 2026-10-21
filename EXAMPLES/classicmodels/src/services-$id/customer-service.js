// {student-id} - {student-name}
// customers + sub-collection payments (composite PK)
// [R2A] getAllObjects   [D2/D3] removeObject   [R7] getPayments
// [C8] createPayment   [D7] removePayment
import * as repo from '../repositories-$id/customer-repository.js'
import { AppError } from '../middlewares-$id/error-handler.js'
import { CustomerMapper, PaymentMapper } from '../mappers-$id/entity-dto-mapper.js'
import { bad, isPositive, isRealDate, requireBody, requireFields } from '../middlewares-$id/validate.js'

// ============================================================
// [R2A] GET /customers?page=&limit=&view=   → 200 + pagination เสมอ
// spec: "default page = 1, limit = 10", "Summary DTO: id, name, country, creditLimit"
// ============================================================
export async function getAllObjects(pagination, viewType = 'summary') {
    const rows = await repo.findAll(pagination)
    return CustomerMapper.maps(rows, viewType)        // maps() ใส่ totalItems คืนให้แล้ว
}

// ============================================================
// [D2/D3] DELETE /customers/:customerNumber   → 200 / 404 / 409
// spec: "Customer record successfully deleted", "Cannot delete customer because related orders or payment records exist"
// ============================================================
export async function removeObject(customerNumber) {
    try {
        return await repo.remove(customerNumber)       // ต้อง await ใน try ไม่งั้น catch จับไม่ได้
    } catch (e) {
        if (e.code === 'ER_ROW_IS_REFERENCED_2') {     // 1451: ยังมี orders / payments อ้างอยู่
            throw new AppError('Cannot delete customer because related orders or payment records exist',
                409, 'RESOURCE_IN_USE')                // ← ข้อความตาม spec
        }
        throw e                                        // 404 จาก findOne โยนต่อ
    }
}

// ============================================================
// [R7] GET /customers/:customerNumber/payments   → 200 [] ได้ / 404
// spec: "แสดง payments ของลูกค้า", "ไม่พบลูกค้า → CUSTOMER_NOT_FOUND"
// ============================================================
export async function getPayments(customerNumber) {
    await repo.findOne(customerNumber)                 // แม่ไม่มี → 404 (ไม่ใช่ [])
    const rows = await repo.findPayments(customerNumber)
    return PaymentMapper.maps(rows)                    // มีแม่แต่ไม่มีลูก → []
}

// ============================================================
// [C8] POST /customers/:customerNumber/payments   → 201 / 404 / 400 / 409
// spec: "Composite Key", "checkNumber ซ้ำ", "amount > 0", "YYYY-MM-DD"
// ============================================================
export async function createPayment(customerNumber, body) {
    await repo.findOne(customerNumber)                 // 1) ลูกค้าไม่มี → 404 (ก่อนตรวจ body)
    requireBody(body)                                  //    body ว่าง → 400 VALIDATION_ERROR
    requireFields(body, ['checkNumber'])               //    PK ตัวที่ 2 มาจาก body → ต้องมี
    if (!isPositive(body.amount)) {                    // 2) business rules → 400
        bad('Payment amount must be greater than zero', 'INVALID_PAYMENT_DATA')   // ← ข้อความตาม spec
    }
    if (!isRealDate(body.paymentDate)) {
        bad('Payment date must be in YYYY-MM-DD format', 'INVALID_PAYMENT_DATA')
    }
    const data = {
        customerNumber: Number(customerNumber),        // PK ตัวที่ 1 มาจาก URL ไม่ใช่ body
        checkNumber: body.checkNumber,
        paymentDate: body.paymentDate,
        amount: body.amount,
    }
    try {
        return PaymentMapper.toDTO(await repo.createPayment(data))   // 3) insert → 201
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {               // 4) PK คู่ซ้ำ (1062) → 409
            throw new AppError(`Check number '${data.checkNumber}' has already been registered for this customer`,
                409, 'DUPLICATE_KEY')                  // ← ข้อความตาม spec
        }
        throw e                                        // amount เกิน DECIMAL(10,2) = 1264 → errorHandler ตอบ 400
    }
}

// ============================================================
// [D7] DELETE /customers/:customerNumber/payments/:checkNumber   → 200 / 404
// spec: "ลบ payment", "composite PK ต้องใช้ทั้ง 2 คอลัมน์"
// ============================================================
export async function removePayment(customerNumber, checkNumber) {
    await repo.findOne(customerNumber)                 // 1) ไม่มีลูกค้า → 404 CUSTOMER_NOT_FOUND
    const deleted = await repo.removePayment(customerNumber, checkNumber)
    if (!deleted) {                                    // 2) ลูกค้ามี แต่ไม่มีเช็คนี้ของลูกค้าคนนี้ → 404
        throw new AppError(`Payment with check number '${checkNumber}' was not found for customer '${customerNumber}'`,
            404, 'PAYMENT_NOT_FOUND')                  // ← code / ข้อความตาม spec
    }
    return true
}
