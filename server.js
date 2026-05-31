const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const INVITE_CODE = process.env.INVITE_CODE || "PULSE-ACCESS";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : ["*"];
const DB_FILE = path.join(__dirname, "db.json");
const FRONTEND_DIR = path.join(__dirname, "..");

const corsOrigin = ALLOWED_ORIGINS.includes("*")
  ? true
  : (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy: origin not allowed"));
      }
    };

const io = socketIo(server, {
  cors: {
    origin: ALLOWED_ORIGINS.includes("*") ? true : ALLOWED_ORIGINS,
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "8mb" }));

const ago = (minutes) => Date.now() - minutes * 60 * 1000;

function defaultDB() {
  return {
    version: 3,
    theme: "light",
    users: [
      {
        id: "me",
        name: "Ярослав",
        handle: "yaroslav",
        password: "demo123",
        role: "Creator",
        location: "Kyiv",
        bio: "Створюю свою першу круту соцмережу без бекенду.",
        skills: ["Python", "HTML", "JS"],
        privateMode: false,
        lastSeenAt: Date.now(),
        joinedAt: ago(9000),
      },
      {
        id: "lina",
        name: "Ліна Кодер",
        handle: "lina.dev",
        password: "demo123",
        role: "Frontend engineer",
        location: "Lviv",
        bio: "Люблю чисті інтерфейси, дизайн системи і швидкі прототипи.",
        skills: ["Frontend", "UI", "CSS"],
        privateMode: false,
        lastSeenAt: ago(5),
        joinedAt: ago(19000),
      },
      {
        id: "max",
        name: "Макс Стартап",
        handle: "maxflow",
        password: "demo123",
        role: "Product builder",
        location: "Warsaw",
        bio: "Запускаю маленькі продукти, міряю попит і не закохуюсь у зайве.",
        skills: ["Product", "MVP", "Growth"],
        privateMode: false,
        lastSeenAt: ago(15),
        joinedAt: ago(24000),
      },
      {
        id: "ira",
        name: "Іра Motion",
        handle: "irart",
        password: "demo123",
        role: "Visual designer",
        location: "Odesa",
        bio: "Анімація, фото, події, плакати і візуальні експерименти.",
        skills: ["Motion", "Photo", "Brand"],
        privateMode: false,
        lastSeenAt: ago(30),
        joinedAt: ago(17000),
      },
      {
        id: "den",
        name: "Ден Дані",
        handle: "dataden",
        password: "demo123",
        role: "Data analyst",
        location: "Dnipro",
        bio: "Перетворюю сирі дані на графіки, які реально читають.",
        skills: ["Data", "Charts", "SQL"],
        privateMode: true,
        lastSeenAt: ago(60),
        joinedAt: ago(12000),
      },
      {
        id: "nazar",
        name: "Назар Sound",
        handle: "nazar.wave",
        password: "demo123",
        role: "Audio maker",
        location: "Ivano-Frankivsk",
        bio: "Пишу музику для роликів, ігор і невеликих брендів.",
        skills: ["Audio", "Music", "Games"],
        privateMode: false,
        lastSeenAt: ago(90),
        joinedAt: ago(15000),
      },
    ],
    following: {
      me: ["lina", "max"],
      lina: ["me", "ira", "den"],
      max: ["me", "lina", "den"],
      ira: ["lina", "nazar"],
      den: ["max"],
      nazar: ["ira"],
    },
    posts: [
      {
        id: "p1",
        authorId: "lina",
        text: "Запустила новий дизайн профілю. Тепер картки чистіші, а кнопки не стрибають на мобільних.",
        tags: ["#design", "#frontend"],
        mood: "progress",
        likes: ["me", "max", "ira"],
        comments: [
          { id: "c1", authorId: "me", text: "Виглядає солідно.", createdAt: ago(130) },
          { id: "c2", authorId: "max", text: "Треба ще темну тему.", createdAt: ago(118) },
        ],
        createdAt: ago(42),
      },
      {
        id: "p2",
        authorId: "max",
        text: "Ідея дня: соцмережа для маленьких команд, де кожен пост прив'язаний до конкретного прогресу.",
        tags: ["#startup", "#product"],
        mood: "idea",
        likes: ["lina", "den"],
        comments: [
          { id: "c3", authorId: "lina", text: "Це вже звучить як MVP.", createdAt: ago(68) },
        ],
        createdAt: ago(86),
      },
      {
        id: "p3",
        authorId: "ira",
        text: "Зробила серію постерів для локальної події. Найкраще працює контраст теплого акценту і спокійної бази.",
        tags: ["#art", "#visual"],
        mood: "launch",
        likes: ["nazar"],
        comments: [],
        createdAt: ago(164),
      },
      {
        id: "p4",
        authorId: "den",
        text: "Маленька порада: якщо метрика не впливає на рішення, її не треба виносити на головний дашборд.",
        tags: ["#data", "#product"],
        mood: "idea",
        likes: ["me", "max"],
        comments: [
          { id: "c4", authorId: "me", text: "Заберу це в нотатки.", createdAt: ago(88) },
        ],
        createdAt: ago(210),
      },
    ],
    chats: [
      {
        id: "chat-lina",
        participants: ["me", "lina"],
        messages: [
          {
            id: "m1",
            authorId: "lina",
            text: "Я додала темну тему в макет. Хочеш подивитись?",
            createdAt: ago(38),
          },
          {
            id: "m2",
            authorId: "me",
            text: "Так, і ще хочу чат прямо в Pulse.",
            createdAt: ago(31),
          },
          {
            id: "m3",
            authorId: "lina",
            text: "Тоді робимо повний прототип.",
            createdAt: ago(26),
          },
        ],
      },
      {
        id: "chat-max",
        participants: ["me", "max"],
        messages: [
          {
            id: "m4",
            authorId: "max",
            text: "Для MVP вистачить постів, профілів і приватних діалогів.",
            createdAt: ago(120),
          },
          {
            id: "m5",
            authorId: "me",
            text: "Зробимо, але щоб виглядало масштабно.",
            createdAt: ago(114),
          },
        ],
      },
    ],
    notifications: [
      {
        id: "n1",
        userId: "me",
        actorId: "lina",
        text: "прокоментувала твій пост у демо-стрічці.",
        view: "feed",
        read: false,
        createdAt: ago(18),
      },
      {
        id: "n2",
        userId: "me",
        actorId: "max",
        text: "написав тобі в чаті.",
        view: "chat",
        read: false,
        createdAt: ago(26),
      },
      {
        id: "n3",
        userId: "me",
        actorId: "den",
        text: "оцінив твою ідею про локальну соцмережу.",
        view: "notifications",
        read: true,
        createdAt: ago(240),
      },
    ],
    projects: [
      {
        id: "room-pulse",
        title: "Pulse Beta",
        tag: "#pulse",
        status: "Закрита бета",
        summary: "Тестова кімната для доробки профілів, чатів і першого публічного запуску.",
        progress: 68,
        members: ["me", "lina", "max"],
      },
      {
        id: "room-design",
        title: "Design Lab",
        tag: "#design",
        status: "Прототип",
        summary: "Інтерфейс, картки профілю, мобільні стани й власна айдентика.",
        progress: 46,
        members: ["lina", "ira"],
      },
      {
        id: "room-data",
        title: "Data Notes",
        tag: "#data",
        status: "Ідеї",
        summary:
          "Місце для метрик, тестових інсайтів і майбутньої аналітики спільноти.",
        progress: 28,
        members: ["den", "max"],
      },
    ],
    updatedAt: Date.now(),
  };
}

function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const data = defaultDB();
      writeDB(data);
      return data;
    }

    const content = fs.readFileSync(DB_FILE, "utf8");
    const data = JSON.parse(content);

    // Ensure all required fields exist
    if (!data.users) data.users = defaultDB().users;
    if (!data.posts) data.posts = defaultDB().posts;
    if (!data.chats) data.chats = defaultDB().chats;
    if (!data.notifications) data.notifications = defaultDB().notifications;
    if (!data.projects) data.projects = defaultDB().projects;
    if (!data.following) data.following = defaultDB().following;
    if (!data.version) data.version = defaultDB().version;

    return data;
  } catch (error) {
    console.error("Error reading DB:", error);
    const data = defaultDB();
    writeDB(data);
    return data;
  }
}

function writeDB(data) {
  data.updatedAt = Date.now();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

function publicState(db) {
  return {
    version: db.version,
    users: db.users.map(publicUser),
    posts: db.posts,
    chats: db.chats,
    notifications: db.notifications,
    projects: db.projects,
    following: db.following,
    updatedAt: db.updatedAt,
  };
}

function statePayload(db) {
  const state = publicState(db);
  return { state, ...state };
}

function normalizeHandle(value) {
  return String(value || "")
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^\p{L}\d_.-]/gu, "")
    .slice(0, 24);
}

function broadcastState(io, db) {
  io.emit("stateUpdated", publicState(db));
}

function addNotification(db, userId, actorId, text, view) {
  if (!userId || !actorId || userId === actorId) return;
  db.notifications.push({
    id: `n${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userId,
    actorId,
    text,
    view,
    read: false,
    createdAt: Date.now(),
  });
}

function mergeIncomingState(current, incoming) {
  const next = {
    ...current,
    version: Number(incoming.version) || current.version || 3,
  };

  if (Array.isArray(incoming.users)) {
    const previousUsers = new Map();
    current.users.forEach((user) => {
      previousUsers.set(user.id, user);
      previousUsers.set(user.handle, user);
    });

    next.users = incoming.users
      .map((user) => {
        const handle = normalizeHandle(user.handle || user.id || user.name);
        if (!handle) return null;
        const previous = previousUsers.get(user.id) || previousUsers.get(handle) || {};
        return {
          id: String(user.id || handle),
          name: String(user.name || previous.name || handle),
          handle,
          password: String(previous.password || user.password || "demo123"),
          role: String(user.role || "Member"),
          location: String(user.location || "Online"),
          bio: String(user.bio || "Новий користувач Pulse."),
          skills: Array.isArray(user.skills) ? user.skills.map(String).slice(0, 12) : ["Pulse"],
          privateMode: Boolean(user.privateMode),
          lastSeenAt: Number(user.lastSeenAt) || Date.now(),
          joinedAt: Number(user.joinedAt) || Date.now(),
          typingChatId: String(user.typingChatId || ""),
          typingAt: Number(user.typingAt) || 0,
        };
      })
      .filter(Boolean);
  }

  if (Array.isArray(incoming.posts)) next.posts = incoming.posts;
  if (Array.isArray(incoming.chats)) next.chats = incoming.chats;
  if (Array.isArray(incoming.notifications)) next.notifications = incoming.notifications;
  if (Array.isArray(incoming.projects)) next.projects = incoming.projects;
  if (incoming.following && typeof incoming.following === "object") next.following = incoming.following;

  next.users.forEach((user) => {
    if (!next.following[user.id]) next.following[user.id] = [];
  });

  return next;
}

// REST API Routes

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/state", (req, res) => {
  const db = readDB();
  res.json(statePayload(db));
});

app.post("/api/state", (req, res) => {
  const incoming = req.body?.state;
  if (!incoming || typeof incoming !== "object") {
    return res.status(400).json({ error: "Invalid state payload" });
  }

  const db = mergeIncomingState(readDB(), incoming);
  writeDB(db);
  broadcastState(io, db);
  res.json(statePayload(db));
});

app.post("/api/register", (req, res) => {
  const { name, handle, password, inviteCode } = req.body || {};
  const cleanName = String(name || "").trim();
  const cleanHandle = normalizeHandle(handle);
  const cleanPassword = String(password || "");

  if (inviteCode !== INVITE_CODE) {
    return res.status(400).json({ error: "Invalid invite code" });
  }
  if (!cleanName || cleanHandle.length < 3 || cleanPassword.length < 4) {
    return res.status(400).json({ error: "Invalid registration data" });
  }

  const db = readDB();
  const exists = db.users.some(
    (user) => user.handle === cleanHandle || user.id === cleanHandle
  );
  if (exists) {
    return res.status(400).json({ error: "User already exists" });
  }

  const user = {
    id: cleanHandle,
    name: cleanName,
    handle: cleanHandle,
    password: cleanPassword,
    role: "Member",
    location: "Online",
    bio: "Новий користувач Pulse.",
    skills: ["Pulse"],
    privateMode: false,
    lastSeenAt: Date.now(),
    joinedAt: Date.now(),
  };

  db.users.push(user);
  db.following[user.id] = [];
  writeDB(db);

  broadcastState(io, db);

  res.json({
    user: publicUser(user),
    state: {
      users: db.users.map(publicUser),
      posts: db.posts,
      chats: db.chats,
      notifications: db.notifications,
      projects: db.projects,
      following: db.following,
    },
  });
});

app.post("/api/login", (req, res) => {
  const { handle, password } = req.body || {};
  const cleanHandle = normalizeHandle(handle);
  const db = readDB();

  const user = db.users.find(
    (item) =>
      (item.handle === cleanHandle || item.id === cleanHandle) &&
      item.password === password
  );

  if (!user) {
    return res.status(400).json({ error: "Wrong credentials" });
  }

  user.lastSeenAt = Date.now();
  writeDB(db);
  broadcastState(io, db);

  res.json({
    user: publicUser(user),
    state: {
      users: db.users.map(publicUser),
      posts: db.posts,
      chats: db.chats,
      notifications: db.notifications,
      projects: db.projects,
      following: db.following,
    },
  });
});

app.post("/api/posts", (req, res) => {
  const { authorId, text, tags = [], mood = "idea" } = req.body || {};

  if (!authorId || !text || !text.trim()) {
    return res.status(400).json({ error: "Invalid post data" });
  }

  const db = readDB();
  const post = {
    id: `p${Date.now()}`,
    authorId,
    text: text.trim(),
    tags,
    mood,
    likes: [],
    comments: [],
    createdAt: Date.now(),
  };

  db.posts.unshift(post);
  writeDB(db);
  broadcastState(io, db);

  res.json({ post });
});

app.post("/api/posts/:postId/likes", (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body || {};

  const db = readDB();
  const post = db.posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const hasLiked = post.likes.includes(userId);
  if (hasLiked) {
    post.likes = post.likes.filter((id) => id !== userId);
  } else {
    post.likes.push(userId);
    addNotification(db, post.authorId, userId, "лайкнув твій пост.", "feed");
  }

  writeDB(db);
  broadcastState(io, db);

  res.json({ post });
});

app.post("/api/posts/:postId/comments", (req, res) => {
  const { postId } = req.params;
  const { authorId, text } = req.body || {};

  if (!authorId || !text || !text.trim()) {
    return res.status(400).json({ error: "Invalid comment data" });
  }

  const db = readDB();
  const post = db.posts.find((p) => p.id === postId);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const comment = {
    id: `c${Date.now()}`,
    authorId,
    text: text.trim(),
    createdAt: Date.now(),
  };

  post.comments.push(comment);
  addNotification(db, post.authorId, authorId, "прокоментував твій пост.", "feed");
  writeDB(db);
  broadcastState(io, db);

  res.json({ comment });
});

app.post("/api/messages", (req, res) => {
  const { chatId, authorId, text = "", participantIds = [], attachments = [] } = req.body || {};
  const cleanText = String(text || "").trim();
  const cleanAttachments = Array.isArray(attachments) ? attachments.slice(0, 1) : [];

  if (!chatId || !authorId || (!cleanText && cleanAttachments.length === 0)) {
    return res.status(400).json({ error: "Invalid message data" });
  }

  const db = readDB();
  let chat = db.chats.find((c) => c.id === chatId);
  const participants = Array.from(new Set([authorId, ...participantIds].filter(Boolean)));

  if (!chat) {
    chat = {
      id: chatId,
      participants,
      messages: [],
    };
    db.chats.push(chat);
  } else {
    participants.forEach((id) => {
      if (!chat.participants.includes(id)) chat.participants.push(id);
    });
  }

  const message = {
    id: `m${Date.now()}`,
    authorId,
    text: cleanText,
    attachments: cleanAttachments,
    createdAt: Date.now(),
    editedAt: 0,
    deletedAt: 0,
    readBy: [authorId],
  };

  chat.messages.push(message);
  chat.participants
    .filter((id) => id !== authorId)
    .forEach((id) => addNotification(db, id, authorId, "написав тобі в чаті.", "chat"));
  writeDB(db);
  broadcastState(io, db);

  res.json({ message });
});

app.post("/api/follow", (req, res) => {
  const { userId, targetId } = req.body || {};

  if (!userId || !targetId) {
    return res.status(400).json({ error: "Invalid follow data" });
  }

  const db = readDB();
  if (!db.following[userId]) {
    db.following[userId] = [];
  }

  const isFollowing = db.following[userId].includes(targetId);
  if (isFollowing) {
    db.following[userId] = db.following[userId].filter((id) => id !== targetId);
  } else {
    db.following[userId].push(targetId);
    addNotification(db, targetId, userId, "почав читати твій профіль.", "profile");
  }

  writeDB(db);
  broadcastState(io, db);

  res.json({ following: db.following[userId] });
});

app.put("/api/profile", (req, res) => {
  const { userId, name, bio, location, role } = req.body || {};

  if (!userId) {
    return res.status(400).json({ error: "User ID required" });
  }

  const db = readDB();
  const user = db.users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (location) user.location = location;
  if (role) user.role = role;

  writeDB(db);
  broadcastState(io, db);

  res.json({ user: publicUser(user) });
});

app.post("/api/notifications/read", (req, res) => {
  const { notificationIds } = req.body || {};

  if (!Array.isArray(notificationIds)) {
    return res.status(400).json({ error: "Invalid notification IDs" });
  }

  const db = readDB();
  notificationIds.forEach((id) => {
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  });

  writeDB(db);
  broadcastState(io, db);

  res.json({ ok: true });
});

// WebSocket Events

io.on("connection", (socket) => {
  console.log("✨ Client connected:", socket.id);

  const db = readDB();
  socket.emit("stateUpdated", publicState(db));

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });

  socket.on("userOnline", (data) => {
    const { userId } = data;
    const db = readDB();
    const user = db.users.find((u) => u.id === userId);
    if (user) {
      user.lastSeenAt = Date.now();
      writeDB(db);
      broadcastState(io, db);
    }
  });
});

app.use(express.static(FRONTEND_DIR, { dotfiles: "ignore", index: "index.html" }));

app.get(/^(?!\/api\/).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

// Error handling
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

server.listen(PORT, () => {
  console.log(`✨ Pulse backend running on http://localhost:${PORT}`);
  console.log(`🚀 WebSocket ready for real-time updates`);
  console.log(`📁 Database: ${DB_FILE}`);
});
