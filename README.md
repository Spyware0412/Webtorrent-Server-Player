🌐 WebTorrent Server/Player

A WebTorrent + WebRTC-based P2P Video Streaming App that works directly in the browser. This project allows users to stream torrents in real-time using peer-to-peer connections, without requiring centralized servers for video hosting.

✨ Features

⚡ WebTorrent + WebRTC for true peer-to-peer streaming.

🎥 In-browser Player – play torrent videos instantly.

🔗 Magnet Link Support – stream directly via magnet links.

📡 Server API – optional Node.js backend to manage torrents.

🔄 P2P File Sharing – distribute video without central servers.

📱 Responsive UI – works across desktop and mobile.

🛠️ Tech Stack

Frontend: React / Next.js (with WebTorrent client)

Backend (optional): Node.js + Express + WebTorrent (server mode)

P2P Protocols: WebRTC + WebTorrent

Player: HTML5 Video / Custom Player integration

🚀 Getting Started
1. Clone the repository
git clone https://github.com/your-username/webtorrent-player.git
cd webtorrent-player

2. Install dependencies
npm install
# or
yarn install

3. Run the development server
npm run dev

⚙️ Usage
Client (React/Next.js)

Enter a magnet link or torrent file.

The player will stream video chunks directly from peers.

Server (Optional)

You can also run a Node.js WebTorrent server to act as a hybrid peer:

node server.js


Example server snippet:

import express from "express";
import WebTorrent from "webtorrent";

const app = express();
const client = new WebTorrent();

app.get("/api/stream", (req, res) => {
  const magnetUri = req.query.magnet;
  client.add(magnetUri, (torrent) => {
    const file = torrent.files.find((f) => f.name.endsWith(".mp4"));
    res.setHeader("Content-Type", "video/mp4");
    file.createReadStream().pipe(res);
  });
});

app.listen(3001, () => console.log("Server running on port 3001"));

📂 Project Structure
webtorrent-player/
│── app/                # Next.js App Router (frontend player)
│── server.js           # Optional Node.js torrent server
│── components/         # React components (video player, input forms)
│── public/             # Static assets
│── styles/             # Tailwind / global styles
│── README.md           # Documentation

🔑 How It Works

User enters a magnet link or torrent file.

WebTorrent (via WebRTC) connects to peers.

Video chunks are downloaded progressively.

The HTML5 video player streams video instantly while downloading.

Optionally, a Node.js server can act as a seeder + relay peer.

📸 Demo

Add screenshots or GIFs of the player UI here.

🤝 Contributing

Pull requests are welcome! Feel free to fork and submit improvements.

📜 License

MIT License – free to use and modify.
