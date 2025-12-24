import { Router } from "express";
import { DashboardService } from "./dashboard.service";

const router = Router();

router.get("/sales-summary", async (req, res) => {
  const data = await DashboardService.getSalesSummary({
    from: req.query.from ? new Date(req.query.from as string) : undefined,
    to: req.query.to ? new Date(req.query.to as string) : undefined,
    warehouse_id: req.query.warehouse_id as string
  });

  res.json(data);
});

export default router;
