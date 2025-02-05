import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// Handle json data
app.use(express.json({ limit: "16kb" }));

// Handle url data :

app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  })
);

// Handle static assets
app.use(express.static("public"));

// Handle cookie data :
app.use(cookieParser());

// Import routes :

import userRouter from "./routes/user.routes.js";

// Routes declaration
app.use("/api/v1/users", userRouter);

export default app;
