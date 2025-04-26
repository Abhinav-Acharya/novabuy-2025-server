import { NextFunction, Request, Response } from "express";
import { myCache } from "../app";
import { tryCatch } from "../middlewares/error.middleware";
import { Order } from "../models/order.model";
import { INewOrderReqBody } from "../types/types";
import { invalidateCache } from "../utils/features";
import ErrorHandler from "../utils/utility-class";

const getCachedData = async (key: string, fetchData: () => Promise<any>) => {
  if (myCache.has(key)) {
    return JSON.parse(myCache.get(key) as string);
  }

  const data = await fetchData();

  myCache.set(key, JSON.stringify(data));
  
  return data;
};

const myOrders = tryCatch(async (req, res, next) => {
  const { id: user } = req.query;

  const key = `my-orders-${user}`;
  const orders = await getCachedData(key, () => Order.find({ user }));

  return res.status(200).json({ success: true, orders });
});

const allOrders = tryCatch(async (req, res, next) => {
  const key = "all-orders";
  const orders = await getCachedData(key, () =>
    Order.find().populate("user", "name")
  );

  return res.status(200).json({ success: true, orders });
});

const getOrderDetails = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const key = `order-${id}`;
  const order = await getCachedData(key, async () => {
    const foundOrder = await Order.findById(id).populate("user", "name");
    if (!foundOrder) throw new ErrorHandler("Order not found", 404);
    return foundOrder;
  });

  return res.status(200).json({ success: true, order });
});

const validateNewOrder = (body: INewOrderReqBody) => {
  const { shippingInfo, orderItems, user, total, paymentMethod } = body;
  if (!shippingInfo || !user || !orderItems || !total || !paymentMethod) {
    throw new ErrorHandler("Invalid order data", 400);
  }
};

const newOrder = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const { shippingInfo, orderItems, user, total, paymentMethod } = req.body;

    validateNewOrder(req.body);

    const paymentStatus = ["Stripe", "Razorpay"].includes(paymentMethod);

    const order = await Order.create({
      shippingInfo,
      orderItems,
      user,
      total,
      paymentMethod,
      paymentStatus,
    });

    invalidateCache({
      product: true,
      admin: true,
      order: true,
      userId: user,
    });

    return res
      .status(201)
      .json({ success: true, message: "Order placed successfully", order });
  }
);

const processOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) throw new ErrorHandler("Please select an order status", 400);

  const order = await Order.findById(id);
  if (!order) throw new ErrorHandler("Order not found", 404);

  order.status = status;
  await order.save();

  invalidateCache({
    product: false,
    admin: true,
    order: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res.status(200).json({
    success: true,
    message: `Order status has been changed to ${status}`,
  });
});

const deleteOrder = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const order = await Order.findById(id);
  if (!order) throw new ErrorHandler("Order not found", 404);

  await order.deleteOne();

  invalidateCache({
    product: false,
    admin: true,
    order: true,
    userId: order.user,
    orderId: String(order._id),
  });

  return res
    .status(200)
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
