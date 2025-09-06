import express from "express";
import cors from "cors";
import WebTorrent from "webtorrent";

const app = express();
app.use(cors());
app.use(express.json());

const client = new WebTorrent();
const torrentsMap = new Map(); // magnet URI -> torrent instance

// API endpoint: /api/stream?magnet=magnet_link
app.get("/api/stream", (req, res) => {
  const magnetUri = req.query.magnet;
  if (!magnetUri) return res.status(400).json({ error: "Magnet link required" });
  
  let torrent = torrentsMap.get(magnetUri);

  const streamVideo = (torrent) => {
    const file = torrent.files.find(f => f.name.endsWith(".mp4") || f.name.endsWith(".mkv"));
    if (!file) return res.status(404).json({ error: "No video file found in torrent" });

    const total = file.length;
    const range = req.headers.range;
    let start = 0;
    let end = total - 1;

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      start = parseInt(parts[0], 10);
      end = parts[1] ? parseInt(parts[1], 10) : end;
    }

    const chunkSize = end - start + 1;
    const headers = range
      ? {
          "Content-Range": `bytes ${start}-${end}/${total}`,
          "Accept-Ranges": "bytes",
          "Content-Length": chunkSize,
          "Content-Type": "video/mp4",
        }
      : {
          "Content-Length": total,
          "Content-Type": "video/mp4",
        };

    res.writeHead(range ? 206 : 200, headers);

    file.createReadStream({ start, end })
      .on("error", (err) => {
        if (!err.message.includes("closed prematurely")) console.error("Stream error:", err);
      })
      .pipe(res)
      .on("error", (err) => {
        if (!err.message.includes("closed prematurely")) console.error("Response stream error:", err);
      });
  };

  if (torrent) {
    // Stream existing torrent
    streamVideo(torrent);
    return;
  }

  // Add new torrent and stream
  torrent = client.add(magnetUri, (t) => {
    streamVideo(t);
  });

  torrentsMap.set(magnetUri, torrent);

  torrent.on("download", () => {
    console.log(`Progress: ${(torrent.progress * 100).toFixed(2)}%`);
  });

  torrent.on("done", () => {
    console.log(`✅ Torrent download complete: ${torrent.infoHash}`);
    // Optionally remove from map after download
    // torrentsMap.delete(magnetUri);
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
