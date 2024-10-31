import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));

// Middleware to handle json data
app.use(express.json({ limit: "16kb" }));

//Middleware to handle url data

app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// Middleare to handle static files

app.use(express.static("public"));

// Middleware to handle cookie-data

app.use(cookieParser());

// Routes import
import userRouter from "./routes/user.route.js";

// routes declaration
app.use("/api/v1/users", userRouter);

export { app };
