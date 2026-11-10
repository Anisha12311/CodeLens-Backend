import { Router } from "express";
import supabase from "../config/supabase";

const router = Router();

router.get("/", async (req, res) => {
  const { data, error } = await supabase.from("walkThroughs").select("*");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

export default router;
