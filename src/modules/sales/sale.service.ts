import mongoose from "mongoose";
import { SaleModel } from "./sale.model";
import { DocumentStatus } from "../../common/enums/document-status.enum";
import { InventoryService } from "../inventory/inventory.service";
import { ProductModel } from "../products/product.model";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";

export class SaleService {
  static async createDraft(data: any) {
    return SaleModel.create(data);
  }

  static async confirm(saleId: string, userId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sale = await SaleModel.findById(saleId).session(session);

      if (!sale) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Sale not found");
      }

      if (sale.status !== DocumentStatus.DRAFT) {
        throw new AppError(
          ErrorCode.ILLEGAL_STATE,
          "Only DRAFT sale can be confirmed",
        );
      }

      for (const line of sale.lines) {
        const product = await ProductModel.findById(line.product_id);

        if (!product) {
          throw new AppError(ErrorCode.VALIDATION_ERROR, "Product not found");
        }

        await InventoryService.checkAvailability(
          line.product_id.toString(),
          sale.warehouse_id.toString(),
          line.quantity,
        );

        await InventoryService.decreaseStock({
          product_id: line.product_id.toString(),
          warehouse_id: sale.warehouse_id.toString(),
          tracking_type: product.tracking_type,
          quantity: line.quantity,
          ...(line.serial_numbers && { serial_numbers: line.serial_numbers }),
          ...(line.lot_code && { lot_code: line.lot_code }),
          ...(line.expiration_date && {
            expiration_date: line.expiration_date,
          }),
        });
      }

      sale.status = DocumentStatus.CONFIRMED;
      sale.confirmed_at = new Date();
      sale.confirmed_by = userId;

      await sale.save({ session });

      await session.commitTransaction();
      session.endSession();

      return sale;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }

  static async cancel(saleId: string, userId: string, reason: string) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const sale = await SaleModel.findById(saleId).session(session);

      if (!sale) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Sale not found");
      }

      if (sale.status !== DocumentStatus.CONFIRMED) {
        throw new AppError(
          ErrorCode.ILLEGAL_STATE,
          "Only CONFIRMED sale can be cancelled",
        );
      }

      if (!reason) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Cancellation reason required",
        );
      }

      for (const line of sale.lines) {
        const product = await ProductModel.findById(line.product_id);

        if (!product) {
          throw new AppError(ErrorCode.VALIDATION_ERROR, "Product not found");
        }

        await InventoryService.increaseStock({
          product_id: line.product_id.toString(),
          warehouse_id: sale.warehouse_id.toString(),
          tracking_type: product.tracking_type,
          quantity: line.quantity,
          ...(line.serial_numbers && { serial_numbers: line.serial_numbers }),
          ...(line.lot_code && { lot_code: line.lot_code }),
          ...(line.expiration_date && {
            expiration_date: line.expiration_date,
          }),
        });
      }

      sale.status = DocumentStatus.CANCELLED;
      sale.cancelled_at = new Date();
      sale.cancelled_by = userId;
      sale.cancellation_reason = reason;

      await sale.save({ session });

      await session.commitTransaction();
      session.endSession();

      return sale;
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  }
}
