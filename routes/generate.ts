import express, { Router } from "express";
import generate from "../controller/generate.controller";
import { checkInput } from "../middleware/checkInput";
import { checkCache } from "../middleware/checkCache";
import { generateLimit } from "../middleware/generateLimit";

const router = Router();

router.post("/", checkInput, checkCache, generateLimit, generate);

export default router;
