// {student-id} - {student-name}
// app.js  ลำดับ: express.json → queryParser → student-info → router ทุกตัว → notFound → errorHandler → listen
// [0] GET /student-info   /products → product-route.js   /brands → brand-route.js
import express from 'express'
import productRouter from './routes-$id/product-route.js'
import brandRouter from './routes-$id/brand-route.js'
import { queryParser } from './middlewares-$id/pagination-middleware.js'
import { notFound, errorHandler } from './middlewares-$id/error-handler.js'

const STUDENT_ID = '67130500004'      // ← รหัสจาก spec
const STUDENT_NAME = 'Kittithat Yotkh' // ← ชื่อจาก spec
const SECRET_KEY = '30KiYo'            // ← secret key จาก spec
const BASE = `/api/${STUDENT_ID}`      // ทุก path ขึ้นต้นด้วย /api/รหัส (ห้ามใช้ /api/:studentId)
const PORT = process.env.PORT || 3000  // ← วันสอบใช้ 3000 (env มีไว้ให้ test ของชุดตัวอย่างเปิดพอร์ตอื่นเท่านั้น)

const app = express()
app.use(express.json())                // อ่าน JSON body → req.body (ต้องมาก่อน router)
app.use(queryParser())                 // ?page=&limit= → req.pagination (ต้องมาก่อน router)

// ============================================================
// [0] GET /api/67130500004/student-info   → 200
// spec: "studentId", "name", "secretKey", "Identity Verification"
// ============================================================
app.get(`${BASE}/student-info`, (req, res) => {
    res.status(200).json({
        success: true,
        data: { studentId: STUDENT_ID, name: STUDENT_NAME, secretKey: SECRET_KEY },
        timestamp: new Date().toISOString(),   // เวลาปัจจุบัน ห้าม hard code
    })
})

app.use(`${BASE}/products`, productRouter)  // ← resource พหูพจน์ / router ไม่ใส่ ()
app.use(`${BASE}/brands`, brandRouter)      // resource ที่ 2

app.use(notFound)                      // path ที่ไม่มี → 404 JSON (หลัง router ทุกตัว)
app.use(errorHandler)                  // ท้ายสุดเสมอ (error จาก service / repo / MySQL มาจบที่นี่)

app.listen(PORT, (err) => {
    if (err) {                         // port ถูกใช้อยู่ (ยังมี server ตัวเก่ารันค้าง)
        console.error(`Port ${PORT} is already in use (${err.code}) - stop the old server first`)
        process.exit(1)
    }
    console.log(`Example app listening on http://localhost:${PORT}${BASE}`)
})
