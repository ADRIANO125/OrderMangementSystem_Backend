const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    customer: {
      name: {
        type: String,
        required: true,
      },
      phone: {
        type: String,
      },
      address: {
        type: String,
      },
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "Card", "Transfer"],
      default: "Cash",
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// إضافة middleware قبل الحفظ لحساب السعر الإجمالي
saleSchema.pre("save", function (next) {
  if (this.quantity && this.unitPrice) {
    this.totalPrice = this.quantity * this.unitPrice;
  }
  next();
});

module.exports = mongoose.model("Sale", saleSchema);
