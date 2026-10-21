EXAMPLES/classicmodels   DB classicmodels / envelope B (assignment W6) / base /api/66011234
รัน: npm start (port 3000)     ทดสอบ: npm test (reset DB kit_ex_classic + เปิด server port 3365 เอง)
x-*.js = routes-$id/x-route.js + services-$id/x-service.js + repositories-$id/x-repository.js

รหัส     method  endpoint                                          ไฟล์               function (service → repository)
[ALL]    GET     /student-info                                     app.js             -
[R1]     GET     /offices                                          office-*.js        getAllObjects → findAll
[R5]     GET     /offices/:officeCode                              office-*.js        getObject → findOne
[C7]     POST    /productlines                                     productline-*.js   createObject → create
[U8]     PUT     /productlines/:productLine                        productline-*.js   updateObject → update
[D6]     DELETE  /productlines/:productLine                        productline-*.js   removeObject → countProducts, remove
[R2]     GET     /employees?page=&limit=                           employee-*.js      getAllObjects → findAll, count
[U3/U4]  PUT     /employees/:employeeNumber                        employee-*.js      updateObject → findOne, update
[R2A]    GET     /customers?page=&limit=&view=                     customer-*.js      getAllObjects → findAll
[D2/D3]  DELETE  /customers/:customerNumber                        customer-*.js      removeObject → remove
[R7]     GET     /customers/:customerNumber/payments               customer-*.js      getPayments → findPayments
[C8]     POST    /customers/:customerNumber/payments               customer-*.js      createPayment → createPayment
[D7]     DELETE  /customers/:customerNumber/payments/:checkNumber  customer-*.js      removePayment → removePayment
[R4]     GET     /orders/:orderNumber                              order-*.js         getObject → findOne, findItems
[D8]     DELETE  /orders/:orderNumber                              order-*.js         removeObject → removeWithDetails

[ALL]    error JSON + 404 path + MySQL map    middlewares-$id/error-handler.js          AppError, notFound, errorHandler
[R2]     ?page=&limit= (ไม่ส่ง = ทั้งหมด)      middlewares-$id/pagination-middleware.js  queryParser
[R2A]    แบ่งหน้าเสมอ (default)                middlewares-$id/pagination-middleware.js  alwaysPaginate
[C7-C8]  ตรวจ body → 400                      middlewares-$id/validate.js               bad, requireBody, requireFields, isEmail, isRealDate, isPositive, isIntId
[ALL]    success JSON (+ pagination)          mappers-$id/api-response.js               apiResponse
[R2A]    customer summary / full DTO          mappers-$id/entity-dto-mapper.js          CustomerMapper
[R7/C8]  payment DTO (date, DECIMAL)          mappers-$id/entity-dto-mapper.js          PaymentMapper
[R4]     order + customer {} + items []       mappers-$id/entity-dto-mapper.js          OrderMapper
[DTO]    ตัวช่วยแปลง field                     mappers-$id/dto-helpers.js                pick, omit, num, toDateOnly, toCamel, camelKeys
