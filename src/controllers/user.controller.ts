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

    let user = await User.findById(_id);

    if (user)
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}`,
      });

    if (!_id || !name || !email || !photo || !gender || !dob)
      next(new ErrorHandler("One of the fields is missing", 400));

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

  if (!user) return next(new ErrorHandler("No user found", 400));

  return res.status(200).json({
    success: true,
    user,
  });
});

const deleteUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("No user found", 400));

  await user.deleteOne();

  return res.status(200).json({
    success: true,
    message: "User deleted succesfully",
  });
});

const updateUser = tryCatch(async (req, res, next) => {
  const { id } = req.params;

  const user = await User.findById(id);
  if (!user) return next(new ErrorHandler("No user found", 400));

  user.role = user.role === "user" ? "admin" : "user";

  await user.save();

  return res.status(200).json({
    success: true,
    message: `Role updated to ${
      user.role[0].toUpperCase() + user.role.slice(1)
    }`,
  });
});

// upadte user cart
const updateCart = tryCatch(async (req, res, next) => {
  const { userId, cartItems } = req.body;

  if (!userId) return next(new ErrorHandler("Invalid Data", 400));

  const user = await User.findByIdAndUpdate(userId, { cartData: cartItems });

  if (!user) return next(new ErrorHandler("No user found", 400));

  return res.status(200).json({
    success: true,
    message: `Cart updated`,
  });
});

const getUserCart = tryCatch(async (req, res, next) => {
  const { id } = req.query;
  const user = await User.findById(id);

  if (!user) return next(new ErrorHandler("No user found", 400));

  let cartData = await user.cartData;

  return res.status(200).json({
    success: true,
    message: `User cart fetched`,
    cartData,
  });
});

export {
  deleteUser,
  getAllUsers,
  getUser,
  newUser,
  updateUser,
  updateCart,
  getUserCart,
};
