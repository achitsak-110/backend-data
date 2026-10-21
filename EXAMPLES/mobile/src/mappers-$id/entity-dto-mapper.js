// {student-id} - {student-name}
// entity-dto-mapper.js  entity = แถวจาก DB (snake_case) → DTO = JSON ที่ส่งให้ client (ชื่อ field ตาม spec)
// [R3] toSummaryDTO   [R4] toDetailDTO   [R11] toNestedDTO   [R3][R4][R11] map / maps (?view=)
import { num, toDateOnly } from './dto-helpers.js'

export default class EntityDtoMapper {
    // ============================================================
    // [R3] toSummaryDTO(entity)   → list (GET /products)
    // spec: "Summary DTO", "แสดงเฉพาะฟิลด์สรุป", "Less Data"
    // ============================================================
    static toSummaryDTO(entity) {
        return {
            id: entity.id,
            sku: entity.sku,
            name: entity.name,
            brandId: entity.brand_id,          // ← snake → camel ตาม spec (spec ใช้ brand_id ก็เขียน brand_id: ...)
            category: entity.category,
            price: num(entity.price),          // DECIMAL "48900.00" → 48900
            status: entity.status,
        };
    }

    // ============================================================
    // [R4] toDetailDTO(entity)   → GET /products/:id, POST, PUT, PATCH
    // spec: "Detail DTO", "brandName", "รายละเอียดสินค้า"
    // ============================================================
    // ทางลัด: return camelKeys(entity) = ทุกคอลัมน์เปลี่ยนเป็น camelCase (แต่ price ยังเป็น string)
    static toDetailDTO(entity) {
        return {
            id: entity.id,
            sku: entity.sku,
            name: entity.name,
            brandId: entity.brand_id,
            brandName: entity.brand_name,      // มาจาก JOIN brands ใน repository (ไม่ JOIN = key หาย)
            category: entity.category,
            price: num(entity.price),
            ramGb: entity.ram_gb,              // INT มาเป็น number อยู่แล้ว
            storageGb: entity.storage_gb,
            color: entity.color,
            stockQuantity: entity.stock_quantity,
            status: entity.status,
            releaseDate: toDateOnly(entity.release_date),   // DATE → "2023-09-22"
        };
    }

    // ============================================================
    // [R11] toNestedDTO(entity)   → GET /products/:id?view=nested
    // spec: "brand": { "id", "name" } (object ซ้อนแทน brandId / brandName)
    // ============================================================
    static toNestedDTO(entity) {
        return {
            id: entity.id,
            sku: entity.sku,
            name: entity.name,
            brand: { id: entity.brand_id, name: entity.brand_name },   // ← ต้อง JOIN มาก่อนเหมือน brandName
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

    // ============================================================
    // [R4][R11] map(entity, 'full' | 'summary' | 'nested')   → object เดียว
    // spec: "?view=summary", "?view=nested"
    // ============================================================
    static map(entity, viewType = 'full') {
        if (viewType == 'summary') {
            return this.toSummaryDTO(entity)
        } else if (viewType == 'nested') {
            return this.toNestedDTO(entity)
        } else {
            return this.toDetailDTO(entity)
        }
    }

    // ============================================================
    // [R3] maps(rows, 'summary')   → array (+ ใส่ totalItems คืน)
    // spec: list ทุกแบบ (GET /products, GET /brands/:id/products)
    // ============================================================
    static maps(entities, viewType = 'summary') {
        const {totalItems} = entities
        const entitiesMap = entities.map(item => this.map(item, viewType))
        if (totalItems !== undefined) {          // ไม่ใช่ if (totalItems) → totalItems = 0 จะหาย
            entitiesMap.totalItems = totalItems  // .map() สร้าง array ใหม่ → totalItems หาย ต้องใส่คืน
        }
        return entitiesMap
    }
}
