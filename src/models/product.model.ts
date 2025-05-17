import mongoose, { Schema } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    image: {
      type: [String],
      required: [true, "Image is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    subCategory: {
      type: String,
      trim: true,
    },
    sizes: {
      type: [String],
      required: false,
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
    },
    bestseller: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function (next) {
  if (this.sizes === undefined || this.sizes?.length === 0) {
    this.sizes = undefined;
  }
  next();
});

export const Product =
  mongoose.models.product || mongoose.model("Product", productSchema);
