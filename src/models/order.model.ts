import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    shippingInfo: {
      firstName: {
        type: String,
        required: true,
      },
      lastName: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      pincode: {
        type: Number,
        required: true,
      },
      phone: {
        type: Number,
        required: true,
      },
    },
    groupId: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    // subTotal: {
    //   type: Number,
    //   required: true,
    // },
    // tax: {
    //   type: Number,
    //   required: true,
    // },
    // shippingCharges: {
    //   type: Number,
    //   default: 0,
    // },
    // discount: {
    //   type: Number,
    //   default: 0,
    // },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "Order Placed",
        "Packing",
        "Shipped",
        "Out for delivery",
        "Delivered",
      ],
      required: true,
      default: "Order Placed",
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "Stripe", "Razorpay"],
    },
    paymentStatus: {
      type: Boolean,
      required: true,
      default: false,
    },
    orderItem: {
      image: String,
      name: String,
      price: Number,
      size: String,
      quantity: Number,
      _id: {
        type: mongoose.Types.ObjectId,
        ref: "Product",
      },
    },
  },
  { timestamps: true }
);

export const Order =
  mongoose.models.order || mongoose.model("Order", orderSchema);
