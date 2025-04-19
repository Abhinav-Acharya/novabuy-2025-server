import { NextFunction, Request, Response } from "express";
import { myCache } from "../app";
import { tryCatch } from "../middlewares/error.middleware";
import { Product } from "../models/product.model";
import {
  IBaseQuery,
  INewProductRequestBody,
  Image,
  SearchRequestQuery,
} from "../types/types";
import { invalidateCache } from "../utils/features";
import { cloudinaryDelete, cloudinaryUpload } from "../utils/fileUpload";
import ErrorHandler from "../utils/utility-class";

const getAllProducts = tryCatch(
  async (req: Request<{}, {}, {}, SearchRequestQuery>, res, next) => {
    const { category, price, search, sort } = req.query;

    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = limit * (page - 1);

    const baseQuery: IBaseQuery = {};

    if (search)
      baseQuery.name = {
        $regex: search,
        $options: "i",
      };

    if (price)
      baseQuery.price = {
        $lte: Number(price),
      };

    if (category) baseQuery.category = category;

    const productsPromise = Product.find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip);

    const [products, filteredOnlyProducts] = await Promise.all([
      await productsPromise,
      await Product.find(baseQuery),
    ]);

    const totalPage = Math.ceil(filteredOnlyProducts.length / limit);

    return res.status(201).json({ success: true, products, totalPage });
  }
);

//revalidate
const getLatestProduct = tryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("latest-products")) {
    products = JSON.parse(myCache.get("latest-products") as string);
  } else {
    products = await Product.find({}).sort({ createdAt: -1 }).limit(5);
    myCache.set("latest-products", JSON.stringify(products));
  }

  return res.status(201).json({ success: true, products });
});

//revalidate
const getAllCategories = tryCatch(async (req, res, next) => {
  let categories;

  if (myCache.has("categories")) {
    categories = JSON.parse(myCache.get("categories") as string);
  } else {
    categories = await Product.distinct("category");
    myCache.set("categories", JSON.stringify(categories));
  }

  return res.status(201).json({ success: true, categories });
});

//revalidate
const getAdminProducts = tryCatch(async (req, res, next) => {
  let products;

  if (myCache.has("all-products")) {
    products = JSON.parse(myCache.get("all-products") as string);
  } else {
    products = await Product.find({});
    myCache.set("all-products", JSON.stringify(products));
  }

  return res.status(201).json({ success: true, products });
});

const getProductDetails = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  let product;

  if (myCache.has(`product-${id}`)) {
    product = JSON.parse(myCache.get(`product-${id}`) as string);
  } else {
    product = await Product.findById(id);
    if (!product) return next(new ErrorHandler("No product found", 404));

    myCache.set(`product-${id}`, JSON.stringify(product));
  }

  return res.status(201).json({ success: true, product });
});

const updateProduct = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const { name, description, price, category, subCategory, sizes, bestseller } =
    req.body;
  const files = (req.files as any) || {};

  const product = await Product.findById(id);
  if (!product) return next(new ErrorHandler("No product found", 404));

  const currentImages = product.image;

  // Update only the specific indexes
  const updatedImages = [...currentImages];

  const imageKeys = ["image1", "image2", "image3", "image4"];

  for (let i = 0; i < imageKeys.length; i++) {
    const key = imageKeys[i];
    if (files[key]?.[0]) {
      // Optionally: delete old image from Cloudinary if exists
      if (currentImages[i]) await cloudinaryDelete([currentImages[i]]);
      const uploaded = await cloudinaryUpload(files[key][0].path);
      updatedImages[i] = uploaded!.secure_url;
    }
  }

  product.image = updatedImages.filter((url) => url !== null);

  // Update other fields
  if (name) product.name = name;
  if (price) product.price = price;
  if (category) product.category = category;
  if (description) product.description = description;
  if (subCategory) product.subCategory = subCategory;
  if (sizes) product.sizes = JSON.parse(sizes);
  if (typeof bestseller !== "undefined") product.bestseller = bestseller;

  await product.save();

  invalidateCache({
    product: true,
    productId: String(product._id),
    admin: true,
  });

  return res
    .status(200)
    .json({ success: true, message: "Product updated successfully" });
});

const deleteProduct = tryCatch(async (req, res, next) => {
  const { id: productId } = req.params;

  const product = await Product.findById(productId);

  if (!product) return next(new ErrorHandler("No product found", 404));

  await cloudinaryDelete(product.image);

  await product.deleteOne();

  invalidateCache({
    product: true,
    admin: true,
    productId: String(product._id),
  });

  return res
    .status(201)
    .json({ success: true, message: "Product deleted successfully" });
});

const newProduct = tryCatch(
  async (
    req: Request<{}, {}, INewProductRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const {
      name,
      description,
      price,
      category,
      subCategory,
      sizes,
      bestseller,
    } = req.body;

    if (!name || !description || !price || !category || bestseller === null) {
      return next(new ErrorHandler("One of the fields is missing", 404));
    }

    const image1: Image =
      (req.files as any).image1 && (req.files as any).image1[0];
    const image2: Image =
      (req.files as any).image2 && (req.files as any).image2[0];
    const image3: Image =
      (req.files as any).image3 && (req.files as any).image3[0];
    const image4: Image =
      (req.files as any).image4 && (req.files as any).image4[0];

    const images = [image1, image2, image3, image4].filter(
      (item) => item !== undefined
    );

    if (images.length <= 0) {
      return next(
        new ErrorHandler("Please add atleast one product image", 404)
      );
    }

    const cloudinaryUrls = await Promise.all(
      images.map(async (image) => {
        try {
          let response = await cloudinaryUpload(image.path);
          if (response) return response.secure_url;
        } catch (error) {
          console.error(error);
          return null;
        }
      })
    );

    // console.log(cloudinaryUrls);

    if (cloudinaryUrls.length === 0)
      return next(
        new ErrorHandler("Images could not be uploaded to cloudinary", 404)
      );

    await Product.create({
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: JSON.parse(sizes),
      bestseller: bestseller === "true" ? true : false,
      image: cloudinaryUrls,
    });

    invalidateCache({ product: true, admin: true });

    return res
      .status(201)
      .json({ success: true, message: "Product created successfully" });
  }
);

export {
  deleteProduct,
  getAdminProducts,
  getAllCategories,
  getAllProducts,
  getLatestProduct,
  getProductDetails,
  newProduct,
  updateProduct,
};
