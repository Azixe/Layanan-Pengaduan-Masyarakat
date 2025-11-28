import 'dotenv/config';
import laporanModel from '../models/laporanModel.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
// Pastikan path import ini benar sesuai struktur foldermu
import { uploadFiletoCloudinary } from '../services/driveServices.js'; 

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateNomorLaporan = async () => {
    const prefix = "LPR";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
}

const createLaporan = async (req, res) => {
    try {
        // 1. CEK INPUT DARI FRONTEND
        console.log("Body diterima:", req.body);
        
        // Pastikan nama field di sini SAMA PERSIS dengan formData.append di Frontend
        const { warga_id, judul, deskripsi, kategori, lokasi } = req.body;
        
        // Validasi Sederhana
        if (!deskripsi) {
             console.warn("Peringatan: Deskripsi kosong, AI mungkin tidak bekerja maksimal.");
        }

        let nomor_laporan = await generateNomorLaporan();
        let fileLinkGambar = "";

        // 2. PROSES UPLOAD GAMBAR
        if (req.file) {
            console.log("File diterima, mulai upload Cloudinary...");
            try {
                fileLinkGambar = await uploadFiletoCloudinary(req.file);
                console.log("Upload sukses: ", fileLinkGambar);
            } catch (uploadError) {
                console.error("Gagal upload gambar:", uploadError);
                // Kita lanjut saja biar laporan tetap terbuat meski gambar gagal
            }
        }

        // 3. PROSES AI (DIPERBAIKI)
        let analisisAI = {
            kategori: "Lainnya", // Berikan nilai default
            sentimen: "Netral",
            keywords: []
        };

        try {
            // --- FITUR JSON MODE ---
            // Kita paksa Gemini agar output-nya PASTI JSON valid
            const model = genAI.getGenerativeModel({ model: "gemini-pro"});

            const prompt = `
            Analisis laporan warga berikut: "${deskripsi}"
            
            Tugas:
            1. Tentukan kategori (Pilih satu: Infrastruktur, Sosial, Pelayanan, Keamanan, Kesehatan, Lingkungan).
            2. Analisis sentimen (Positif, Negatif, Netral).
            3. Ambil 3-5 keyword utama.
            
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
            
            console.log("Respon Mentah AI:", text); // Cek ini di terminal

            // Karena sudah JSON Mode, langsung parse saja
            analisisAI = JSON.parse(text); 
            console.log("Hasil AI Parsed:", analisisAI);

        } catch (error) {
            console.error("ERROR AI:", error.message);
            // Jika error, data akan tetap tersimpan dengan nilai default analisisAI di atas
        }

        // 4. SIMPAN KE DATABASE
        const newLaporan = new laporanModel({
            // Pastikan field ini ada di req.body frontend, atau gunakan id dari token login
            warga_id: warga_id, 
            
            nomor_laporan: nomor_laporan,
            judul: judul || "Laporan Warga", // Default jika judul kosong
            deskripsi: deskripsi,
            lokasi: lokasi,
            gambar: fileLinkGambar,
            
            // Simpan Kategori (Bisa dari User atau dari AI)
            // Prioritas: Kalau user pilih kategori, pakai itu. Kalau tidak, pakai AI.
            kategori: kategori, 
            
            // Field Khusus AI
            kategori_ai: analisisAI.kategori,
            sentimen_ai: analisisAI.sentimen,
            keywords_ai: analisisAI.keywords,

            status_laporan: "pending"
        });

        await newLaporan.save();

        res.status(201).json({
            message: "Laporan berhasil dibuat",
            data: newLaporan
        });

    } catch (error) {
        console.error("Critical Error:", error);
        res.status(500).json({ message: error.message });
    }
};

export { createLaporan };