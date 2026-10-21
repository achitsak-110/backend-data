// {student-id} - {student-name}
// resource ที่ 2: copy service.js มาแล้วแก้
import * as repo from "../repositories-$id/brand-repository.js"
import mapper from "../mappers-$id/entity-dto-mapper.js"

export async function getAllObjects() {
    return await repo.findAll()                      // spec brands ใช้ key ตามคอลัมน์ DB → ไม่แปลง DTO
}

export async function getObject(id) {
    return await repo.findOne(id)
}

export async function getProducts(id) {
    return mapper.maps(await repo.findProducts(id), 'summary')   // ลูกเป็น products → summary DTO
}
