import mongoose from "mongoose";

const laporanSchema = new mongoose.Schema({
    warga_id:{type:mongoose.Schema.Types.ObjectId,
        ref:"warga",
        required:true
    },
    nomor_laporan:{type:String,
        required:true,
        unique:true
    },
    judul:{type:String,required:true},
    deskripsi:{type:String,required:true},
    lokasi:{type:String},
    gambar:{type:String},
    status_laporan:{type:String,
        default:"pending",
        enum:["pending","in progress","completed"]
    },
    komentar:{type:String},
    kategori:{type:String},
    sentimen_ai:{type:String},
    keywords_ai:{type:[String]},
    createdAt:{type:Date,default:Date.now}
},{minimize:false})

const laporanModel = mongoose.models.laporan || mongoose.model("laporan", laporanSchema, "laporan");

export default laporanModel;