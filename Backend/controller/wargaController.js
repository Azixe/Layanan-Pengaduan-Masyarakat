import wargaModel from "../models/wargaModel.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import validator from "validator";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// transporter sederhana menggunakan akun Gmail (EMAIL_USER, EMAIL_PASS)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    // cek jika user ada
    const user = await wargaModel.findOne({ email });

    // jika user tidak ditemukan
    if (!user) {
      return res.json({ success: false, message: "Pengguna tidak ditemukan" });
    }

    // cek password user yang diinputkan dengan password di database
    const isMatch = await bcrypt.compare(password, user.password);

    // jika password tidak sesuai
    if (!isMatch) {
      return res.json({ success: false, message: "Password salah" });
    }

    // jika sesuai, buat token untuk pengguna
    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      warga: {
        _id: user._id,
        user_warga: user.user_warga,
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET);
};

//Register user
const registerUser = async (req, res) => {
  const { user_warga, email, password } = req.body;
  try {
    //cek jika user sudah ada
    const exist = await wargaModel.findOne({ email });
    if (exist) {
      return res.json({ success: false, message: "Pengguna sudah terdaftar" });
    }

    //validasi email format dan password kuat
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Format email salah" });
    }
    if (password.length < 8) {
      return res.json({ success: false, message: "Password minimal 8 huruf" });
    }

    //hashing password user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newWarga = new wargaModel({
      user_warga: user_warga,
      email: email,
      password: hashedPassword,
    });

    const warga = await newWarga.save();
    const token = createToken(warga._id);
    res.json({ success: true, message: "Pengguna sukses dibuat", token });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error" });
  }
};

// Mengambil profil warga yang sudah login
const getProfile = async (req, res) => {
  try {
    res.json({
      success: true,
      message: "Data profil berhasil diambil",
      data: req.user,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Terjadi kesalahan server" });
  }
};

const updateProfile = async (req, res) => {
  try {
    // Mendapatkan ID pengguna dari token yang sudah diverifikasi
    const userId = req.user._id;
    // Data yang akan diperbarui dari body request
    const { user_warga, alamat, no_hp } = req.body;

    // Validasi nama
    if (!user_warga || user_warga.trim().length < 3) {
      return res.json({
        success: false,
        message: "Nama minimal 3 karakter",
      });
    }

    // Validasi nomor HP jika diisi
    if (no_hp && !no_hp.match(/^(08|62)\d{8,12}$/)) {
      return res.json({
        success: false,
        message: "Format nomor telepon tidak valid",
      });
    }

    // Update data warga
    const updatedWarga = await wargaModel.findByIdAndUpdate(
      userId,
      {
        user_warga: user_warga.trim(),
        alamat: alamat ? alamat.trim() : "",
        no_hp: no_hp ? no_hp.trim() : "",
      },
      { new: true, select: "-password" } // Return updated doc without password
    );

    if (!updatedWarga) {
      return res.json({
        success: false,
        message: "Pengguna tidak ditemukan",
      });
    }

    res.json({
      success: true,
      message: "Profil berhasil diperbarui",
      data: updatedWarga,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

// ====== LUPA PASSWORD: KIRIM KODE KE EMAIL ======
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body; // <-- ambil dari body

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email wajib diisi." });
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("EMAIL_USER / EMAIL_PASS belum di-set");
      return res.status(500).json({
        success: false,
        message:
          "Konfigurasi email server belum lengkap. Silakan hubungi administrator.",
      });
    }

    const user = await wargaModel.findOne({ email });

    // Demi keamanan, jangan bocorkan apakah email terdaftar
    if (!user) {
      return res.json({
        success: true,
        message:
          "Jika email terdaftar, kode reset password telah dikirim ke email tersebut.",
      });
    }

    // generate kode 6 digit
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    user.resetPasswordCode = code;
    user.resetPasswordExpires = expires;
    await user.save();

    const mailOptions = {
      from: `"LaporDesa" <${process.env.EMAIL_USER}>`,
      to: email, // pakai variabel email yang sudah dideklarasikan
      subject: "Kode Reset Password LaporDesa",
      text: `Halo ${user.user_warga},

Kami menerima permintaan reset password untuk akun Anda di LaporDesa.

Kode verifikasi reset password Anda adalah: ${code}

Kode ini berlaku selama 10 menit. Jika Anda tidak merasa meminta reset password, abaikan email ini.

Salam,
Tim LaporDesa`,
    };

    await transporter.sendMail(mailOptions);

    return res.json({
      success: true,
      message:
        "Jika email terdaftar, kode reset password telah dikirim ke email tersebut.",
    });
  } catch (error) {
    console.error("Error forgotPassword:", error);
    return res.status(500).json({
      success: false,
      message:
        "Gagal mengirim email reset password. Silakan coba lagi beberapa saat.",
    });
  }
};

// ====== RESET PASSWORD: VERIFIKASI KODE & GANTI PASSWORD ======
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.json({
        success: false,
        message: "Email, kode, dan password baru wajib diisi",
      });
    }

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password baru minimal 8 karakter",
      });
    }

    const user = await wargaModel.findOne({
      email,
      resetPasswordCode: code,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Kode tidak valid atau sudah kedaluwarsa",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password berhasil direset. Silakan login kembali.",
    });
  } catch (error) {
    console.error("Error resetPassword:", error);
    return res.json({
      success: false,
      message: "Terjadi kesalahan server",
    });
  }
};

export {
  loginUser,
  registerUser,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
};
