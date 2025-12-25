import { InventoryService } from "../modules/inventory/inventory.service";
import { ProductTrackingType } from "../common/enums/product-tracking-type.enum";
import { StockModel } from "../modules/inventory/stock.model";
import { Types } from "mongoose";

describe("Inventory Core", () => {
  it("should increase stock for simple product", async () => {
    await InventoryService.increaseStock({
      product_id: new Types.ObjectId("507f1f77bcf86cd799439011").toString(),
      warehouse_id: new Types.ObjectId("507f1f77bcf86cd799439012").toString(),
      tracking_type: ProductTrackingType.SIMPLE,
      quantity: 10,
    });

    const stock = await StockModel.findOne({
      product_id: new Types.ObjectId("507f1f77bcf86cd799439011"),
    });
    expect(stock?.quantity).toBe(10);
  });
});
