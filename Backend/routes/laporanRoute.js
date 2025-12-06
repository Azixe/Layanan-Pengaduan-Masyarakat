import express from "express"
import {
    createLaporan,
    getPublicLaporan,
    getPublicLaporanById,
    getAllLaporan,
    getLaporanById,
    updateStatusLaporan,
    getStatistics
} from "../controller/laporanController.js";
import multer from "multer";

const laporanRouter = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// User routes
laporanRouter.post("/buatlaporan", upload.single("upload_foto"), createLaporan)

// Public routes (for transparent public view)
laporanRouter.get("/public", getPublicLaporan)
laporanRouter.get("/public/:id", getPublicLaporanById)

// Admin routes
laporanRouter.get("/all", getAllLaporan)
laporanRouter.get("/statistics", getStatistics)
laporanRouter.get("/:id", getLaporanById)
laporanRouter.put("/:id/status", updateStatusLaporan)

export default laporanRouter;