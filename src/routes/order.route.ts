import express from "express";
import {
  allOrders,
  deleteOrder,
  getOrderDetails,
  myOrders,
  newOrder,
  processOrder,
} from "../controllers/order.controller";
import { adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

// User routes
router.post("/new", newOrder);
router.get("/my", myOrders);

// Admin routes
router.get("/all", adminOnly, allOrders);
router
  .route("/:id")
  .get(getOrderDetails)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default router;
