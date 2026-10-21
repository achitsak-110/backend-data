// {student-id} - {student-name}
import express from 'express'
import productRouter from "./routes-$id/route.js";
import brandRouter from './routes-$id/brand-route.js'                        // แก้: resource ที่ 2 = copy route/service/repository มาอีกชุด
import { queryParser } from './middlewares-$id/pagination-middleware.js'     // แก้: template มีไฟล์แต่ไม่ได้ใช้
import { notFound, errorHandler } from './middlewares-$id/error-handler.js'  // แก้: template ไม่มีไฟล์นี้ → สร้างเอง

const STUDENT_ID = '67130500004'      // ← รหัสจาก spec
const STUDENT_NAME = 'Kittithat Yotkh' // ← ชื่อจาก spec
const SECRET_KEY = '30KiYo'            // ← secret key จาก spec
const BASE = `/api/${STUDENT_ID}`      // ทุก path ขึ้นต้นด้วย /api/รหัส (ห้ามใช้ /api/:studentId)

const app = express()
app.use(express.json())                // อ่าน JSON body → req.body (ต้องมาก่อน router)
app.use(queryParser())                 // แก้: ?page=&limit= → req.pagination (ต้องมาก่อน router)

// GET /api/รหัส/student-info
app.get(`${BASE}/student-info`, (req, res) => {
    res.status(200).json({
        success: true,
        data: { studentId: STUDENT_ID, name: STUDENT_NAME, secretKey: SECRET_KEY },
        timestamp: new Date().toISOString(),   // เวลาปัจจุบัน ห้าม hard code
    })
})

app.use(`${BASE}/products`, productRouter)  // แก้: เดิม app.use('/', productRouter)
app.use(`${BASE}/brands`, brandRouter)      // resource ที่ 2

app.use(notFound)                      // แก้: path ที่ไม่มี → 404 JSON (หลัง router ทุกตัว)
app.use(errorHandler)                  // แก้: เดิม (err,req,res,next) => {} ว่าง + อยู่หลัง listen → request ค้าง

app.listen(3000, (err) => {
    if (err) {                         // port 3000 ถูกใช้อยู่ (ยังมี server ตัวเก่ารันค้าง)
        console.error(`Port 3000 is already in use (${err.code}) - stop the old server first`)
        process.exit(1)
    }
    // {student-id} - {student-name}
    console.log(`Example app listening on http://localhost:3000${BASE}`)
})
