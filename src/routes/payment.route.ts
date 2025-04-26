import express from "express";
import {
  createCoupon,
  createPaymentIntent,
  deleteCoupon,
  getAllCoupons,
  getDiscountAmount,
} from "../controllers/payment.controller";
import { adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

// Payment routes
router.post("/create", createPaymentIntent);
router.get("/discount", getDiscountAmount);

// Coupon routes (Admin only)
router.post("/coupon/new", adminOnly, createCoupon);
router.get("/coupon/all", adminOnly, getAllCoupons);
router.delete("/coupon/:id", adminOnly, deleteCoupon);

export default router;
