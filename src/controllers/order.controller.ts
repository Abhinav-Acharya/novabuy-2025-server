import { NextFunction, Request, Response } from "express";
import { myCache } from "../app";
import { tryCatch } from "../middlewares/error.middleware";
import { Order } from "../models/order.model";
import { INewOrderReqBody } from "../types/types";
import { invalidateCache } from "../utils/features";
import ErrorHandler from "../utils/utility-class";

const myOrders = tryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  let orders = [];

  const key = `my-orders-${user}`;

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find({ user });
    myCache.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({ success: true, orders });
});

const allOrders = tryCatch(async (req, res, next) => {
  let orders = [];

  const key = "all-orders";

  if (myCache.has(key)) orders = JSON.parse(myCache.get(key) as string);
  else {
    orders = await Order.find().populate("user", "name");
    myCache.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({ success: true, orders });
});

const getOrderDetails = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const key = `order-${id}`;

  let order;

  if (myCache.has(key)) order = JSON.parse(myCache.get(key) as string);
  else {
    order = await Order.findById(id).populate("user", "name");

    if (!order) return next(new ErrorHandler("Order not found", 404));

    myCache.set(key, JSON.stringify(order));
  }

  return res.status(200).json({ success: true, order });
});

const newOrder = tryCatch(
  async (
    req: Request<{}, {}, INewOrderReqBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      shippingInfo,
      orderItems,
      user,
      // subTotal,
      // tax,
      // shippingCharges,
      // discount,
      total,
      paymentMethod,
    } = req.body;

    if (!shippingInfo || !user || !orderItems || !total || !paymentMethod)
      return next(new ErrorHandler("No order added", 400));

    let paymentStatus: boolean = false;

    if (["Stripe", "Razorpay"].includes(paymentMethod)) paymentStatus = true;

    try {
      const order: INewOrderReqBody = await Order.create({
        shippingInfo,
        orderItems,
        user,
        // subTotal,
        // tax,
        // shippingCharges,
        // discount,
        total,
        paymentMethod,
        paymentStatus,
      });
    } catch (error) {
      console.log(error);
    }

    // await reduceStock(orderItems);

    invalidateCache({
      product: true,
      admin: true,
      order: true,
      userId: user,
      // productId: order.orderItems.map((item) => String(item._id)),
    });

    return res
      .status(201)
      .json({ success: true, message: "Order placed successfully" });
  }
);

const processOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  console.log(id, status);

  if (!status)
    return next(new ErrorHandler("Please select an order status", 404));

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  order.status = status;

  await order.save();

  invalidateCache({
    product: false,
    admin: true,
    order: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res
    .status(201)
    .json({
      success: true,
      message: `Order status has been changed to ${status}`,
    });
});

const deleteOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);

  if (!order) return next(new ErrorHandler("Order not found", 404));

  await order.deleteOne();

  await invalidateCache({
    product: false,
    admin: true,
    order: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res
    .status(201)
    .json({ success: true, message: "Order deleted successfully" });
});

export {
  allOrders,
  deleteOrder,
  getOrderDetails,
  myOrders,
  newOrder,
  processOrder,
};
