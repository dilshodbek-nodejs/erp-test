import mongoose from "mongoose";
import { PurchaseReceiptModel } from "./receipt.model";
import { DocumentStatus } from "../../common/enums/document-status.enum";
import { InventoryService } from "../inventory/inventory.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { ProductModel } from "../products/product.model";

export class PurchaseReceiptService {

    static async createDraft(data: any) {
        return PurchaseReceiptModel.create(data);
    }

    static async confirm(receiptId: string, userId: string) {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const receipt = await PurchaseReceiptModel.findById(receiptId).session(session);

            if (!receipt) {
                throw new AppError(ErrorCode.VALIDATION_ERROR, "Receipt not found");
            }

            if (receipt.status !== DocumentStatus.DRAFT) {
                throw new AppError(
                    ErrorCode.ILLEGAL_STATE,
                    "Only draf receipt can be confirmed"
                );
            }

            for (const line of receipt.lines) {
                const product = await ProductModel.findById(line.product_id);

                if (!product) {
                    throw new AppError(ErrorCode.VALIDATION_ERROR, "Product not found");
                }

                await InventoryService.increaseStock({
                    product_id: line.product_id.toString(),
                    warehouse_id: receipt.warehouse_id.toString(),
                    tracking_type: product.tracking_type,
                    quantity: line.quantity,
                    ...(line.serial_numbers && { serial_numbers: line.serial_numbers }),
                    ...(line.lot_code && { lot_code: line.lot_code }),
                    ...(line.expiration_date && { expiration_date: line.expiration_date })
                });
            }

            receipt.status = DocumentStatus.CONFIRMED;
            receipt.confirmed_at = new Date();
            receipt.confirmed_by = userId;

            await receipt.save({ session });

            await session.commitTransaction();
            session.endSession();

            return receipt;

        } catch (err) {
            await session.abortTransaction();
            session.endSession();
            throw err;
        }
    }

    static async cancel(
        receiptId: string,
        userId: string,
        reason: string
    ) {
        const receipt = await PurchaseReceiptModel.findById(receiptId);

        if (!receipt) {
            throw new AppError(ErrorCode.VALIDATION_ERROR, "Receipt not found");
        }

        if (receipt.status !== DocumentStatus.CONFIRMED) {
            throw new AppError(
                ErrorCode.ILLEGAL_STATE,
                "Only CONFIRMED receipt can be cancelled"
            );
        }

        if (!reason) {
            throw new AppError(
                ErrorCode.VALIDATION_ERROR,
                "Cancellation reason required"
            );
        }

        receipt.status = DocumentStatus.CANCELLED;
        receipt.cancelled_at = new Date();
        receipt.cancelled_by = userId;
        receipt.cancellation_reason = reason;

        await receipt.save();

        return receipt;
    }
}
