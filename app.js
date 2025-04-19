const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");

// إستيراد المسارات
const productRoutes = require("./routes/product");
const orderRoutes = require("./routes/order");

const app = express();

// تكوين CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);

// تعزيز الأمان باستخدام helmet
app.use(helmet());

// تحديد معدل الطلبات لمنع هجمات DoS
const limiter = rateLimit({
  // 100 طلب لكل IP خلال 15 دقيقة
  max: 100,
  windowMs: 15 * 60 * 1000,
  message:
    "عدد كبير من الطلبات من عنوان IP هذا، يرجى المحاولة مرة أخرى لاحقًا!",
});
app.use("/api", limiter);

// تحليل جسم الطلب
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// حماية ضد هجمات NoSQL injection
app.use(mongoSanitize());

// الحماية من هجمات XSS
app.use(xss());

// منع تلوث المعلمات HTTP
app.use(
  hpp({
    whitelist: ["productName", "status", "customerName", "orderDate"],
  })
);

// تعيين المسار للملفات الثابتة
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// تسجيل طلبات API للتنقيح
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
    );
  });
  next();
});

// تعيين مسارات API
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);

// الوصول للتطبيق الأمامي (في بيئة الإنتاج)
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../Frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"));
  });
}

// التعامل مع المسارات غير الموجودة
app.all("*", (req, res) => {
  res.status(404).json({
    status: "error",
    message: `لم يتم العثور على المسار: ${req.originalUrl}`,
  });
});

// التعامل مع الأخطاء العامة
app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  const statusCode = err.statusCode || 500;
  const status = err.status || "error";

  res.status(statusCode).json({
    status,
    message:
      process.env.NODE_ENV === "production" ? "حدث خطأ في الخادم" : err.message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
