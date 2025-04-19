const path = require("path");
const dbConnection = require("./DB/dbConnection");
require("dotenv").config({ path: "./config/config.env" });
const orderRouters = require("./routers/order");
const productRouters = require("./routers/product");
const saleRouters = require("./routers/sale");

const express = require("express");
const app = express();

const port = process.env.PORT || 3000;

// إضافة middleware للسماح بـ CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, X-Requested-With, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  next();
});

// توصيل بقاعدة البيانات
dbConnection();

// Middleware للتعامل مع البيانات
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// خدمة الملفات الثابتة من مجلد frontend/public
app.use(express.static(path.join(__dirname, "../frontend/public")));

// خدمة الملفات الثابتة من مجلد uploads
app.use("/uploads", express.static("uploads"));

// توجيه API routes
app.use("/api/Orders", orderRouters);
app.use("/api/products", productRouters);
app.use("/api/sales", saleRouters);

// توجيه المسار الرئيسي إلى index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/public", "index.html"));
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
  res.status(404).send("الصفحة غير موجودة");
});

// تشغيل السيرفر
app.listen(port, () => {
  console.log(`Server Is Running On PORT ${port}`);
});
