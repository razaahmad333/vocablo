const express = require("express");
const WebSocket = require("ws");
const app = express();
const { v4: uuidv4 } = require("uuid");
const generateUniqueId = require("./utils/generateId");
const { getValidWordsFromBoard } = require("./utils/word");
const emitters = require("./socket/emitters");
const receivers = require("./socket/receivers");

app.use(express.static("public"));
app.use(express.json());

const { createUser, getUser } = require("./store/user");
const {
  createRoom,
  getRoom,
  addMemberToRoom,
  updateBoard,
  getRoomByUserId,
} = require("./store/room");

app.use((req, res, next) => {
  console.log(
    JSON.stringify({ method: req.method, path: req.path, body: req.body })
  );
  next();
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  const url = `http://localhost:${PORT}`;
  console.log(`Open ${url} in your browser`);
});

const wss = new WebSocket.Server({ server });

const usersInLobby = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", async (message) => {
    const data = JSON.parse(message);
    console.log("Received:", JSON.stringify(data));

    const { type } = data;

    receivers.mapReceivers(ws, type, data);
    
  });

  ws.on("close", async () => {
    console.log("Client disconnected");

    const connection = Array.from(usersInLobby).find(
      ([key, value]) => value === ws
    );

    if (!connection) {
      return;
    }

    const userId = connection[0];

    const room = await getRoomByUserId(userId);

    if (room) {
      room.members.forEach((member) => {
        const ws = usersInLobby.get(member);
        if (!ws) {
          return;
        }

        if (member === userId) {
          ws.send(
            JSON.stringify({
              type: "leftRoom",
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "memberLeft",
              member,
            })
          );
        }
        usersInLobby.delete(userId);
      });
    }
  });
});

app.post("/api/login", async (req, res) => {
  const name = req.body.name;

  const userId = uuidv4();

  try {
    await createUser({ name, userId });
    res.json({ name, userId });
  } catch (e) {
    console.log(e);
    res.status(500).send("Internal Server Error");
  }
});

app.post("/api/room/create", async (req, res) => {
  const { userId } = req.body;

  const room = {
    roomId: generateUniqueId({ length: 6 }),
    createdBy: userId,
    members: [userId],
    board: JSON.stringify([]),
    scores: JSON.stringify([]),
    usedWords: JSON.stringify([]),
  };

  await createRoom(room);

  res.json(room);
});

app.post("/api/room/join", async (req, res) => {
  const { roomId, name, userId } = req.body;

  const room = await getRoom(roomId);

  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  await addMemberToRoom(roomId, userId);

  const ws = usersInLobby.get(room.createdBy);

  emitters.emitMemberJoined(ws, { name, userId });

  res.json({ message: "Joined room" });
});

app.post("/api/room/startGame", (req, res) => {
  const { roomId, members } = req.body;

  members.forEach((member) => {
    const ws = usersInLobby.get(member.userId);
    emitters.emitGameStarted(ws, roomId);
  });

  res.json({ message: "Game started" });
});
