import { Router } from "express";
import userRouter from "./user";
import generateRouter from "./generate";
import walkthroughsRouter from "./walkthroughs";
const router = Router();

router.use("/users", userRouter);
router.use("/generate", generateRouter);
router.use("/walkthroughs", walkthroughsRouter);

export default router;
