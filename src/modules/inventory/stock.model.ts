import { Schema, model } from "mongoose";

const StockSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true },

  quantity: { type: Number, required: true, default: 0 }
});

StockSchema.index({ product_id: 1, warehouse_id: 1 }, { unique: true });

export const StockModel = model("Stock", StockSchema);
