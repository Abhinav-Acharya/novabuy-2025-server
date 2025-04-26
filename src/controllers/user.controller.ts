import { NextFunction, Request, Response } from "express";
import { tryCatch } from "../middlewares/error.middleware";
import { User } from "../models/user.model";
import { INewUserRequestBody } from "../types/types";
import ErrorHandler from "../utils/utility-class";

const newUser = tryCatch(
  async (
    req: Request<{}, {}, INewUserRequestBody>,
    res: Response,
    next: NextFunction
  ) => {
    const { name, email, photo, gender, _id, dob } = req.body;

    if (!_id || !name || !email || !photo || !gender || !dob) {
      return next(
        new ErrorHandler("One of the required fields is missing", 400)
      );
    }

    let user = await User.findById(_id);

    if (user) {
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
      });
    }

    user = await User.create({
      name,
      email,
      photo,
      gender,
      _id,
      dob,
    });

    return res.status(201).json({
      success: true,
      message: `Welcome to Novabuy, ${user.name}`,
    });
  }
);

const getAllUsers = tryCatch(async (req, res, next) => {
  const users = await User.find({});
  return res.status(200).json({
    success: true,
    users,
  });
});

const getUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("No user found", 404));

  return res.status(200).json({
    success: true,
    user,
  });
});

const deleteUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("No user found", 404));

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

const updateUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("No user found", 404));

  // Toggle user role
  user.role = user.role === "user" ? "admin" : "user";

  await user.save();

  return res.status(200).json({
    success: true,
    message: `Role updated to ${
      user.role[0].toUpperCase() + user.role.slice(1)
    }`,
  });
});

// Update user cart
const updateCart = tryCatch(async (req, res, next) => {
  const { userId, cartItems } = req.body;

  if (!userId || !cartItems) {
    return next(new ErrorHandler("Invalid data provided", 400));
  }

  const user = await User.findByIdAndUpdate(userId, { cartData: cartItems });
  if (!user) return next(new ErrorHandler("No user found", 404));

  return res.status(200).json({
    success: true,
    message: "Cart updated successfully",
  });
});

const getUserCart = tryCatch(async (req, res, next) => {
  const { id } = req.query;

  if (!id) return next(new ErrorHandler("User ID is required", 400));

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("No user found", 404));

  const cartData = user.cartData;

  return res.status(200).json({
    success: true,
    message: "User cart fetched successfully",
    cartData,
  });
});

export {
  deleteUser,
  getAllUsers,
  getUser, getUserCart, newUser, updateCart, updateUser
};

