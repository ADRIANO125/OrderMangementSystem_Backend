const Product = require("../models/product");

exports.addProduct = async (req, res) => {
  try {
    const { productName, width, height, weight } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Product image is required" });
    }

    const product = new Product({
      productName,
      width: parseFloat(width),
      height: parseFloat(height),
      weight: parseFloat(weight),
      images: [req.file.path],
    });

    await product.save();

    res.status(201).json({
      message: "Product Added Successfully",
      product,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { productName, width, height, weight } = req.body;

    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Update product properties
    if (productName) product.productName = productName;
    if (width) product.width = parseFloat(width);
    if (height) product.height = parseFloat(height);
    if (weight) product.weight = parseFloat(weight);

    // اذا تم تقديم صورة جديدة، نقوم بتحديث الصورة
    if (req.file) {
      product.images = [req.file.path];
    }

    // Save updated product
    const updatedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ error: error.message });
  }
};
