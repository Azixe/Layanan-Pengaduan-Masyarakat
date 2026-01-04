// routes/wargaRoute.js
import express from "express";
import {
  getProfile,
  loginUser,
  registerUser,
  updateProfile,
  forgotPassword,
  resetPassword,
} from "../controller/wargaController.js";
import authWarga from "../middleware/authWarga.js";

const router = express.Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", authWarga, getProfile);
router.put("/profile", authWarga, updateProfile);

export default router;
