import express from "express";
import {
  deleteUser,
  getAllUsers,
  getUser,
  getUserCart,
  newUser,
  updateCart,
  updateUser,
} from "../controllers/user.controller";
import { adminOnly } from "../middlewares/auth.middleware";

const router = express.Router();

// Public routes
router.post("/new", newUser);
router.get("/cart", getUserCart);
router.put("/cart-update", updateCart);

// Admin routes
router.get("/all", adminOnly, getAllUsers);
router
  .route("/:id")
  .get(getUser)
  .delete(adminOnly, deleteUser)
  .put(adminOnly, updateUser);

export default router;
