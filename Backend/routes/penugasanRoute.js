import express from "express";
import { assignLaporan } from "../controller/laporanController.js";

const router = express.Router();

// Endpoint untuk menugaskan laporan ke petugas
router.post("/", assignLaporan);

export default router;
