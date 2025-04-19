import express from "express";
import { adminOnly } from "../middlewares/auth.middleware";
import {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProduct,
  getProductDetails,
  newProduct,
  updateProduct,
} from "../controllers/product.controller";
import { upload } from "../middlewares/multer.middleware";

const router = express.Router();

router.post(
  "/new",
  adminOnly,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  newProduct
);
// router.get("/all", getAllProducts);
router.get("/latest", getLatestProduct);
router.get("/categories", getAllCategories);
router.get("/all", getAdminProducts);
router
  .route("/:id")
  .get(getProductDetails)
  .put(
    adminOnly,
    upload.fields([
      { name: "image1", maxCount: 1 },
      { name: "image2", maxCount: 1 },
      { name: "image3", maxCount: 1 },
      { name: "image4", maxCount: 1 },
    ]),
    updateProduct
  )
  .delete(adminOnly, deleteProduct);

export default router;
