const express = require("express");
const WebSocket = require("ws");
const app = express();
const { v4: uuidv4 } = require("uuid");
const generateUniqueId = require("./utils/generateId");

app.use(express.static("public"));
app.use(express.json());

const {createUser, getUser} = require("./store/user");
const {createRoom, getRoom, addMemberToRoom} = require("./store/room");

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

const rooms = new Map();

const usersInLobby = new Map();

wss.on("connection", (ws) => {
  console.log("New client connected");

  ws.on("message", async(message) => {
    const data = JSON.parse(message);
    const { type } = data;
    if (type === "joinedLobby") {
      const { userId } = data;
      usersInLobby.set(userId, ws);
    }

    if (type === "joinedGame") {
      const { roomId, userId } = data;
      // const room = rooms.get(roomId);
      // const ws = usersInLobby.get(room.createdBy);

      const room = await getRoom(roomId, true);

      ws.send(
        JSON.stringify({
          type: "memberDetails",
          members: room.members,
        })
      );
    }

    console.log("Received:", data);
  });

  ws.on("close", () => {
    console.log("Client disconnected");

    usersInLobby.forEach((value, key) => {
      if (value === ws) {
        usersInLobby.delete(key);
      }
    });
  });
});

const users = new Map();

app.post("/api/login", async (req, res) => {
  const name = req.body.name;

  const userId = uuidv4();

  await createUser({name, userId});

  res.json({ name, userId });
});

app.post("/api/room/create", async(req, res) => {
  const { userId } = req.body;

  const room = {
    roomId: generateUniqueId({ length: 6 }),
    createdBy: userId,
    members: [userId],
  };

  await createRoom(room);

  res.json(room);
});

app.post("/api/room/join", async(req, res) => {
  const { roomId, name, userId } = req.body;

  const room = await getRoom(roomId);


  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  await addMemberToRoom(roomId, userId);

  const ws = usersInLobby.get(room.createdBy);

  ws.send(
    JSON.stringify({
      type: "memberJoined",
      member: {
        name,
        userId,
      },
    })
  );

  res.json({ message: "Joined room" });
});

app.post("/api/room/startGame", (req, res) => {
  const { roomId, members } = req.body;

  members.forEach((member) => {
    const ws = usersInLobby.get(member.userId);
    ws.send(
      JSON.stringify({
        type: "gameStarted",
        roomId,
      })
    );
  });

  res.json({ message: "Game started" });
});
