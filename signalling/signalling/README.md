# MinimalPeer Signaling Server

This is the WebSocket signaling server for MinimalPeer screen sharing application.

## Features

- Generates unique 6-digit pairing codes
- Manages peer-to-peer room connections
- Forwards WebRTC SDP offers and answers
- Forwards ICE candidates between peers
- No media streaming (only signaling)
- Automatic room cleanup when empty

## Installation

```bash
npm install
```

## Running Locally

```bash
npm start
```

The server will start on port 8765 by default.

## Environment Variables

- `PORT`: The port to run the server on (default: 8765)

## Deployment

### Deploy to Railway

1. Create account at [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Railway will auto-detect Node.js and deploy
5. Get your public URL from the deployment

### Deploy to Render

1. Create account at [Render.com](https://render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Deploy and get your public URL

### Deploy to Glitch

1. Go to [Glitch.com](https://glitch.com)
2. Click "New Project" → "Import from GitHub"
3. Paste repository URL
4. Glitch will auto-deploy
5. Your app URL will be `https://your-project-name.glitch.me`

### Deploy to Heroku

```bash
heroku login
heroku create your-app-name
git push heroku main
```

## Message Protocol

### Client → Server

**Create Room:**
```json
{
  "type": "create_room"
}
```

**Join Room:**
```json
{
  "type": "join_room",
  "code": "123456"
}
```

**Send Offer:**
```json
{
  "type": "offer",
  "sdp": "...",
  "code": "123456"
}
```

**Send Answer:**
```json
{
  "type": "answer",
  "sdp": "...",
  "code": "123456"
}
```

**Send ICE Candidate:**
```json
{
  "type": "ice_candidate",
  "candidate": {...},
  "code": "123456"
}
```

### Server → Client

**Pairing Code:**
```json
{
  "type": "pairing_code",
  "code": "123456"
}
```

**Offer:**
```json
{
  "type": "offer",
  "sdp": "..."
}
```

**Answer:**
```json
{
  "type": "answer",
  "sdp": "..."
}
```

**ICE Candidate:**
```json
{
  "type": "ice_candidate",
  "candidate": {...}
}
```

**Error:**
```json
{
  "type": "error",
  "message": "Error description"
}
```

## Security Notes

- This server only handles signaling (SDP and ICE exchange)
- No media data passes through this server
- WebRTC connections are peer-to-peer with DTLS/SRTP encryption
- Rooms are automatically cleaned up when empty
- No data persistence or logging of sensitive information
