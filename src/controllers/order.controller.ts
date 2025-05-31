import { NextFunction, Request, Response } from "express";
import { myCache } from "../app";
import { tryCatch } from "../middlewares/error.middleware";
import { Order } from "../models/order.model";
import { INewOrderReqBody } from "../types/types";
import { invalidateCache, reduceStock } from "../utils/features";
import ErrorHandler from "../utils/utility-class";
import { v4 as uuidv4 } from "uuid";

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

const newOrder = tryCatch(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      shippingInfo,
      orderItems,
      user,
      total,
      paymentMethod,
    }: INewOrderReqBody = req.body;

    if (!shippingInfo || !user || !orderItems || !total || !paymentMethod) {
      throw new ErrorHandler("Invalid order data", 400);
    }

    const paymentStatus = ["Stripe", "Razorpay"].includes(paymentMethod);

    const groupId = uuidv4();

    const order = await Promise.all(
      orderItems.map(async (orderItem: any) => {
        return await Order.create({
          shippingInfo,
          orderItem,
          user,
          total: orderItem.price * orderItem.quantity,
          paymentMethod,
          paymentStatus,
          groupId,
        });
      })
    );

    await reduceStock(orderItems);

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
