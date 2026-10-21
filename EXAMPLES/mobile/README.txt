ตัวอย่าง mobile (DB mobile_distributor, envelope A)   ทุก path ขึ้นต้นด้วย /api/67130500004   ค้นในโค้ด: Ctrl+Shift+F "[R8]"

รหัส    endpoint                                   status                  ไฟล์ › ฟังก์ชัน
[0]     GET    /student-info                       200                     app.js › app.get(student-info)
[R1]    GET    /products                           200                     product-service getAllObjects › product-repository findAll
[R2]    GET    /products?page=2&limit=10           200 + pagination        pagination-middleware queryParser › product-repository findPage, count
[R2S]   GET    /products/paged?page=0              200 / 400               pagination-middleware strictPagination › product-route GET /paged
[R3]    GET    /products  (Summary DTO)            200                     entity-dto-mapper toSummaryDTO, maps
[R8]    GET    /products?category=&brandId=        200                     product-repository buildFilter › findFiltered
[R9]    GET    /products?q=pro                     200                     product-repository buildSearch › findFiltered
[R10]   GET    /products?sort=price&order=desc     200 / 400               product-repository SORTABLE, buildSort › findFiltered
[R4]    GET    /products/:id                       200 / 404               product-service getObject › product-repository findOne › toDetailDTO
[R11]   GET    /products/:id?view=nested           200 / 404               entity-dto-mapper toNestedDTO, map
[C1]    POST   /products                           201 / 400 / 409         product-service createObject › product-repository findBy, create
[C4]    (ตรวจค่าใน C1 / U1 / U7)                   400                     product-service validateProduct › validate requireFields, isPositive, isRealDate
[C5]    POST   /products/camel                     201 / 400 / 409         product-service createObjectCamel › dto-helpers snakeKeys
[U1]    PUT    /products/:id                       200 / 404 / 400 / 409   product-service updateObject › product-repository update
[U7]    PATCH  /products/:id                       200 / 404 / 400 / 409   product-service patchObject › product-repository update
[D1]    DELETE /products/:id                       204 / 404               product-service removeObject › product-repository remove
[R1]    GET    /brands                             200                     brand-service getAllObjects › brand-repository findAll
[R12]   GET    /brands/stats                       200                     brand-service getStats (toStatDTO) › brand-repository findStats
[R6]    GET    /brands/:id/products?page&limit     200 / 404               brand-service getProducts › brand-repository findProducts
[R4B]   GET    /brands/:id                         200 / 404               brand-service getObject › brand-repository findOne
[C2]    POST   /brands                             201 / 400 / 409         brand-service createObject › brand-repository create
[D2]    DELETE /brands/:id/with-message            200 / 404 / 409         brand-route DELETE /:id/with-message › brand-service removeObject
[D3]    DELETE /brands/:id                         204 / 404 / 409         brand-service removeObject › brand-repository remove
[D10]   DELETE /brands/abc                         400                     brand-service removeObject › validate isIntId
[D9]    PATCH  /brands/:id/deactivate              200 / 404               brand-service deactivate › brand-repository setActive
[ERR]   ทุก error / path ที่ไม่มี                    400 / 404 / 409 / 500   error-handler AppError, notFound, errorHandler
[ENV-B] { status: 'success', data }                -                       api-response (comment ท้ายไฟล์) + error-handler (บรรทัดสุดท้าย)
