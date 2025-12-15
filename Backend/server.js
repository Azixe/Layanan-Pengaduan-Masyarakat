import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import wargaRouter from "./routes/wargaRoute.js";
import laporanRouter from "./routes/laporanRoute.js";
import "dotenv/config";
import { fileURLToPath } from "url";
import path from "path";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// frontend
app.use(express.static(path.join(__dirname, "../Frontend")));

// admin
app.use("/admin", express.static(path.join(__dirname, "../admin")));

connectDB();

// API
app.use("/api/warga", wargaRouter);
app.use("/api/laporan", laporanRouter);

// root user
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

// root admin
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "../admin/index.html"));
});

app.listen(port, () => {
  console.log(`User  : http://localhost:${port}`);
  console.log(`Admin : http://localhost:${port}/admin`);
});
