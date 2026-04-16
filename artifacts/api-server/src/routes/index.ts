import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkRouter from "./check";
import reportRouter from "./report";
import adminRouter from "./admin";
import authRouter from "./auth";
import feedbackRouter from "./feedback";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(checkRouter);
router.use(reportRouter);
router.use(adminRouter);
router.use(feedbackRouter);
router.use(statsRouter);

export default router;
