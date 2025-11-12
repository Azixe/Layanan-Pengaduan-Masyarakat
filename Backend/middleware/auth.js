import jwt from "jsonwebtoken"
import wargaModel from "../models/wargaModel.js";

const authMiddleware = async (req,res,next) => {
    const {token} = req.headers;
    if (!token) {
        return res.json({success:false,message:"Not authorized login again"})
    }
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET)
        req.body.userId = token_decode.id;
        next();
    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error"})
    }
}

const requireAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, message: "Akses ditolak, mohon login terlebih dahulu" });
        }

        const token = authHeader.split(" ")[1];

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        req.user = await wargaModel.findById(decodedToken.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ success:false, message: "Akses ditolak, pengguna tidak ditemukan" });
        }

        next();
    } catch (error) {
        console.error("Auth Error", error.message);
        res.status(401).json({ success:false, message: "Token tidak valid atau kadaluarsa" });
    }
}

export { authMiddleware, requireAuth } ;