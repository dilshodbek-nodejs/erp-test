import { Schema, model } from "mongoose";
import { DocumentStatus } from "../../common/enums/document-status.enum";

const SaleLineSchema = new Schema({
    product_id: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },

    serial_numbers: [{ type: String }],
    lot_code: { type: String },
    expiration_date: { type: Date }
});

const SaleSchema = new Schema({
    customer_id: { type: Schema.Types.ObjectId },
    warehouse_id: { type: Schema.Types.ObjectId, required: true },

    sale_date: { type: Date, required: true },
    currency: { type: String, required: true },

    status: {
        type: String,
        enum: Object.values(DocumentStatus),
        default: DocumentStatus.DRAFT
    },

    lines: { type: [SaleLineSchema], required: true },

    created_at: { type: Date, default: Date.now },
    created_by: { type: String, required: true },

    confirmed_at: Date,
    confirmed_by: String,

    cancelled_at: Date,
    cancelled_by: String,
    cancellation_reason: String
});

export const SaleModel = model("Sale", SaleSchema);
