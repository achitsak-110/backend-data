// {student-id} - {student-name}
// offices: ไม่มี business logic → ส่งต่อ repository บรรทัดเดียว (key ตามคอลัมน์ DB ไม่แปลง DTO)
// [R1] getAllObjects   [R5] getObject
import * as repo from '../repositories-$id/office-repository.js'

// ============================================================
// [R1] GET /offices   → 200
// spec: "แสดงสำนักงานทั้งหมด"
// ============================================================
export async function getAllObjects() {
    return await repo.findAll()
}

// ============================================================
// [R5] GET /offices/:officeCode   → 200 / 404
// spec: "Office with code '99' was not found"
// ============================================================
export async function getObject(officeCode) {
    return await repo.findOne(officeCode)        // ไม่เจอ → repository throw 404 เอง
}
