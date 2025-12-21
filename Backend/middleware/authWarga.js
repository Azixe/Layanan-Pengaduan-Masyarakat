// middleware/authWarga.js
import jwt from "jsonwebtoken";
import Warga from "../models/wargaModel.js";

const authWarga = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak, silakan login (warga)",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await Warga.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    req.user = user; // gunakan req.user di controller warga
    next();
  } catch (error) {
    console.error("authWarga error:", error.message);
    return res.status(401).json({
      success: false,
      message: "Token tidak valid atau kadaluarsa (warga)",
    });
  }
};

export default authWarga;
