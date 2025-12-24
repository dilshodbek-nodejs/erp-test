import { Schema, model } from "mongoose";
import { ProductTrackingType } from "../../common/enums/product-tracking-type.enum";

const StockTrackingSchema = new Schema({
  product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  warehouse_id: { type: Schema.Types.ObjectId, required: true },

  tracking_type: {
    type: String,
    enum: Object.values(ProductTrackingType),
    required: true
  },

  serial_number: { type: String },
  lot_code: { type: String },
  expiration_date: { type: Date },

  quantity: { type: Number, default: 0 }
});

StockTrackingSchema.index(
  { product_id: 1, warehouse_id: 1, serial_number: 1 },
  { unique: true, sparse: true }
);

export const StockTrackingModel = model(
  "StockTracking",
  StockTrackingSchema
);
