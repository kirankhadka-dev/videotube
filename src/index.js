import dotenv from "dotenv";
import mongoose from "mongoose";
import express from "express";

import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({ path: "./env" });

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
    });
  } catch (error) {
    console.error("MONGODB connection failed: ", error);
  }
};

startServer();

/** 

const app = express();

(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);

    app.on("error", (error) => {
      console.log("ERRR", error);
      throw error;
    });

    app.listen(process.env.PORT, () => {
      console.log("App is listening on PORT: ", process.env.PORT);
    });
  } catch (error) {
    console.error("ERROR: ", error);
    throw error;
  }
})()

*/
