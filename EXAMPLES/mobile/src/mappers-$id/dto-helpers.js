// {student-id} - {student-name}
// dto-helpers.js  ตัวช่วยแปลงค่า / ชื่อ field ระหว่าง DB (snake_case) กับ JSON (camelCase)
// [R3] num   [R4] toDateOnly   [C1] pick   [C5] snakeKeys   [R12] camelKeys

// ============================================================
// [R3] num(entity.price)   → "48900.00" (string) → 48900 (number)
// spec: "price": 48900.00 (ตัวเลข ไม่มี "")
// ============================================================
export const num = (v) => (v == null ? v : Number(v))   // null / undefined คืนเดิม (AVG ของ brand ไม่มีสินค้า = null)

// ============================================================
// [R4] toDateOnly(entity.release_date)   → "2023-09-22"
// spec: "releaseDate": "2023-09-22" (มีแค่วันที่ ไม่มีเวลา)
// ============================================================
export const toDateOnly = (d) => {
    if (!(d instanceof Date)) return d                  // null → null
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ============================================================
// [C1] pick(req.body, ALLOWED)   → เหลือเฉพาะ key ที่อนุญาต
// spec: request body (field ที่ client ส่งได้), "ห้ามแก้ id"
// ============================================================
// ค่า undefined ถูกตัดด้วย → คอลัมน์ที่ไม่ส่งใช้ DEFAULT ของ DB (POST) / ไม่ถูกแตะ (PUT, PATCH)
export const pick = (obj, keys) =>
    Object.fromEntries(keys.filter((k) => obj?.[k] !== undefined).map((k) => [k, obj[k]]))

// ============================================================
// [C5] snakeKeys(req.body)   → { brandId: 1 } → { brand_id: 1 }
// spec: request body เป็น camelCase (brandId, ramGb) แต่คอลัมน์เป็น snake_case
// ============================================================
// ชื่อที่เป็น snake_case อยู่แล้วไม่เปลี่ยน ('brand_id' → 'brand_id') → รับได้ทั้ง 2 แบบ
// ห้ามใช้กับ DB ที่คอลัมน์เป็น camelCase (classicmodels: productLine → product_line พัง)
const toSnake = (s) => s.replace(/[A-Z]/g, (c) => '_' + c.toLowerCase())
export const snakeKeys = (obj) =>
    Object.fromEntries(Object.entries(obj ?? {}).map(([k, v]) => [toSnake(k), v]))

// ============================================================
// [R12] camelKeys(row)   → { product_count: 5 } → { productCount: 5 }
// spec: response เป็น camelCase ทุก field (ทางลัดแทนการเขียน DTO ทีละบรรทัด)
// ============================================================
const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
export const camelKeys = (row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]))
