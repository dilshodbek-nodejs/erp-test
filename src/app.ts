import express from "express";
import mongoose from "mongoose";

export async function startServer() {
  const app = express();
  app.use(express.json());

  await mongoose.connect(process.env.MONGO_URL!);

  const PORT = process.env.PORT
  
  app.listen(PORT);
}
