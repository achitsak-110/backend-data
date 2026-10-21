// {student-id} - {student-name}
// ทดสอบ service โดยไม่ต้องเปิด server: คลิกขวาไฟล์นี้ → Run
import * as service from './services-$id/service.js';   // แก้: เดิม import office-service.js ที่ไม่มีอยู่จริง
import db from './configs-$id/db-config.js'

console.log(await service.getAllObjects({ page: 1, limit: 3, offset: 0 }))   // list แบ่งหน้า
console.log(await service.getObject(1))                                       // ตัวเดียว (detail DTO)

await db.end()   // ปิด pool ให้โปรแกรมจบ
