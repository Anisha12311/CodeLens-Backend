import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import apiRouter from "./routes";

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Render (and most hosts) sit behind one proxy; trust it so the rate limit sees each visitor's real IP.
app.set("trust proxy", 1);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use("/api", apiRouter);

app.get("/", (req, res) => {
  console.log("REquest");
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`Server is running ${PORT} --- `);
});
