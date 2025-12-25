import { SaleModel } from "../sales/sale.model";
import { DocumentStatus } from "../../common/enums/document-status.enum";
import mongoose from "mongoose";

export class DashboardService {
  static async getSalesSummary(params: {
    from?: Date;
    to?: Date;
    warehouse_id?: string;
  }) {
    const match: any = {
      status: DocumentStatus.CONFIRMED,
    };

    if (params.from || params.to) {
      match.sale_date = {};
      if (params.from) match.sale_date.$gte = params.from;
      if (params.to) match.sale_date.$lte = params.to;
    }

    if (params.warehouse_id) {
      match.warehouse_id = new mongoose.Types.ObjectId(params.warehouse_id);
    }

    const result = await SaleModel.aggregate([
      { $match: match },

      { $unwind: "$lines" },

      {
        $group: {
          _id: null,
          total_amount: {
            $sum: {
              $multiply: ["$lines.quantity", "$lines.unit_price"],
            },
          },
          sales_count: { $addToSet: "$_id" },
        },
      },

      {
        $project: {
          _id: 0,
          total_amount: 1,
          sales_count: { $size: "$sales_count" },
          average_sale_value: {
            $cond: [
              { $gt: [{ $size: "$sales_count" }, 0] },
              { $divide: ["$total_amount", { $size: "$sales_count" }] },
              0,
            ],
          },
        },
      },
    ]);

    return (
      result[0] || {
        total_amount: 0,
        sales_count: 0,
        average_sale_value: 0,
      }
    );
  }
}
