// tes_manual.js
const API_KEY = "AIzaSyCLxE8rPKFDQ0Ssryobda1b2UbJTUF1hGE"; // <--- TEMPEL API KEY DISINI

async function tesLangsung() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
  
  const data = {
    contents: [{
      parts: [{ text: "Halo, apa kabar?" }]
    }]
  };

  try {
    console.log("Sedang menghubungi Google (Tanpa Library)...");
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      console.log("✅ SUKSES! API Key Valid & Model Ditemukan.");
      console.log("Jawaban AI:", result.candidates[0].content.parts[0].text);
    } else {
      console.log("❌ GAGAL (Response Error):");
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.log("❌ GAGAL (Koneksi):", error.message);
  }
}

tesLangsung();