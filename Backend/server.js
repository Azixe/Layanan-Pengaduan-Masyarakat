// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";
import wargaRouter from "./routes/wargaRoute.js";
import laporanRouter from "./routes/laporanRoute.js";
import adminRouter from "./routes/adminRoute.js";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/", express.static(path.join(__dirname, "../Frontend")));
app.use("/admin", express.static(path.join(__dirname, "../admin")));

connectDB();

app.use("/api/warga", wargaRouter);
app.use("/api/laporan", laporanRouter);
app.use("/api/admin", adminRouter);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin/index.html"));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route tidak ditemukan",
  });
});

app.listen(port, () => {
  console.log(`User  : http://localhost:${port}`);
  console.log(`Admin : http://localhost:${port}/admin`);
});
