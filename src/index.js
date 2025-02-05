import "dotenv/config";

import express from "express";
import connectDB from "./db/index.js";

import app from "./app.js";

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, () => {
      console.log(`Server started at PORT :  ${process.env.PORT}`);
    });

    app.on("error", (error) => {
      console.log("ERROR in app :", error);
    });
  })
  .catch((error) => {
    console.log("MONGO db connection failed :: ", error);
  });
