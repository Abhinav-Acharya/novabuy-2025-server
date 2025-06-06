import express from "express";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategoriesAndSubcategories,
  getLatestProduct,
  getProductDetails,
  newProduct,
  updateProduct,
} from "../controllers/product.controller";
import { adminOnly } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/multer.middleware";

const router = express.Router();

// Reusable upload configuration for product images
const uploadFields = upload.fields([
  { name: "image1", maxCount: 1 },
  { name: "image2", maxCount: 1 },
  { name: "image3", maxCount: 1 },
  { name: "image4", maxCount: 1 },
]);

// Admin routes
router.post("/new", adminOnly, uploadFields, newProduct);
router.get("/all", getAdminProducts);

// Public routes
router.get("/latest", getLatestProduct);
router.get("/categories", getAllCategoriesAndSubcategories);

// Product-specific routes
router
  .route("/:id")
  .get(getProductDetails)
  .put(adminOnly, uploadFields, updateProduct)
  .delete(adminOnly, deleteProduct);

export default router;
