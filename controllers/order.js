const Order = require("../models/order");
const Product = require("../models/product");
const { jsPDF } = require("jspdf");

// Todo :

/*
1- Add Order
2- Delete Order
3- Update Order
4- Search For Order With Mobile Number 
5- Increase The Number Of Product
*/

// To Add Order :

exports.addOrder = async (req, res) => {
  try {
    const {
      customerName,
      mobileNum,
      status,
      orderStatus,
      address,
      items,
      notes
    } = req.body;

    // التحقق من وجود عناصر في الطلب
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "يجب أن يحتوي الطلب على منتج واحد على الأقل"
      });
    }

    // التحقق من صحة بيانات كل منتج وإضافة اسم المنتج
    const processedItems = [];
    for (const item of items) {
      if (!item.product || !item.price || !item.quantity) {
        return res.status(400).json({
          success: false,
          message: "كل منتج يجب أن يحتوي على معرف وسعر وكمية"
        });
      }

      // جلب اسم المنتج من قاعدة البيانات
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `المنتج غير موجود: ${item.product}`
        });
      }

      processedItems.push({
        ...item,
        productName: product.productName
      });
    }

    const totalPrice = processedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = new Order({
      customerName,
      mobileNum,
      status,
      orderStatus,
      address,
      items: processedItems,
      totalPrice,
      notes
    });

    await order.save();

    res.status(201).json({
      success: true,
      message: "تم إضافة الطلب بنجاح",
      order
    });
  } catch (error) {
    console.error("Error adding order:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة الطلب",
      error: error.message
    });
  }
};

// To Increase The Number Of Product In Order :

exports.numberOfProduct = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) return res.status(404).send("No Orders Found");

    order.number += 1;

    await order.save();

    res.send(order);
  } catch (error) {
    res.status(500).send(error.message);
  }
};

// To Delete Order :

exports.deleteOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    console.log("Attempting to delete order:", orderId);

    // استخدام findByIdAndDelete للتأكد من الحذف من قاعدة البيانات
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      console.log("Order not found for deletion");
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    console.log("Order deleted successfully:", deletedOrder);
    return res.status(200).json({
      success: true,
      message: "Order deleted successfully",
      deletedOrder,
    });
  } catch (error) {
    console.error("Error in deleteOrder:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting order",
      error: error.message,
    });
  }
};

// To Search For Order :

exports.search = async (req, res) => {
  try {
    const { mobileNum } = req.query;

    if (!mobileNum) {
      return res.status(400).json({ message: "Mobile number is required" });
    }

    const order = await Order.findOne({ mobileNum });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// To Update Order :

exports.updateById = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // التحقق من وجود الطلب
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    // التحقق من صحة المنتجات وتحديثها
    if (updateData.items && Array.isArray(updateData.items)) {
      const processedItems = [];
      
      for (const item of updateData.items) {
        if (!item.product) {
          return res.status(400).json({
            success: false,
            message: "معرف المنتج مطلوب"
          });
        }

        // البحث عن المنتج في قاعدة البيانات
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({
            success: false,
            message: `المنتج غير موجود: ${item.product}`
          });
        }

        // إنشاء عنصر الطلب مع البيانات المحدثة
        processedItems.push({
          product: product._id,
          productName: product.productName,
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1
        });
      }

      // تحديث عناصر الطلب
      updateData.items = processedItems;

      // حساب السعر الإجمالي
      updateData.totalPrice = processedItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }

    // تحديث الطلب في قاعدة البيانات
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('items.product');

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "فشل في تحديث الطلب"
      });
    }

    res.status(200).json({
      success: true,
      message: "تم تحديث الطلب بنجاح",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الطلب",
      error: error.message
    });
  }
};

// إضافة دالة جديدة للحصول على كل الطلبات
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find();
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// To get By Id :

exports.getById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');
    
    if (!order) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      message: "حدث خطأ أثناء جلب الطلب",
      error: error.message
    });
  }
};

// To Delete All Orders
exports.deleteAllOrders = async (req, res) => {
  try {
    // حذف جميع الطلبات من قاعدة البيانات
    await Order.deleteMany({});

    res.status(200).json({
      success: true,
      message: "All orders deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteAllOrders:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting all orders",
      error: error.message,
    });
  }
};

// To print :

exports.print = async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });

    // Set headers for PDF response
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=orders.pdf");

    // Create PDF document
    const doc = new jsPDF();

    // Add title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("تقرير الطلبات", doc.internal.pageSize.getWidth() / 2, 20, {
      align: "center",
    });

    // Set up table
    const headers = [["#", "العميل", "رقم الهاتف", "عدد المنتجات", "الإجمالي", "الحالة"]];
    const data = orders.map((order, index) => [
      index + 1,
      order.customerName,
      order.mobileNum,
      order.items ? order.items.length : 0,
      `${order.totalPrice} ج.م`,
      order.status === "Pending" ? "قيد الانتظار" : order.status === "Shipped" ? "تم الشحن" : "تم التسليم",
    ]);

    // Add table
    doc.autoTable({
      head: headers,
      body: data,
      startY: 30,
      theme: "grid",
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: [63, 81, 181],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
    });

    // Convert PDF to buffer and send
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    res.end(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({
      success: false,
      message: "Error generating PDF",
      error: error.message,
    });
  }
};
