import { StockModel } from "./stock.model";
import { StockTrackingModel } from "./stock-tracking.model";
import { ProductTrackingType } from "../../common/enums/product-tracking-type.enum";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";

export class InventoryService {

    static async increaseStock(params: {
        product_id: string;
        warehouse_id: string;
        tracking_type: ProductTrackingType;
        quantity: number;
        serial_numbers?: string[];
        lot_code?: string;
        expiration_date?: Date;
    }) {

        await StockModel.findOneAndUpdate(
            { product_id: params.product_id, warehouse_id: params.warehouse_id },
            { $inc: { quantity: params.quantity } },
            { upsert: true }
        );

        if (params.tracking_type === ProductTrackingType.SERIALIZED) {
            if (!params.serial_numbers || params.serial_numbers.length !== params.quantity) {
                throw new AppError(
                    ErrorCode.VALIDATION_ERROR,
                    "Serial count mismatch"
                );
            }

            for (const serial of params.serial_numbers) {
                await StockTrackingModel.create({
                    product_id: params.product_id,
                    warehouse_id: params.warehouse_id,
                    tracking_type: params.tracking_type,
                    serial_number: serial,
                    quantity: 1
                });
            }
        }
    }

    static async checkAvailability(
        product_id: string,
        warehouse_id: string,
        required_qty: number
    ) {
        const stock = await StockModel.findOne({ product_id, warehouse_id });
        if (!stock || stock.quantity < required_qty) {
            throw new AppError(
                ErrorCode.STOCK_NOT_AVAILABLE,
                "Not enough stock"
            );
        }
    }

}
