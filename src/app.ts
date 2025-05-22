import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import express from "express";
import morgan from "morgan";
import NodeCache from "node-cache";
import Stripe from "stripe";
import { errorMiddleware } from "./middlewares/error.middleware";
import { connectDB } from "./utils/features";

import orderRouter from "./routes/order.route";
import paymentRouter from "./routes/payment.route";
import productRouter from "./routes/product.route";
// import dashboardRouter from "./routes/stats.route";
import userRouter from "./routes/user.route";

config({
  path: "./.env",
});

const app = express();

const port = process.env.PORT || 4000;
const mongoUri = process.env.MONGODB_URI || "";
const stripeKey = process.env.STRIPE_KEY || "";
const dbName = process.env.DB_NAME || "";

const clientURL = process.env.CLIENT_URL || "";

connectDB(mongoUri, dbName);

export const stripe = new Stripe(stripeKey);

export const myCache = new NodeCache();

app.use(express.json());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);
app.use(morgan("dev"));
app.use(
  cors({
    origin: [clientURL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.get("/api/v1", (req, res) => {
  res.send("API Working with /api/v1");
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/order", orderRouter);
app.use("/api/v1/payment", paymentRouter);
// app.use("/api/v1/dashboard", dashboardRouter);

app.use("/uploads", express.static("uploads"));
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server listening on PORT: http://localhost:${port}/api/v1`);
});
