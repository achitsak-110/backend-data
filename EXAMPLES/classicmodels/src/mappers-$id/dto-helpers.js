// {student-id} - {student-name}
// ตัวช่วยแปลง entity (แถวจาก DB) → DTO (JSON ที่ส่ง client)
// [C7 / U3 / U8] pick   [R2A / R7 / R4] num, toDateOnly   [DTO] omit, toCamel, camelKeys

// ============================================================
// [C7 / U3 / U8] pick(body, ['a', 'b'])   เอาเฉพาะ field ที่อนุญาต (field อื่นถูกทิ้ง)
// spec: "Request Body" มี field อะไรบ้าง → ใส่ชื่อนั้นใน ALLOWED
// ============================================================
export const pick = (obj, keys) =>
    Object.fromEntries(keys.filter((k) => obj?.[k] !== undefined).map((k) => [k, obj[k]]))

// ============================================================
// [DTO] omit(row, ['image'])   ตัด field ที่ไม่ควรส่งออก (BLOB, password)
// spec: "ไม่ต้องแสดง image", "ห้ามส่ง password"
// ============================================================
export const omit = (obj, keys) =>
    Object.fromEntries(Object.entries(obj).filter(([k]) => !keys.includes(k)))

// ============================================================
// [R2A / R7 / R4] num("2500.50") → 2500.5   DECIMAL ของ MySQL มาเป็น string
// spec: "amount": 2500.50 (เป็นตัวเลข ไม่มี quote)
// ============================================================
export const num = (v) => (v == null ? v : Number(v))

// ============================================================
// [R7 / R4] toDateOnly(Date) → "2026-09-18"   DATE ของ MySQL มาเป็น Date object
// spec: "paymentDate": "2026-09-18" (ไม่มีเวลา)
// ============================================================
export const toDateOnly = (d) => {
    if (!(d instanceof Date)) return d                     // null / string → คืนเดิม
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// ============================================================
// [DTO] toCamel('brand_id') → 'brandId'   (classicmodels เป็น camelCase อยู่แล้ว ใช้กับ DB snake_case)
// spec: field ใน response เป็น camelCase แต่คอลัมน์ DB เป็น snake_case
// ============================================================
export const toCamel = (s) => s.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())

// ============================================================
// [DTO] camelKeys({ brand_id: 1 }) → { brandId: 1 }   เปลี่ยนชื่อทุก key ในแถวเดียว
// spec: เหมือน toCamel แต่ทำทั้งแถว
// ============================================================
export const camelKeys = (row) =>
    Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamel(k), v]))
