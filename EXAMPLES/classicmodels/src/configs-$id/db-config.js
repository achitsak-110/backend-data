// {student-id} - {student-name}
// pool เดียวทั้งแอป: ทุก repository import ไฟล์นี้
// ใช้กับทุกข้อ (R C U D) ของ classicmodels
import mysql from 'mysql2/promise'

const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'mysql@sit',                             // ← รหัส MySQL ของเครื่องที่สอบ
    database: process.env.DB_NAME || 'classicmodels',  // ← ชื่อ DB (env มีไว้ให้ชุดทดสอบเท่านั้น วันสอบเขียน 'classicmodels' ตรงๆ)
    timezone: 'Z',                                     // วันที่ไม่เลื่อน 7 ชม. (paymentDate ตรงกับใน DB)
})
export default db
