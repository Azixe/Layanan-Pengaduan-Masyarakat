import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import wargaRouter from "./routes/wargaRoute.js"
import 'dotenv/config'
import { fileURLToPath } from 'url';
import path from 'path';

// app config
const app = express()
const port = process.env.PORT || 3000

// Middleware
app.use(express.json())
app.use(cors())
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, '../Frontend')));

// db connection
connectDB();

//API endpoint
app.use("/api/warga",wargaRouter)

app.get("/", (req,res) => {
    res.sendFile(path.join(__dirname, '../Frontend/index.html'));
})

app.listen(port, () => {
    console.log(`Server Started on http://localhost:${port}`)
})
