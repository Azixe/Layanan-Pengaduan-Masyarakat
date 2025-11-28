import { v2 as cloudinary } from 'cloudinary';
import stream from 'stream';
import 'dotenv/config';

// Konfigurasi
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const uploadFiletoCloudinary = (fileObject) => {
    return new Promise((resolve, reject) => {
        // Buat stream upload
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "laporan_desa", // Nama folder di Cloudinary (otomatis dibuat)
                resource_type: "auto"   // Bisa gambar atau pdf
            },
            (error, result) => {
                if (error) {
                    console.error("Cloudinary Error:", error);
                    reject(error);
                } else {
                    // Berhasil, kembalikan URL gambar yang aman (https)
                    resolve(result.secure_url);
                }
            }
        );

        // Ubah buffer file menjadi stream agar bisa diupload
        const bufferStream = new stream.PassThrough();
        bufferStream.end(fileObject.buffer);
        bufferStream.pipe(uploadStream);
    });
};

export { uploadFiletoCloudinary };