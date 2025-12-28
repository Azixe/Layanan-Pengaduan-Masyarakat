import "dotenv/config";
import laporanModel from "../models/laporanModel.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadFiletoCloudinary } from "../services/driveServices.js";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateNomorLaporan = async () => {
  const prefix = "LPR";
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${randomNum}`;
};

const createLaporan = async (req, res) => {
  try {
    console.log("Body diterima:", req.body);

    // Pastikan nama field di sini sama dengan frontend
    const { warga_id, judul, deskripsi, kategori, lokasi, nama_warga } =
      req.body;

    console.log("--- DEBUG START ---");
    // membaca API key dari file environment
    const key = process.env.GOOGLE_API_KEY || "KOSONG";
    console.log("API Key terbaca:", key.substring(0, 5) + "...");
    console.log("Model yang dipanggil: gemini-2.5-flash");
    console.log("--- DEBUG END ---");

    if (!deskripsi) {
      console.warn(
        "Peringatan: Deskripsi kosong, AI mungkin tidak bekerja maksimal."
      );
    }

    // Generate nomor laporan
    let nomor_laporan = await generateNomorLaporan();
    let fileLinkGambar = "";

    // Upload gambar
    if (req.file) {
      console.log("File diterima, mulai upload Cloudinary...");
      try {
        fileLinkGambar = await uploadFiletoCloudinary(req.file);
        console.log("Upload sukses:", fileLinkGambar);
      } catch (uploadError) {
        console.error("Gagal upload gambar:", uploadError);
      }
    }

    // AI Default
    let analisisAI = {
      kategori: "Lainnya",
      sentimen: "Netral",
      keywords: [],
    };

    // Proses AI
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const prompt = `
            Analisis laporan warga berikut: "${deskripsi}"
            Tugas:
            1. Tentukan kategori (Pilih satu: Infrastruktur, Sosial, Pelayanan, Keamanan, Kesehatan, Lingkungan).
            2. Analisis sentimen (Positif, Negatif, Netral).
            3. Ambil 3–5 keyword utama.
            Output JSON schema:
            {
                "kategori": "String",
                "sentimen": "String",
                "keywords": ["String"]
            }`;

      console.log("Mengirim request ke AI...");
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      console.log("Respon Mentah AI:", text);

      analisisAI = JSON.parse(text);
      console.log("Hasil AI Parsed:", analisisAI);
    } catch (error) {
      console.error("ERROR AI:", error.message);
    }

    // Simpan ke Database
    const newLaporan = new laporanModel({
      warga_id,
      nomor_laporan,
      judul: judul || "Laporan Warga",
      deskripsi,
      lokasi,
      gambar: fileLinkGambar,

      // Pengguna memilih jenis laporan
      kategori,
      nama_warga,
      // Hasil dari AI
      kategori_ai: analisisAI.kategori,
      sentimen_ai: analisisAI.sentimen,
      keywords_ai: analisisAI.keywords,

      status_laporan: "Belum dikerjakan",
    });

    await newLaporan.save();

    res.status(201).json({
      message: "Laporan berhasil dibuat",
      data: newLaporan,
    });
  } catch (error) {
    console.error("Critical Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET PUBLIC LAPORAN
const getPublicLaporan = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      kategori,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};

    if (status) query.status_laporan = status;
    if (kategori) query.kategori = kategori;

    if (search) {
      query.$or = [
        { judul: { $regex: search, $options: "i" } },
        { deskripsi: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "desc" ? -1 : 1;

    const laporan = await laporanModel
      .find(query)
      .populate("warga_id", "user_warga")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await laporanModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: laporan,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getPublicLaporan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET PUBLIC LAPORAN BY ID
const getPublicLaporanById = async (req, res) => {
  try {
    const laporan = await laporanModel
      .findById(req.params.id)
      .populate("warga_id", "user_warga");

    if (!laporan) {
      return res
        .status(404)
        .json({ success: false, message: "Laporan tidak ditemukan" });
    }

    res.status(200).json({ success: true, data: laporan });
  } catch (error) {
    console.error("Error in getPublicLaporanById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET ALL LAPORAN (ADMIN)
const getAllLaporan = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      kategori,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const query = {};

    if (status) query.status_laporan = status;
    if (kategori) query.kategori = kategori;

    if (search) {
      query.$or = [
        { judul: { $regex: search, $options: "i" } },
        { deskripsi: { $regex: search, $options: "i" } },
        { nomor_laporan: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === "desc" ? -1 : 1;

    const laporan = await laporanModel
      .find(query)
      .populate("warga_id", "user_warga email no_hp alamat")
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await laporanModel.countDocuments(query);

    res.status(200).json({
      success: true,
      data: laporan,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error in getAllLaporan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET LAPORAN BY ID (ADMIN)
const getLaporanById = async (req, res) => {
  try {
    const laporan = await laporanModel
      .findById(req.params.id)
      .populate("warga_id", "user_warga email no_hp alamat");

    if (!laporan) {
      return res
        .status(404)
        .json({ success: false, message: "Laporan tidak ditemukan" });
    }

    res.status(200).json({ success: true, data: laporan });
  } catch (error) {
    console.error("Error in getLaporanById:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE STATUS LAPORAN
const updateStatusLaporan = async (req, res) => {
  try {
    const { status_laporan, komentar } = req.body;

    if (
      !["Belum dikerjakan", "Sedang dikerjakan", "Selesai"].includes(
        status_laporan
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Status tidak valid. Gunakan: Belum dikerjakan, Sedang dikerjakan, atau Selesai",
      });
    }

    const updateData = { status_laporan };
    if (komentar) updateData.komentar = komentar;

    const laporan = await laporanModel
      .findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate("warga_id", "user_warga email");

    if (!laporan) {
      return res
        .status(404)
        .json({ success: false, message: "Laporan tidak ditemukan" });
    }

    res.status(200).json({
      success: true,
      message: "Status berhasil diperbarui",
      data: laporan,
    });
  } catch (error) {
    console.error("Error in updateStatusLaporan:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET STATISTICS
const getStatistics = async (req, res) => {
  try {
    const total = await laporanModel.countDocuments();
    const pending = await laporanModel.countDocuments({
      status_laporan: "Belum dikerjakan",
    });
    const inProgress = await laporanModel.countDocuments({
      status_laporan: "Sedang dikerjakan",
    });
    const completed = await laporanModel.countDocuments({
      status_laporan: "Selesai",
    });

    res.status(200).json({
      success: true,
      data: {
        total,
        byStatus: {
          pending,
          inProgress,
          completed,
        },
      },
    });
  } catch (error) {
    console.error("Error in getStatistics:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  createLaporan,
  getPublicLaporan,
  getPublicLaporanById,
  getAllLaporan,
  getLaporanById,
  updateStatusLaporan,
  getStatistics,
};
