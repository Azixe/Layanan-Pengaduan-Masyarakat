// routes/adminRoute.js
import express from "express";
import { login } from "../controller/adminController.js";
import authAdmin from "../middleware/authAdmin.js";

const router = express.Router();

router.post("/login", login);

// contoh route yang butuh proteksi admin
router.get("/dashboard", authAdmin, (req, res) => {
  res.json({ success: true, message: "Welcome admin", admin: req.admin });
});

export default router;
