import express from "express"
import { getProfile, loginUser,registerUser } from "../controller/wargaController.js";
import { requireAuth } from "../middleware/auth.js";

const wargaRouter = express.Router()

wargaRouter.post("/login",loginUser)
wargaRouter.post("/register",registerUser)
wargaRouter.get("/profile",requireAuth, getProfile)

export default wargaRouter;