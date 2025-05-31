import { stripe } from "../app";
import { tryCatch } from "../middlewares/error.middleware";
import { Coupon } from "../models/coupon.model";
import { Product } from "../models/product.model";
import { User } from "../models/user.model";
import { OrderItemType, ShippingInfoType } from "../types/types";
import { calculateOrderTotal } from "../utils/features";
import ErrorHandler from "../utils/utility-class";

const createCoupon = tryCatch(async (req, res, next) => {
  const { coupon, amount } = req.body;

  if (!coupon || !amount)
    return next(new ErrorHandler("One of the fields is missing", 400));

  await Coupon.create({ code: coupon, amount });

  return res.status(201).json({
    success: true,
    message: `Coupon "${coupon}" created successfully`,
  });
});

const getAllCoupons = tryCatch(async (req, res, next) => {
  const coupons = await Coupon.find({});

  return res.status(200).json({
    success: true,
    coupons,
  });
});

const deleteCoupon = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) return next(new ErrorHandler("No coupon found", 400));

  return res.status(200).json({
    success: true,
    message: `Coupon "${coupon.code}" deleted successfully`,
  });
});

const getDiscountAmount = tryCatch(async (req, res, next) => {
  const { couponCode } = req.query;

  const coupon = await Coupon.findOne({ code: couponCode });

  if (!coupon) return next(new ErrorHandler("Invalid coupon code", 400));

  return res.status(200).json({
    success: true,
    discount: coupon.amount,
  });
});

const createPaymentIntent = tryCatch(async (req, res, next) => {
  const { id } = req.query;

  const user = await User.findById(id).select("name");

  if (!user) return next(new ErrorHandler("Please login to continue.", 401));

  const {
    items,
    shippingInfo,
    coupon,
  }: {
    items: OrderItemType[];
    shippingInfo: ShippingInfoType;
    coupon: string | undefined;
  } = req.body;

  if (!items)
    return next(new ErrorHandler("Please add an item to checkout", 400));

  if (!shippingInfo)
    return next(new ErrorHandler("Please add shipping details", 400));

  let discountAmount = 0;

  if (coupon) {
    const discount = await Coupon.findOne({ code: coupon });
    if (!discount) return next(new ErrorHandler("Invalid Coupon Code", 400));
    discountAmount = discount.amount;
  }

  const productIDs = items.map((item) => item._id);

  const products = await Product.find({
    _id: { $in: productIDs },
  });

  const { total } = calculateOrderTotal(items, products, discountAmount);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total * 100,
    currency: "inr",
    description: "Novabuy",
    shipping: {
      name: user.name,
      address: {
        line1: shippingInfo.street,
        postal_code: shippingInfo.pincode.toString(),
        city: shippingInfo.city,
        state: shippingInfo.state,
        country: shippingInfo.country,
      },
    },
  });

  return res.status(200).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export {
  createCoupon,
  createPaymentIntent,
  deleteCoupon,
  getAllCoupons, getDiscountAmount
};

