import mongoose from "mongoose";
import { myCache } from "../app";
import { Product } from "../models/product.model";
import { InvalidateCacheProps, IProduct, OrderItemType } from "../types/types";

export const connectDB = async (uri: string, dbName: string) => {
  // console.log(uri, dbName);
  try {
    await mongoose.connect(uri, { dbName });
    console.log("Database connection successfull.");
  } catch (error) {
    console.error("Database connection failed:", error, uri);
  }
};

export const invalidateCache = ({
  product,
  admin,
  order,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys = [
      "latest-products",
      "categories",
      "all-products",
      ...(typeof productId === "string"
        ? [`product-${productId}`]
        : productId?.map((id) => `product-${id}`) || []),
    ];
    myCache.del(productKeys);
  }

  if (admin) {
    myCache.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }

  if (order) {
    const orderKeys = ["all-orders", `my-orders-${userId}`, `order-${orderId}`];
    myCache.del(orderKeys);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order._id);
    if (!product) throw new Error("Product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculateOrderTotal = (
  items: OrderItemType[],
  products: IProduct[],
  discountAmount: number
) => {
  const subtotal = products.reduce((prev, curr) => {
    const item = items.find((i) => i._id === curr._id.toString());
    return item ? curr.price * item.quantity + prev : prev;
  }, 0);

  const tax = subtotal * 0.18;
  const shipping = subtotal < 5000 ? 299 : 0;
  const total = Math.max(subtotal + tax + shipping - discountAmount, 0);

  return { subtotal, tax, shipping, total };
};

//admin features

// export const calcPercent = (currentMonth: number, previousMonth: number) => {
//   if (previousMonth === 0) return currentMonth * 100;
//   return Number(((currentMonth / previousMonth) * 100).toFixed(0));
// };

// export const getCategoriesPercent = async ({
//   categories,
//   productCount,
// }: {
//   categories: string[];
//   productCount: number;
// }) => {
//   const categoriesCount = await Promise.all(
//     categories.map((category) => Product.countDocuments({ category }))
//   );
//   return categories.map((category, i) => ({
//     [category]: Math.round((categoriesCount[i] / productCount) * 100),
//   }));
// };

// export const getChartData = ({
//   length,
//   docArr,
//   today,
//   property,
// }: FuncProps) => {
//   const data = new Array(length).fill(0);
//   docArr.forEach((i) => {
//     const creationDate = i.createdAt;
//     const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
//     if (monthDiff < length) {
//       data[length - monthDiff - 1] += property ? i[property] : 1;
//     }
//   });
//   return data;
// };
