import { Router } from "express";
import {
  deleteWalkthrough,
  getWalkthrough,
  listWalkthroughs,
} from "../controller/walkthrough.controller";

const router = Router();

router.get("/", listWalkthroughs);
router.get("/:id", getWalkthrough);
router.delete("/:id", deleteWalkthrough);

export default router;
