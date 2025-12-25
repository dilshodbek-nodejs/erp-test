import { Schema, model } from "mongoose";
import { ProductTrackingType } from "../../common/enums/product-tracking-type.enum";

const ProductSchema = new Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },

  tracking_type: {
    type: String,
    enum: Object.values(ProductTrackingType),
    required: true,
  },

  parent_product_id: { type: Schema.Types.ObjectId, ref: "Product" },

  is_active: { type: Boolean, default: true },

  created_at: { type: Date, default: Date.now },
});

export const ProductModel = model("Product", ProductSchema);
