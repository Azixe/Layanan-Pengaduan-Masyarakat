import express from "express"
import { getProfile, loginUser, registerUser, updateProfile } from "../controller/wargaController.js";
import { requireAuth } from "../middleware/auth.js";

const wargaRouter = express.Router()

wargaRouter.post("/login", loginUser)
wargaRouter.post("/register", registerUser)
// Mengambil profil warga yang sudah login
wargaRouter.get("/profile", requireAuth, getProfile)
// Memperbarui profil akun warga
wargaRouter.put("/profile", requireAuth, updateProfile)

export default wargaRouter;