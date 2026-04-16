import { Router, type IRouter } from "express";
import healthRouter from "./health";
import checkRouter from "./check";
import reportRouter from "./report";
import adminRouter from "./admin";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(checkRouter);
router.use(reportRouter);
router.use(adminRouter);

export default router;
