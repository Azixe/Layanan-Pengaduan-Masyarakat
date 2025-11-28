import 'dotenv/config';
import laporanModel from '../models/laporanModel.js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { uploadFiletoCloudinary } from '../services/driveServices.js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const generateNomorLaporan = async () => {
    const prefix = "LPR";
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${randomNum}`;
}

const createLaporan = async (req, res) => {
    try {
        const { warga_id, judul, deskripsi, kategori, lokasi } = req.body;

        let nomor_laporan = await generateNomorLaporan();

        let fileLinkGambar = "";

        if (req.file) {
            console.log("File diterima");
            fileLinkGambar = await uploadFiletoCloudinary(req.file);
            console.log("Upload sukses: ", fileLinkGambar);
        }

        let analisisAI = {
            sentimen: "Netral",
            keywords: []
        };

        try {
            const model = genAI.getGenerativeModel({model:"gemini-1.5-flash"});

            const prompt = 
            `Kamu adalah sistem AI untuk desa cerdas. Analisis laporan warga berikut:
            "${deskripsi}"

            tugasmu:
            1. Analisis sentimen: (Positif, Negatif, Netral).
            2. Ambil 3-5 keyword utama.

            Berikan jawaban dalam format JSON tanpa markdown seperti:
            {
                "sentimen": "...",
                "keywords": ["...", "..."]
            }
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            const cleanText = text.replace(/```json|```/g, '').trim();
            analisisAI = JSON.parse(cleanText);
        } catch (error) {
            console.error("Gagal koneksi ke AI, menggunakan nilai default: ", error);
        }

        const newLaporan = new laporanModel({
            warga_id: warga_id,
            nomor_laporan: nomor_laporan,
            judul: judul,
            deskripsi: deskripsi,
            lokasi: lokasi,
            kategori: kategori,
            gambar: fileLinkGambar,
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
        res.status(500).json({ message: error.message });
    }
};

export { createLaporan };