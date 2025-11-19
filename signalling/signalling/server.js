const WebSocket = require('ws');

const PORT = process.env.PORT || 8765;

const wss = new WebSocket.Server({ port: PORT });

const rooms = new Map();

function generatePairingCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function log(message) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}

wss.on('connection', (ws) => {
    log('New client connected');
    
    let currentRoom = null;
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            handleMessage(ws, data);
        } catch (error) {
            log(`Error parsing message: ${error.message}`);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Invalid message format'
            }));
        }
    });
    
    ws.on('close', () => {
        log('Client disconnected');
        if (currentRoom) {
            const room = rooms.get(currentRoom);
            if (room) {
                room.clients = room.clients.filter(client => client !== ws);
                if (room.clients.length === 0) {
                    rooms.delete(currentRoom);
                    log(`Room ${currentRoom} deleted (empty)`);
                } else {
                    room.clients.forEach(client => {
                        if (client.readyState === WebSocket.OPEN) {
                            client.send(JSON.stringify({
                                type: 'peer_disconnected'
                            }));
                        }
                    });
                }
            }
        }
    });
    
    function handleMessage(ws, data) {
        const { type } = data;
        
        switch (type) {
            case 'create_room':
                handleCreateRoom(ws);
                break;
            
            case 'join_room':
                handleJoinRoom(ws, data.code);
                break;
            
            case 'offer':
                handleOffer(ws, data.sdp, data.code);
                break;
            
            case 'answer':
                handleAnswer(ws, data.sdp, data.code);
                break;
            
            case 'ice_candidate':
                handleIceCandidate(ws, data.candidate, data.code);
                break;
            
            default:
                log(`Unknown message type: ${type}`);
        }
    }
    
    function handleCreateRoom(ws) {
        const code = generatePairingCode();
        
        rooms.set(code, {
            offerer: ws,
            clients: [ws]
        });
        
        currentRoom = code;
        
        ws.send(JSON.stringify({
            type: 'pairing_code',
            code: code
        }));
        
        log(`Room created with code: ${code}`);
    }
    
    function handleJoinRoom(ws, code) {
        const room = rooms.get(code);
        
        if (!room) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Room not found'
            }));
            log(`Join failed: Room ${code} not found`);
            return;
        }
        
        if (room.clients.length >= 2) {
            ws.send(JSON.stringify({
                type: 'error',
                message: 'Room is full (maximum 2 participants)'
            }));
            log(`Join failed: Room ${code} is full`);
            return;
        }
        
        room.clients.push(ws);
        currentRoom = code;
        
        log(`Client joined room: ${code} (${room.clients.length}/2 participants)`);
        
        room.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'peer_joined'
                }));
            }
        });
    }
    
    function handleOffer(ws, sdp, code) {
        const room = rooms.get(code);
        
        if (!room) {
            log(`Offer failed: Room ${code} not found`);
            return;
        }
        
        log(`Forwarding offer for room: ${code}`);
        
        room.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'offer',
                    sdp: sdp
                }));
            }
        });
    }
    
    function handleAnswer(ws, sdp, code) {
        const room = rooms.get(code);
        
        if (!room) {
            log(`Answer failed: Room ${code} not found`);
            return;
        }
        
        log(`Forwarding answer for room: ${code}`);
        
        if (room.offerer && room.offerer.readyState === WebSocket.OPEN) {
            room.offerer.send(JSON.stringify({
                type: 'answer',
                sdp: sdp
            }));
        }
    }
    
    function handleIceCandidate(ws, candidate, code) {
        const room = rooms.get(code);
        
        if (!room) {
            log(`ICE candidate failed: Room ${code} not found`);
            return;
        }
        
        log(`Forwarding ICE candidate for room: ${code}`);
        
        room.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                    type: 'ice_candidate',
                    candidate: candidate
                }));
            }
        });
    }
});

log(`WebSocket signaling server started on port ${PORT}`);
log(`Waiting for connections...`);
