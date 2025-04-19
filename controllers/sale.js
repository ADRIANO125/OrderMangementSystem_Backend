const Sale = require("../models/sale");
const Product = require("../models/product");

// إضافة عملية بيع جديدة
exports.addSale = async (req, res) => {
  try {
    const { productId, quantity, unitPrice, customer, paymentMethod, notes } =
      req.body;

    // التحقق من وجود المنتج
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: "المنتج غير موجود" });
    }

    // إنشاء سجل بيع جديد
    const sale = new Sale({
      productId,
      quantity: parseInt(quantity),
      unitPrice: parseFloat(unitPrice),
      totalPrice: parseInt(quantity) * parseFloat(unitPrice),
      customer,
      paymentMethod,
      notes,
    });

    // حفظ سجل البيع
    await sale.save();

    res.status(201).json({
      message: "تمت إضافة العملية بنجاح",
      sale,
    });
  } catch (error) {
    console.error("Error adding sale:", error);
    res.status(500).json({ error: error.message });
  }
};

// الحصول على جميع عمليات البيع
exports.getAllSales = async (req, res) => {
  try {
    const sales = await Sale.find()
      .populate("productId", "productName images")
      .sort({ createdAt: -1 });
    res.status(200).json(sales);
  } catch (error) {
    console.error("Error fetching sales:", error);
    res.status(500).json({ error: error.message });
  }
};

// الحصول على عملية بيع محددة
exports.getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate(
      "productId",
      "productName images width height weight"
    );

    if (!sale) {
      return res.status(404).json({ error: "العملية غير موجودة" });
    }

    res.status(200).json(sale);
  } catch (error) {
    console.error(`Error fetching sale ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// تحديث عملية بيع
exports.updateSale = async (req, res) => {
  try {
    const { productId, quantity, unitPrice, customer, paymentMethod, notes } =
      req.body;
    const saleId = req.params.id;

    // التحقق من وجود المنتج إذا تم تغييره
    if (productId) {
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ error: "المنتج غير موجود" });
      }
    }

    // حساب السعر الإجمالي
    let totalPrice;
    if (quantity && unitPrice) {
      totalPrice = parseInt(quantity) * parseFloat(unitPrice);
    }

    // تحديث عملية البيع
    const updatedSale = await Sale.findByIdAndUpdate(
      saleId,
      {
        productId,
        quantity: quantity ? parseInt(quantity) : undefined,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        totalPrice,
        customer,
        paymentMethod,
        notes,
      },
      { new: true, runValidators: true }
    );

    if (!updatedSale) {
      return res.status(404).json({ error: "العملية غير موجودة" });
    }

    res.status(200).json({
      message: "تم تحديث العملية بنجاح",
      sale: updatedSale,
    });
  } catch (error) {
    console.error(`Error updating sale ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// حذف عملية بيع
exports.deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findByIdAndDelete(req.params.id);

    if (!sale) {
      return res.status(404).json({ error: "العملية غير موجودة" });
    }

    res.status(200).json({
      success: true,
      message: "تم حذف العملية بنجاح",
    });
  } catch (error) {
    console.error(`Error deleting sale ${req.params.id}:`, error);
    res.status(500).json({ error: error.message });
  }
};

// إحصائيات المبيعات
exports.getSalesStats = async (req, res) => {
  try {
    const totalSales = await Sale.countDocuments();
    const totalRevenue = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$totalPrice" },
        },
      },
    ]);

    // أكثر المنتجات مبيعًا
    const topProducts = await Sale.aggregate([
      {
        $group: {
          _id: "$productId",
          totalSold: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { totalSold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 1,
          totalSold: 1,
          totalRevenue: 1,
          productName: { $arrayElemAt: ["$productDetails.productName", 0] },
        },
      },
    ]);

    // المبيعات خلال الأسبوع الماضي
    const lastWeekSales = await Sale.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          sales: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.status(200).json({
      totalSales,
      totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0,
      topProducts,
      lastWeekSales,
    });
  } catch (error) {
    console.error("Error fetching sales statistics:", error);
    res.status(500).json({ error: error.message });
  }
};
