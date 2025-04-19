const {
  addOrder,
  numberOfProduct,
  deleteOrder,
  search,
  getAllOrders,
  deleteAllOrders,
  updateById,
  getById,
  print,
} = require("../controllers/order");

const express = require("express");
const router = express.Router();

router.get("/", getAllOrders);
router.post("/add", addOrder);
router.put("/update/:id", updateById);
router.get("/search", search);
router.delete("/delete/:id", deleteOrder);
router.post("/:id/numberOfProduct", numberOfProduct);
router.delete("/deleteAll", deleteAllOrders);

// Get single order by ID
router.get("/:id", getById);

// Update the print route
router.get("/print", print);

module.exports = router;
