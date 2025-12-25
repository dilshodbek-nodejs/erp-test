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
      { upsert: true },
    );

    if (params.tracking_type === ProductTrackingType.SERIALIZED) {
      if (
        !params.serial_numbers ||
        params.serial_numbers.length !== params.quantity
      ) {
        throw new AppError(ErrorCode.VALIDATION_ERROR, "Serial count mismatch");
      }

      for (const serial of params.serial_numbers) {
        await StockTrackingModel.create({
          product_id: params.product_id,
          warehouse_id: params.warehouse_id,
          tracking_type: params.tracking_type,
          serial_number: serial,
          quantity: 1,
        });
      }
    }
  }

  static async checkAvailability(
    product_id: string,
    warehouse_id: string,
    required_qty: number,
  ) {
    const stock = await StockModel.findOne({ product_id, warehouse_id });
    if (!stock || stock.quantity < required_qty) {
      throw new AppError(ErrorCode.STOCK_NOT_AVAILABLE, "Not enough stock");
    }
  }

  static async decreaseStock(params: {
    product_id: string;
    warehouse_id: string;
    tracking_type: ProductTrackingType;
    quantity: number;
    serial_numbers?: string[];
    lot_code?: string;
    expiration_date?: Date;
  }) {
    const stock = await StockModel.findOne({
      product_id: params.product_id,
      warehouse_id: params.warehouse_id,
    });

    if (!stock || stock.quantity < params.quantity) {
      throw new AppError(
        ErrorCode.STOCK_NOT_AVAILABLE,
        "Not enough stock to revert",
      );
    }

    await StockModel.updateOne(
      { product_id: params.product_id, warehouse_id: params.warehouse_id },
      { $inc: { quantity: -params.quantity } },
    );

    if (params.tracking_type === ProductTrackingType.SERIALIZED) {
      if (
        !params.serial_numbers ||
        params.serial_numbers.length !== params.quantity
      ) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          "Serial numbers required for revert",
        );
      }

      const res = await StockTrackingModel.deleteMany({
        product_id: params.product_id,
        warehouse_id: params.warehouse_id,
        serial_number: { $in: params.serial_numbers },
      });

      if (res.deletedCount !== params.quantity) {
        throw new AppError(
          ErrorCode.ILLEGAL_STATE,
          "Serial stock mismatch on revert",
        );
      }
    }

    if (params.tracking_type === ProductTrackingType.LOT_TRACKED) {
      const tracking = await StockTrackingModel.findOne({
        product_id: params.product_id,
        warehouse_id: params.warehouse_id,
        lot_code: params.lot_code,
      });

      if (!tracking || tracking.quantity < params.quantity) {
        throw new AppError(
          ErrorCode.STOCK_NOT_AVAILABLE,
          "Not enough lot stock to revert",
        );
      }

      await StockTrackingModel.updateOne(
        { _id: tracking._id },
        { $inc: { quantity: -params.quantity } },
      );
    }

    if (params.tracking_type === ProductTrackingType.EXPIRABLE) {
      const tracking = await StockTrackingModel.findOne({
        product_id: params.product_id,
        warehouse_id: params.warehouse_id,
        expiration_date: params.expiration_date,
      });

      if (!tracking || tracking.quantity < params.quantity) {
        throw new AppError(
          ErrorCode.STOCK_NOT_AVAILABLE,
          "Not enough expirable stock to revert",
        );
      }

      await StockTrackingModel.updateOne(
        { _id: tracking._id },
        { $inc: { quantity: -params.quantity } },
      );
    }
  }
}
