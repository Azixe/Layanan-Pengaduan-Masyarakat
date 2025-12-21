// controller/adminController.js
import Admin from "../models/adminModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      success: true,
      message: "Login berhasil",
      token,
      admin: {
        id: admin._id,
        name: admin.name || admin.user,
        email: admin.email || null,
        role: admin.role || "administrator",
      },
    });
  } catch (err) {
    console.error("admin login error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { login };
