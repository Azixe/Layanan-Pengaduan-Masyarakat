import express from "express"
import { createLaporan } from "../controller/laporanController.js";
import multer from "multer";

const laporanRouter = express.Router()

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

laporanRouter.post("/buatlaporan", upload.single("upload_foto"), createLaporan)

export default laporanRouter;