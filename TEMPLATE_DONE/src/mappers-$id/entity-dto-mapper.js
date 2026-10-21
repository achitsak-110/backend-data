//{student-id} - {student-name}
// entity = แถวจาก DB (snake_case)  →  DTO = JSON ที่ส่งให้ client (ชื่อ field ตาม spec)

const num = (v) => (v == null ? v : Number(v))          // DECIMAL มาเป็น "48900.00" (string) → 48900
const toDateOnly = (d) => {                               // DATE มาเป็น Date → "2023-09-22"
    if (!(d instanceof Date)) return d
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export default class EntityDtoMapper {
    // แปลงเป็น Less Data DTO (Summary) → ใช้กับ list
    static toSummaryDTO(entity) {
        // แก้: เดิมเป็น field ของ classicmodels → เปลี่ยนเป็น field ตาม spec
        return {
            id: entity.id,
            sku: entity.sku,
            name: entity.name,
            brandId: entity.brand_id,          // snake → camel ตาม spec
            category: entity.category,
            price: num(entity.price),          // string → number
            status: entity.status,
        };
    }

    // แปลงเป็น Full Data DTO (Detail) → ใช้กับ GET /:id, POST, PUT
    static toDetailDTO(entity) {
        return {
            id: entity.id,
            sku: entity.sku,
            name: entity.name,
            brandId: entity.brand_id,
            brandName: entity.brand_name,      // มาจาก JOIN brands ใน repository
            category: entity.category,
            price: num(entity.price),
            ramGb: entity.ram_gb,
            storageGb: entity.storage_gb,
            color: entity.color,
            stockQuantity: entity.stock_quantity,
            status: entity.status,
            releaseDate: toDateOnly(entity.release_date),
        };
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
        let entitiesMap = {}
        if (viewType == 'full') {
            entitiesMap = entities.map(item => this.toDetailDTO(item))
        } else {
            entitiesMap = entities.map(item => this.toSummaryDTO(item))
        }
        if (totalItems !== undefined) {        // แก้: เดิม if(totalItems) → totalItems = 0 หาย
            entitiesMap.totalItems = totalItems  // .map() ทำ totalItems หาย ต้องใส่คืน
        }
        return entitiesMap
    }
}
