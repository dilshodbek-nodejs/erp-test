import { PurchaseReceiptService } from "../modules/purchase-receipts/receipt.service";
import { ProductModel } from "../modules/products/product.model";
import { StockModel } from "../modules/inventory/stock.model";
import { ProductTrackingType } from "../common/enums/product-tracking-type.enum";
import { Types } from "mongoose";

describe("Purchase Receipt", () => {
  it("confirm should increase stock", async () => {
    const product = await ProductModel.create({
      name: "iPhone",
      sku: "IP-1",
      tracking_type: ProductTrackingType.SIMPLE,
    });

    const receipt = await PurchaseReceiptService.createDraft({
      supplier_id: new Types.ObjectId("507f1f77bcf86cd799439013").toString(),
      warehouse_id: new Types.ObjectId("507f1f77bcf86cd799439012").toString(),
      receipt_date: new Date(),
      currency: "USD",
      created_by: "user1",
      lines: [
        {
          product_id: product._id,
          quantity: 5,
          unit_price: 500,
        },
      ],
    });

    await PurchaseReceiptService.confirm(
      (receipt as any)._id.toString(),
      "user1",
    );

    const stock = await StockModel.findOne({
      product_id: product._id,
      warehouse_id: new Types.ObjectId("507f1f77bcf86cd799439012"),
    });

    expect(stock?.quantity).toBe(5);
  });
});
