const express = require("express");
const router = express.Router();
const upload = require("../middleWares/uploadImage");
const {
  addProduct,
  getAllProducts,
  deleteProduct,
  updateProduct,
} = require("../controllers/product");

router.post("/add", upload.single("images"), addProduct);

router.get("/", getAllProducts);

router.delete("/delete/:id", deleteProduct);

router.put("/update/:id", upload.single("images"), updateProduct);

module.exports = router;
