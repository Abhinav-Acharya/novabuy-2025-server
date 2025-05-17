import { NextFunction, Request, Response } from "express";
import { Document } from "mongoose";

export interface IProduct {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string[];
  category: string;
  subCategory: string;
  sizes?: string[];
  bestseller: boolean;
}

export interface INewUserRequestBody {
  _id: string;
  name: string;
  email: string;
  photo: string;
  gender: string;
  dob: Date;
}

export interface INewProductRequestBody {
  name: string;
  category: string;
  price: number;
  stock: number;
  image1?: File;
  image2?: File;
  image3?: File;
  image4?: File;
  description: string;
  subCategory: string;
  sizes: string;
  bestseller: string;
}

export type Image = {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
};

export type Controller = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export type SearchRequestQuery = {
  search?: string;
  price?: string;
  category?: string;
  sort?: string;
  page?: string;
};

export interface IBaseQuery {
  name?: {
    $regex: string;
    $options: string;
  };
  price?: {
    $lte: number;
  };
  category?: string;
}

export type InvalidateCacheProps = {
  userId?: string;
  admin?: boolean;
  product?: boolean;
  productId?: string | string[];
  order?: boolean;
  orderId?: string;
};

export type OrderItemType = {
  _id: string;
  image: string;
  name: string;
  price: number;
  size?: string;
  quantity: number;
};

export type ShippingInfoType = {
  firstName: string;
  lastName: string;
  email: string;
  street: string;
  city: string;
  state: string;
  country: string;
  pincode: number;
  phone: number;
};

export interface INewOrderReqBody {
  shippingInfo: ShippingInfoType;
  user: string;
  // subTotal: number;
  // tax: number;
  // shippingCharges: number;
  // discount: number;
  total: number;
  orderItems: OrderItemType[];
  paymentMethod: string;
}

export interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}

export type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};
