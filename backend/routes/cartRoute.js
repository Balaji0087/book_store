import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearUserCart,
} from "../controllers/cartController.js";

import authMiddleware from "../middlewares/authMiddleware.js";

const cartRouter = express.Router();

cartRouter.post("/add", authMiddleware, addToCart);
cartRouter.get("/", authMiddleware, getCart);
cartRouter.put("/update", authMiddleware, updateCartItem);
cartRouter.delete("/remove/:bookId", authMiddleware, removeCartItem);
cartRouter.delete("/clear", authMiddleware, clearUserCart);


export default cartRouter;
