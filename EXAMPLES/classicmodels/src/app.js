// {student-id} - {student-name}
// ตัวอย่าง classicmodels (envelope B แบบ assignment W6): student-info + mount ทุก router
// [ALL] ลำดับ: express.json → queryParser → router → notFound → errorHandler → listen
import express from 'express'
import officeRouter from './routes-$id/office-route.js'
import productLineRouter from './routes-$id/productline-route.js'
import employeeRouter from './routes-$id/employee-route.js'
import customerRouter from './routes-$id/customer-route.js'
import orderRouter from './routes-$id/order-route.js'
import { queryParser } from './middlewares-$id/pagination-middleware.js'
import { notFound, errorHandler } from './middlewares-$id/error-handler.js'

const STUDENT_ID = '66011234'          // ← รหัสจาก spec
const STUDENT_NAME = 'Test Student'    // ← ชื่อจาก spec
const BASE = `/api/${STUDENT_ID}`      // ทุก path ขึ้นต้นด้วย /api/รหัส (ห้ามใช้ /api/:studentId)
const PORT = process.env.PORT || 3000  // วันสอบใช้ 3000 (env มีไว้ให้ชุดทดสอบเปลี่ยน port เท่านั้น)

const app = express()
app.use(express.json())                // 1) อ่าน JSON body → req.body (ต้องมาก่อน router)
app.use(queryParser())                 // 2) ?page=&limit= → req.pagination (ต้องมาก่อน router)

// ============================================================
// [ALL] GET /student-info   → 200
// spec: "student-info", { "status": "success", "data": { studentId, name } }
// ============================================================
app.get(`${BASE}/student-info`, (req, res) => {
    res.status(200).json({
        status: 'success',                                   // ← envelope B
        data: { studentId: STUDENT_ID, name: STUDENT_NAME }, // spec มี secretKey → เพิ่ม secretKey ตรงนี้
    })
    // envelope A: { success: true, data: {...}, timestamp: new Date().toISOString() }
})

// 3) mount router ทุกตัว: path เต็ม = BASE + path ใน router
app.use(`${BASE}/offices`, officeRouter)              // [R1] [R5]
app.use(`${BASE}/productlines`, productLineRouter)    // [C7] [U8] [D6]
app.use(`${BASE}/employees`, employeeRouter)          // [R2] [U3/U4]
app.use(`${BASE}/customers`, customerRouter)          // [R2A] [D2/D3] [R7] [C8] [D7]
app.use(`${BASE}/orders`, orderRouter)                // [R4] [D8]

app.use(notFound)                      // 4) path ที่ไม่มี → 404 JSON (หลัง router ทุกตัว)
app.use(errorHandler)                  // 5) error ทุกตัว → JSON (ท้ายสุดเสมอ)

app.listen(PORT, (err) => {
    if (err) {                         // port ถูกใช้อยู่ (ยังมี server ตัวเก่ารันค้าง)
        console.error(`Port ${PORT} is already in use (${err.code}) - stop the old server first`)
        process.exit(1)
    }
    // {student-id} - {student-name}
    console.log(`Example app listening on http://localhost:${PORT}${BASE}`)
})
