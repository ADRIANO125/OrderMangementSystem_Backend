const express = require("express");
const router = express.Router();
const {
  addSale,
  getAllSales,
  getSaleById,
  updateSale,
  deleteSale,
  getSalesStats,
} = require("../controllers/sale");

// طرق API للمبيعات
router.post("/add", addSale);
router.get("/", getAllSales);
router.get("/stats", getSalesStats);
router.get("/:id", getSaleById);
router.put("/update/:id", updateSale);
router.delete("/delete/:id", deleteSale);

module.exports = router;
