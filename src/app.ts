import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export async function startServer() {
  const app = express();
  app.use(express.json());

  await mongoose.connect(process.env.MONGO_URL!);

  const PORT = process.env.PORT || 8080;
  
  app.listen(PORT);
}
