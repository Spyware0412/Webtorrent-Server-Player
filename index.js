import express from "express";
import cors from "cors";
import WebTorrent from "webtorrent";

const app = express();
// app.use(express.static("public"));
app.use(cors());
app.use(express.json());

const client = new WebTorrent();

app.get("/stream", (req, res) => {
  const magnetUri = req.query.magnet;
  if (!magnetUri) {
    return res.status(400).send("Magnet link required");
  }

  client.add(magnetUri, (torrent) => {
    const file = torrent.files.find(f =>
      f.name.endsWith(".mp4") || f.name.endsWith(".mkv")
    );
    if (!file) {
      return res.status(404).send("No video file found in torrent");
    }

    const total = file.length;
    const range = req.headers.range;

    if (!range) {
      // No range header → send entire file
      res.writeHead(200, {
        "Content-Length": total,
        "Content-Type": "video/mp4",
      });
      file.createReadStream().pipe(res);
      return;
    }

    // Parse Range header (e.g. "bytes=0-1023")
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : total - 1;

    const chunkSize = end - start + 1;
    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${total}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    });

    file.createReadStream({ start, end }).pipe(res);

    torrent.on("download", () => {
      console.log(`Progress: ${(torrent.progress * 100).toFixed(2)}%`);
    });

    torrent.on("done", () => {
      console.log("✅ Torrent download complete!");
    });
  });
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
