// {student-id} - {student-name}
// db-config.js  connection pool ของ mysql2 (ทุก repository import db จากไฟล์นี้)
// [0] db  → host / user / password / database / timezone

import mysql from 'mysql2/promise'

// ============================================================
// [0] db = mysql.createPool(...)   → ใช้ db.query(sql, [ค่า])
// spec: "Database: mobile_distributor", "db-config.js"
// ============================================================
const db = mysql.createPool({
    host: 'localhost',               // แก้: เดิม 'db-host'
    user: 'root',                    // แก้: เดิม 'db-username'
    password: 'mysql@sit',           // ← รหัส MySQL ของเครื่องที่สอบ
    // ← ชื่อ DB จากบรรทัด CREATE DATABASE ในไฟล์ .sql
    // process.env.DB_NAME มีไว้ให้ test ของชุดตัวอย่างชี้ไป DB สำเนาเท่านั้น วันสอบเขียน 'mobile_distributor' ตรงๆ
    database: process.env.DB_NAME || 'mobile_distributor',
    timezone: 'Z',                   // วันเวลาไม่เลื่อน 7 ชม. (created_at ออกมาเป็น ...T00:00:00.000Z ตรง spec)
})
export default db
