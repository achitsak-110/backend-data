//{student-id} - {student-name}
import mysql from 'mysql2/promise'

const db = mysql.createPool({
    host: 'localhost',               // แก้: เดิม 'db-host'
    user: 'root',                    // แก้: เดิม 'db-username'
    password: 'mysql@sit',           // แก้: รหัส MySQL ของเครื่องที่สอบ
    database: 'mobile_distributor',  // แก้: ชื่อ DB จากบรรทัด CREATE DATABASE ในไฟล์ .sql
    timezone: 'Z',                   // แก้: เพิ่ม → วันเวลาไม่เลื่อน 7 ชม. (created_at ตรง spec)
})
export default db
