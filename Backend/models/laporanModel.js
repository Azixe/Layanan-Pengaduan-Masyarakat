import mongoose from "mongoose";

const laporanSchema = new mongoose.Schema(
  {
    warga_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "warga",
      required: true,
    },
    nomor_laporan: { type: String, required: true, unique: true },
    nama_warga: { type: String, required: true },
    judul: { type: String, required: true },
    deskripsi: { type: String, required: true },
    lokasi: { type: String },
    gambar: { type: String },
    status_laporan: {
      type: String,
      default: "Belum dikerjakan",
      enum: ["Belum dikerjakan", "Sedang dikerjakan", "Selesai"],
    },
    komentar: { type: String },
    kategori: { type: String },
    kategori_ai: { type: String },
    sentimen_ai: { type: String },
    keywords_ai: { type: [String] },
    createdAt: { type: Date, default: Date.now },
  },
  {
    minimize: false,
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

laporanSchema.virtual("tanggal_format").get(function () {
  return this.createdAt.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
});

const laporanModel =
  mongoose.models.laporan ||
  mongoose.model("laporan", laporanSchema, "laporan");

export default laporanModel;
