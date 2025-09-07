import express from "express";
import cors from "cors";
import WebTorrent from "webtorrent";

const app = express();
app.use(express.static("public"));
app.use(cors());
app.use(express.json());

// WebTorrent client with WebSocket trackers only (Render blocks UDP)
const client = new WebTorrent({
  tracker: {
    announce: [
      "wss://tracker.openwebtorrent.com",
      "wss://tracker.btorrent.xyz",
      "wss://tracker.fastcast.nz",
      "wss://tracker.files.fm:7073/announce"
    ]
  }
});

// Map to cache torrents (magnet -> torrent)
const torrentsMap = new Map();

/**
 * API: Get list of files in a torrent
 * Example: /api/files?magnet=magnet_uri
 */
app.get("/api/files", (req, res) => {
  const magnetUri = req.query.magnet;
  if (!magnetUri) return res.status(400).json({ error: "Magnet link required" });

  let torrent = torrentsMap.get(magnetUri);
  if (!torrent) {
    torrent = client.add(magnetUri, (t) => {
      const files = t.files.map((f, i) => ({
        index: i,
        name: f.name,
        length: f.length
      }));
      res.json({ files });
    });
    torrentsMap.set(magnetUri, torrent);
  } else {
    const files = torrent.files.map((f, i) => ({
      index: i,
      name: f.name,
      length: f.length
    }));
    res.json({ files });
  }
});

/**
 * API: Stream a specific file from torrent
 * Example: /api/stream?magnet=magnet_uri&index=0
 */
app.get("/api/stream", (req, res) => {
  const magnetUri = req.query.magnet;
  const fileIndex = parseInt(req.query.index || 0, 10);

  if (!magnetUri) return res.status(400).json({ error: "Magnet link required" });

  let torrent = torrentsMap.get(magnetUri);

  const streamFile = (torrent) => {
    if (!torrent.files[fileIndex]) {
      return res.status(404).json({ error: "File not found" });
    }
    const file = torrent.files[fileIndex];
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
          "Content-Type": "video/mp4"
        }
      : {
          "Content-Length": total,
          "Content-Type": "video/mp4"
        };

    res.writeHead(range ? 206 : 200, headers);

    file
      .createReadStream({ start, end })
      .on("error", (err) => console.error("Stream error:", err.message))
      .pipe(res)
      .on("error", (err) => console.error("Response stream error:", err.message));
  };

  if (torrent) {
    streamFile(torrent);
    return;
  }

  torrent = client.add(magnetUri, (t) => {
    streamFile(t);
  });

  torrentsMap.set(magnetUri, torrent);

  torrent.on("download", () => {
    console.log(
      `⬇️ Downloading ${torrent.infoHash} - ${(torrent.progress * 100).toFixed(2)}%`
    );
  });

  torrent.on("done", () => {
    console.log(`✅ Torrent complete: ${torrent.infoHash}`);
    setTimeout(() => {
      torrentsMap.delete(magnetUri);
      torrent.destroy();
      console.log(`♻️ Cleaned up torrent: ${torrent.infoHash}`);
    }, 10 * 60 * 1000); // cleanup after 10 min
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
