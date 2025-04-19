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
      type: Array,
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
    bestseller: {
      type: Boolean,
      required: [true, "Bestseller is required"],
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
