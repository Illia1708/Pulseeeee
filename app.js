const STORAGE_KEY = "pulse-social-v2";

// Support optional override for deployable frontend and backend
const API_BASE = window.APP_API_BASE || (() => {
  const host = window.location.hostname;
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';
  if (isLocalhost) {
    return 'http://localhost:3000';
  }
  const protocol = window.location.protocol;
  const domain = window.location.hostname;
  return `${protocol}//${domain.replace('www.', '')}`;
})();

const WS_URL = window.APP_WS_URL || API_BASE;
const INVITE_CODE = "PULSE-ACCESS";
const SYNC_DELAY = 300;
const POLL_DELAY = 3500;
const ONLINE_WINDOW = 2 * 60 * 1000;
const TYPING_WINDOW = 4500;
const startedAt = Date.now();
const ago = (minutes) => startedAt - minutes * 60 * 1000;

let socket = null;

const seedState = {
  version: 3,
  theme: "light",
  sessionUserId: "",
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
      comments: [{ id: "c3", authorId: "lina", text: "Це вже звучить як MVP.", createdAt: ago(68) }],
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
      comments: [{ id: "c4", authorId: "me", text: "Заберу це в нотатки.", createdAt: ago(88) }],
      createdAt: ago(210),
    },
  ],
  chats: [
    {
      id: "chat-lina",
      participants: ["me", "lina"],
      messages: [
        { id: "m1", authorId: "lina", text: "Я додала темну тему в макет. Хочеш подивитись?", createdAt: ago(38) },
        { id: "m2", authorId: "me", text: "Так, і ще хочу чат прямо в Pulse.", createdAt: ago(31) },
        { id: "m3", authorId: "lina", text: "Тоді робимо повний прототип.", createdAt: ago(26) },
      ],
    },
    {
      id: "chat-max",
      participants: ["me", "max"],
      messages: [
        { id: "m4", authorId: "max", text: "Для MVP вистачить постів, профілів і приватних діалогів.", createdAt: ago(120) },
        { id: "m5", authorId: "me", text: "Зробимо, але щоб виглядало масштабно.", createdAt: ago(114) },
      ],
    },
  ],
  notifications: [
    { id: "n1", userId: "me", actorId: "lina", text: "прокоментувала твій пост у демо-стрічці.", view: "feed", read: false, createdAt: ago(18) },
    { id: "n2", userId: "me", actorId: "max", text: "написав тобі в чаті.", view: "chat", read: false, createdAt: ago(26) },
    { id: "n3", userId: "me", actorId: "den", text: "оцінив твою ідею про локальну соцмережу.", view: "notifications", read: true, createdAt: ago(240) },
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
      summary: "Місце для метрик, тестових інсайтів і майбутньої аналітики спільноти.",
      progress: 28,
      members: ["den", "max"],
    },
  ],
};

let state = loadState();
let activeView = "feed";
let feedMode = "all";
let searchTerm = "";
let activeChatId = "";
let activePersonId = "lina";
let chatSearchTerm = "";
let backendOnline = false;
let syncTimer = 0;
let pollTimer = 0;
let isSyncingFromServer = false;
let selectedAttachment = null;
let typingTimer = 0;

const refs = {
  appShell: document.querySelector("#appShell"),
  authScreen: document.querySelector("#authScreen"),
  authMessage: document.querySelector("#authMessage"),
  authTabs: document.querySelectorAll(".auth-tab"),
  authForms: document.querySelectorAll(".auth-form"),
  loginForm: document.querySelector("#loginForm"),
  registerForm: document.querySelector("#registerForm"),
  demoLogin: document.querySelector("#demoLogin"),
  currentAvatar: document.querySelector("#currentAvatar"),
  currentName: document.querySelector("#currentName"),
  currentHandle: document.querySelector("#currentHandle"),
  currentAvatars: document.querySelectorAll("[data-current-avatar]"),
  logoutButton: document.querySelector("#logoutButton"),
  themeToggle: document.querySelector("#themeToggle"),
  themeIcon: document.querySelector("#themeIcon"),
  themeText: document.querySelector("#themeText"),
  navItems: document.querySelectorAll(".nav-item"),
  navBadge: document.querySelector("#navBadge"),
  viewTitle: document.querySelector("#viewTitle"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  viewSubtitle: document.querySelector("#viewSubtitle"),
  viewPanels: document.querySelectorAll(".view-panel"),
  searchInput: document.querySelector("#searchInput"),
  clearSearch: document.querySelector("#clearSearch"),
  postForm: document.querySelector("#postForm"),
  postText: document.querySelector("#postText"),
  postMood: document.querySelector("#postMood"),
  charCount: document.querySelector("#charCount"),
  feedFilters: document.querySelector("#feedFilters"),
  feed: document.querySelector("#feed"),
  emptyState: document.querySelector("#emptyState"),
  trends: document.querySelector("#trends"),
  suggestions: document.querySelector("#suggestions"),
  networkStats: document.querySelector("#networkStats"),
  peopleGrid: document.querySelector("#peopleGrid"),
  ideaShortcut: document.querySelector("#ideaShortcut"),
  ideaBoard: document.querySelector("#ideaBoard"),
  projectBoard: document.querySelector("#projectBoard"),
  personProfile: document.querySelector("#personProfile"),
  chatSearch: document.querySelector("#chatSearch"),
  chatMatches: document.querySelector("#chatMatches"),
  conversationList: document.querySelector("#conversationList"),
  chatHead: document.querySelector("#chatHead"),
  messageList: document.querySelector("#messageList"),
  messageForm: document.querySelector("#messageForm"),
  messageText: document.querySelector("#messageText"),
  messageCount: document.querySelector("#messageCount"),
  attachmentInput: document.querySelector("#attachmentInput"),
  attachmentPreview: document.querySelector("#attachmentPreview"),
  attachButton: document.querySelector("#attachButton"),
  notificationList: document.querySelector("#notificationList"),
  markRead: document.querySelector("#markRead"),
  profileName: document.querySelector("#profileName"),
  profileMeta: document.querySelector("#profileMeta"),
  profileBio: document.querySelector("#profileBio"),
  profileStats: document.querySelector("#profileStats"),
  profileForm: document.querySelector("#profileForm"),
  profileMessage: document.querySelector("#profileMessage"),
  profilePosts: document.querySelector("#profilePosts"),
  postTemplate: document.querySelector("#postTemplate"),
};

const viewCopy = {
  feed: {
    eyebrow: "сьогодні в Pulse",
    title: "Стрічка",
    subtitle: "Пости людей, яких ти читаєш, і найгарячіші ідеї спільноти.",
  },
  discover: {
    eyebrow: "нові знайомства",
    title: "Люди",
    subtitle: "Знаходь авторів, підписуйся на них і починай приватні діалоги.",
  },
  ideas: {
    eyebrow: "лабораторія думок",
    title: "Ідеї",
    subtitle: "Окрема стрічка для задумів, питань і гіпотез, які ще не стали проєктами.",
  },
  projects: {
    eyebrow: "кімнати прогресу",
    title: "Проєкти",
    subtitle: "Місця для статусів, маленьких команд і спокійного тестування без гучного запуску.",
  },
  chat: {
    eyebrow: "приватні діалоги",
    title: "Чат",
    subtitle: "Повідомлення синхронізуються через локальний бекенд, а без сервера лишається офлайн-режим.",
  },
  notifications: {
    eyebrow: "активність",
    title: "Сповіщення",
    subtitle: "Усе важливе: відповіді, лайки, підписки й повідомлення.",
  },
  profile: {
    eyebrow: "твій простір",
    title: "Профіль",
    subtitle: "Оновлюй дані профілю і дивись свої публікації.",
  },
  person: {
    eyebrow: "публічний профіль",
    title: "Профіль людини",
    subtitle: "Коротка картка, пости й швидкі дії: читати або написати приватно.",
  },
};

const moodLabels = {
  idea: "Ідея",
  progress: "Прогрес",
  question: "Питання",
  launch: "Запуск",
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeState(JSON.parse(saved));
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
  return normalizeState(clone(seedState));
}

function normalizeState(raw) {
  raw = raw && typeof raw === "object" ? raw : {};
  const next = { ...clone(seedState), ...raw };
  next.users = Array.isArray(raw.users) ? raw.users : clone(seedState.users);
  next.posts = Array.isArray(raw.posts) ? raw.posts : clone(seedState.posts);
  next.chats = Array.isArray(raw.chats) ? raw.chats : clone(seedState.chats);
  next.notifications = Array.isArray(raw.notifications) ? raw.notifications : clone(seedState.notifications);
  next.projects = Array.isArray(raw.projects) ? raw.projects : clone(seedState.projects);
  const rawFollowing = raw.following && typeof raw.following === "object" ? raw.following : clone(seedState.following);
  next.theme = raw.theme === "dark" ? "dark" : "light";

  next.users.forEach((user) => {
    user.id ||= normalizeHandle(user.handle || user.name || uid("user"));
    user.handle = normalizeHandle(user.handle || user.id);
    user.password ||= "demo123";
    user.role ||= "Member";
    user.location ||= "Online";
    user.bio ||= "Новий користувач Pulse.";
    user.skills ||= ["Pulse"];
    user.privateMode = Boolean(user.privateMode);
    user.joinedAt ||= Date.now();
    user.lastSeenAt ||= user.joinedAt;
    user.typingChatId ||= "";
    user.typingAt ||= 0;
  });

  const resolveId = (value) => {
    const key = String(value || "");
    return next.users.find((user) => user.id === key || user.handle === key)?.id || key;
  };

  const hasStoredSession = Object.prototype.hasOwnProperty.call(raw, "sessionUserId");
  next.sessionUserId = hasStoredSession ? resolveId(raw.sessionUserId) : seedState.sessionUserId;

  next.following = {};
  next.users.forEach((user) => {
    next.following[user.id] = [];
  });
  Object.entries(rawFollowing).forEach(([owner, list]) => {
    const ownerId = resolveId(owner);
    if (!Array.isArray(list) || !next.following[ownerId]) return;
    next.following[ownerId] = Array.from(new Set(list.map(resolveId).filter((id) => id && id !== ownerId)));
  });

  next.posts.forEach((post) => {
    post.authorId = resolveId(post.authorId);
    post.tags ||= extractTags(post.text || "");
    post.likes = Array.from(new Set((post.likes || []).map(resolveId)));
    post.mood ||= "idea";
    post.comments = (post.comments || []).map((comment) =>
      typeof comment === "string"
        ? { id: uid("comment"), authorId: post.authorId, text: comment, createdAt: post.createdAt }
        : { ...comment, authorId: resolveId(comment.authorId) },
    );
  });

  next.chats.forEach((chat) => {
    chat.participants = Array.from(new Set((chat.participants || []).map(resolveId)));
    chat.messages = (chat.messages || []).map((message) => {
      const authorId = resolveId(message.authorId);
      const readBy = new Set((message.readBy || []).map(resolveId));
      readBy.add(authorId);
      return {
        ...message,
        authorId,
        text: message.deletedAt ? "" : message.text || "",
        attachments: Array.isArray(message.attachments) ? message.attachments : [],
        editedAt: message.editedAt || 0,
        deletedAt: message.deletedAt || 0,
        readBy: [...readBy],
      };
    });
  });

  next.notifications.forEach((notification) => {
    notification.userId = resolveId(notification.userId);
    notification.actorId = resolveId(notification.actorId);
    notification.read = Boolean(notification.read);
    notification.createdAt ||= Date.now();
  });

  next.projects.forEach((project) => {
    project.progress = Math.max(0, Math.min(100, Number(project.progress) || 0));
    project.members = Array.from(new Set((project.members || []).map(resolveId)));
    project.status ||= "Ідея";
    project.tag ||= "#pulse";
  });

  if (next.sessionUserId && !next.users.some((user) => user.id === next.sessionUserId)) {
    next.sessionUserId = "me";
  }

  return next;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function touchCurrentUser() {
  const user = currentUser();
  if (!user) return;
  user.lastSeenAt = Date.now();
}

function sharedState() {
  const next = clone(state);
  delete next.sessionUserId;
  delete next.theme;
  return next;
}

function saveState(options = {}) {
  const shouldSync = options.sync !== false;
  touchCurrentUser();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (shouldSync && !isSyncingFromServer) queueServerSync();
}

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "API request failed");
  return data;
}

function queueServerSync() {
  if (!backendOnline) return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(pushStateToServer, SYNC_DELAY);
}

async function pushStateToServer() {
  if (!backendOnline) return;
  try {
    await apiFetch("/api/state", {
      method: "POST",
      body: JSON.stringify({ state: sharedState() }),
    });
  } catch {
    backendOnline = false;
  }
}

async function pullStateFromServer(options = {}) {
  const keepSession = state.sessionUserId;
  const keepTheme = state.theme;
  const data = await apiFetch("/api/state");

  if (!data.state || !Array.isArray(data.state.users) || data.state.users.length === 0) {
    backendOnline = true;
    await pushStateToServer();
    return;
  }

  isSyncingFromServer = true;
  state = normalizeState({
    ...data.state,
    sessionUserId: keepSession,
    theme: keepTheme,
  });
  saveState({ sync: false });
  isSyncingFromServer = false;
  if (!options.silent) renderApp();
}

async function initializeApp() {
  renderApp();
  try {
    await apiFetch("/api/health");
    backendOnline = true;
    await pullStateFromServer({ silent: true });
    renderApp();
    
    // Initialize WebSocket connection
    if (typeof io !== 'undefined') {
      socket = io(WS_URL, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5
      });
      
      socket.on('connect', () => {
        console.log('✨ WebSocket connected');
        backendOnline = true;
        renderApp();
      });
      
      socket.on('disconnect', () => {
        console.log('💤 WebSocket disconnected');
        backendOnline = false;
        renderApp();
      });
      
      socket.on('stateUpdated', (remoteState) => {
        if (remoteState && !isSyncingFromServer) {
          isSyncingFromServer = true;
          const keepSession = state.sessionUserId;
          const keepTheme = state.theme;
          state = normalizeState({
            ...remoteState,
            sessionUserId: keepSession,
            theme: keepTheme,
          });
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          isSyncingFromServer = false;
          renderApp();
        }
      });
      
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
        backendOnline = false;
      });
    }
  } catch (error) {
    console.error('Failed to initialize:', error);
    backendOnline = false;
  }
}

function startServerPolling() {
  window.clearInterval(pollTimer);
  pollTimer = window.setInterval(async () => {
    if (!backendOnline || !currentUser()) return;
    try {
      await pullStateFromServer({ silent: true });
      renderApp();
    } catch {
      backendOnline = false;
      window.clearInterval(pollTimer);
    }
  }, POLL_DELAY);
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function currentUser() {
  return state.users.find((user) => user.id === state.sessionUserId);
}

function currentId() {
  return currentUser()?.id;
}

function getUser(userId) {
  const key = String(userId || "");
  return (
    state.users.find((user) => user.id === key || user.handle === key) || {
      id: "missing",
      name: "Невідомий користувач",
      handle: "missing",
      role: "Профіль недоступний",
      location: "Online",
      bio: "",
      skills: [],
      privateMode: false,
      joinedAt: Date.now(),
    }
  );
}

function resolveUserId(userId) {
  const user = getUser(userId);
  return user.id === "missing" ? "" : user.id;
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeHandle(value) {
  return value
    .trim()
    .replace(/^@/, "")
    .toLowerCase()
    .replace(/[^\p{L}\d_.-]/gu, "")
    .slice(0, 24);
}

function relativeTime(timestamp) {
  const minutes = Math.max(1, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 60) return `${minutes} хв тому`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} год тому`;
  return `${Math.round(hours / 24)} дн тому`;
}

function extractTags(text) {
  return Array.from(new Set(text.match(/#[\p{L}\d_]+/gu) ?? []));
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function createAvatar(user, className = "avatar") {
  const avatar = createElement("div", className, initials(displayName(user)));
  avatar.setAttribute("aria-hidden", "true");
  return avatar;
}

function displayName(user) {
  if (!user.privateMode || user.id === currentId()) return user.name;
  return "Учасник Pulse";
}

function displayHandle(user) {
  if (!user.privateMode || user.id === currentId()) return `@${user.handle}`;
  return "@private";
}

function displayRole(user) {
  if (!user.privateMode || user.id === currentId()) return user.role;
  return "напіванонімний профіль";
}

function renderApp() {
  applyTheme();
  const user = currentUser();
  refs.authScreen.classList.toggle("hidden", Boolean(user));
  refs.appShell.classList.toggle("hidden", !user);
  if (!user) return;

  renderShell(user);
  renderViewFrame();
  renderFeed();
  renderTrends();
  renderSuggestions();
  renderNetworkStats();
  renderPeople();
  renderIdeas();
  renderProjects();
  renderChat();
  renderNotifications();
  renderProfile();
  renderPersonProfile();
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  refs.themeIcon.textContent = state.theme === "dark" ? "☀" : "◐";
  refs.themeText.textContent = state.theme === "dark" ? "Світла тема" : "Темна тема";
}

function renderShell(user) {
  const unread = unreadNotifications().length;
  refs.currentAvatar.textContent = initials(user.name);
  refs.currentName.textContent = user.name;
  refs.currentHandle.textContent = `@${user.handle}`;
  refs.currentAvatars.forEach((avatar) => {
    avatar.textContent = initials(user.name);
  });
  refs.navBadge.textContent = unread;
  refs.navBadge.classList.toggle("hidden", unread === 0);
}

function renderViewFrame() {
  const copy = viewCopy[activeView];
  refs.viewEyebrow.textContent = copy.eyebrow;
  refs.viewTitle.textContent = activeView === "person" ? displayName(getUser(activePersonId)) : copy.title;
  refs.viewSubtitle.textContent = activeView === "chat" ? `${copy.subtitle} ${backendOnline ? "Сервер активний." : "Офлайн режим."}` : copy.subtitle;

  refs.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === activeView);
  });
  refs.viewPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === `view-${activeView}`);
  });
  refs.clearSearch.classList.toggle("hidden", searchTerm.length === 0);
}

function filteredPosts(ownerId = null) {
  const me = currentId();
  const follows = state.following[me] || [];
  const term = searchTerm.toLowerCase();

  return state.posts
    .filter((post) => {
      const user = getUser(post.authorId);
      const score = post.likes.length + post.comments.length;
      const text = `${post.text} ${post.tags.join(" ")} ${user.name} ${user.handle} ${post.mood}`.toLowerCase();

      if (ownerId && post.authorId !== ownerId) return false;
      if (!ownerId && feedMode === "following" && post.authorId !== me && !follows.includes(post.authorId)) return false;
      if (!ownerId && feedMode === "trending" && score < 2) return false;
      return !term || text.includes(term);
    })
    .sort((a, b) => b.createdAt - a.createdAt);
}

function renderFeed() {
  const posts = filteredPosts();
  refs.feed.replaceChildren(...posts.map(renderPost));
  refs.emptyState.classList.toggle("hidden", posts.length > 0);

  refs.feedFilters.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.feedMode === feedMode);
  });
}

function renderPost(post) {
  const me = currentId();
  const user = getUser(post.authorId);
  const node = refs.postTemplate.content.firstElementChild.cloneNode(true);
  const isLiked = post.likes.includes(me);
  const isMine = post.authorId === me;
  const isFollowing = (state.following[me] || []).includes(post.authorId);
  const avatar = createAvatar(user);

  avatar.addEventListener("click", () => openProfile(user.id));
  node.querySelector(".avatar").replaceWith(avatar);
  node.querySelector(".author").textContent = displayName(user);
  node.querySelector(".author").addEventListener("click", () => openProfile(user.id));
  node.querySelector(".meta").textContent = `${displayHandle(user)} · ${relativeTime(post.createdAt)}`;
  node.querySelector(".mood-pill").textContent = moodLabels[post.mood] || "Пост";
  node.querySelector(".post-body").textContent = post.text;

  const tagBox = node.querySelector(".post-tags");
  tagBox.replaceChildren(...post.tags.map((tag) => createTag(tag)));

  const likeButton = node.querySelector(".like-button");
  likeButton.textContent = `${isLiked ? "♥" : "♡"} ${post.likes.length}`;
  likeButton.classList.toggle("active", isLiked);
  likeButton.addEventListener("click", () => toggleLike(post.id));

  const commentToggle = node.querySelector(".comment-toggle");
  commentToggle.textContent = `Коментарі ${post.comments.length}`;

  const followButton = node.querySelector(".follow-button");
  followButton.textContent = isMine ? "Мій пост" : isFollowing ? "Читаю" : "Читати";
  followButton.disabled = isMine;
  followButton.addEventListener("click", () => toggleFollow(post.authorId));

  const profileButton = node.querySelector(".profile-button");
  profileButton.textContent = isMine ? "Мій профіль" : "Профіль";
  profileButton.addEventListener("click", () => openProfile(post.authorId));

  const messageButton = node.querySelector(".message-button");
  messageButton.textContent = isMine ? "Автор" : "Написати";
  messageButton.disabled = isMine;
  messageButton.addEventListener("click", () => openChatWith(post.authorId));

  const commentForm = node.querySelector(".comment-form");
  commentForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = commentForm.querySelector("input");
    addComment(post.id, input.value);
    input.value = "";
  });

  const comments = node.querySelector(".comments");
  comments.replaceChildren(...post.comments.map(renderComment));

  return node;
}

function renderComment(comment) {
  const user = getUser(comment.authorId);
  const item = createElement("div", "comment");
  const author = createElement("strong", "", displayName(user));
  author.addEventListener("click", () => openProfile(user.id));
  const text = createElement("span", "", comment.text);
  item.append(author, text);
  return item;
}

function createTag(tag) {
  const item = createElement("button", "tag", tag);
  item.type = "button";
  item.addEventListener("click", () => {
    searchTerm = tag;
    refs.searchInput.value = tag;
    activeView = "feed";
    renderApp();
  });
  return item;
}

function renderTrends() {
  const counts = new Map();
  state.posts.flatMap((post) => post.tags).forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
  const tags = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  refs.trends.replaceChildren(...tags.map(([tag]) => createTag(tag)));
}

function renderSuggestions() {
  const me = currentId();
  const follows = state.following[me] || [];
  const users = state.users.filter((user) => user.id !== me && !follows.includes(user.id)).slice(0, 3);

  refs.suggestions.replaceChildren(
    ...users.map((user) => {
      const row = createElement("div", "suggestion");
      const infoWrap = createElement("div", "brand");
      const text = createElement("div", "suggestion-info");
      text.append(createElement("strong", "", displayName(user)), createElement("span", "", displayHandle(user)));
      infoWrap.append(createAvatar(user), text);
      infoWrap.addEventListener("click", () => openProfile(user.id));

      const button = createElement("button", "follow-button", "Читати");
      button.type = "button";
      button.addEventListener("click", () => toggleFollow(user.id));
      row.append(infoWrap, button);
      return row;
    }),
  );
}

function renderNetworkStats() {
  const me = currentId();
  const myChats = conversationsForUser(me);
  const messages = myChats.reduce((sum, chat) => sum + chat.messages.length, 0);
  renderMetrics(refs.networkStats, [
    { value: state.posts.length, label: "постів" },
    { value: state.users.length, label: "людей" },
    { value: messages, label: "повідомлень" },
  ]);
}

function renderMetrics(container, metrics) {
  container.replaceChildren(
    ...metrics.map((metric) => {
      const item = createElement("div", "metric");
      item.append(createElement("strong", "", String(metric.value)), createElement("span", "", metric.label));
      return item;
    }),
  );
}

function renderPeople() {
  const me = currentId();
  const term = searchTerm.toLowerCase();
  const people = state.users
    .filter((user) => user.id !== me)
    .filter((user) => {
      const text = `${user.name} ${user.handle} ${user.role} ${user.location} ${user.bio} ${user.skills.join(" ")}`.toLowerCase();
      return !term || text.includes(term);
    });

  refs.peopleGrid.replaceChildren(...people.map(renderPersonCard));
  if (people.length === 0) {
    refs.peopleGrid.append(createElement("div", "empty-state", "Нікого не знайдено. Очисти пошук або введи інший запит."));
  }
}

function renderPersonCard(user) {
  const me = currentId();
  const isFollowing = (state.following[me] || []).includes(user.id);
  const card = createElement("article", "person-card");
  const head = createElement("header", "person-head");
  const info = createElement("div", "person-info");
  info.append(
    createElement("strong", "", displayName(user)),
    createElement("span", "person-meta", `${displayHandle(user)} · ${displayRole(user)}`),
    createElement("span", "person-meta", user.privateMode && user.id !== me ? "приватність увімкнена" : user.location),
  );
  head.append(createAvatar(user), info);

  const bio = createElement("p", "person-bio", user.privateMode && user.id !== me ? "Цей профіль показує мінімум публічної інформації. Можна читати й написати приватно." : user.bio);
  const skills = createElement("div", "skill-list");
  skills.replaceChildren(...user.skills.map((skill) => createElement("span", "skill", skill)));

  const actions = createElement("div", "person-actions");
  const profile = createElement("button", "ghost-button", "Профіль");
  profile.type = "button";
  profile.addEventListener("click", () => openProfile(user.id));
  const follow = createElement("button", "follow-button", isFollowing ? "Читаю" : "Читати");
  follow.type = "button";
  follow.addEventListener("click", () => toggleFollow(user.id));
  const message = createElement("button", "message-button", "Написати");
  message.type = "button";
  message.addEventListener("click", () => openChatWith(user.id));
  actions.append(profile, follow, message);

  card.append(head, bio, skills, actions);
  return card;
}

function renderIdeas() {
  const term = searchTerm.toLowerCase();
  const ideas = state.posts
    .filter((post) => ["idea", "question"].includes(post.mood))
    .filter((post) => {
      const user = getUser(post.authorId);
      const text = `${post.text} ${post.tags.join(" ")} ${user.name} ${user.handle}`.toLowerCase();
      return !term || text.includes(term);
    })
    .sort((a, b) => b.createdAt - a.createdAt);

  refs.ideaBoard.replaceChildren(
    ...ideas.map((post) => {
      const user = getUser(post.authorId);
      const card = createElement("article", "idea-card");
      const head = createElement("header", "person-head");
      const info = createElement("div", "person-info");
      info.append(
        createElement("strong", "", displayName(user)),
        createElement("span", "person-meta", `${displayHandle(user)} · ${relativeTime(post.createdAt)}`),
      );
      head.append(createAvatar(user), info, createElement("span", "mood-pill", moodLabels[post.mood]));
      const body = createElement("p", "", post.text);
      const tags = createElement("div", "post-tags");
      tags.replaceChildren(...post.tags.map((tag) => createTag(tag)));
      const footer = createElement("div", "idea-footer");
      footer.append(createElement("span", "", `${post.likes.length} лайків · ${post.comments.length} коментарів`));
      const button = createElement("button", "ghost-button small", "Профіль автора");
      button.type = "button";
      button.addEventListener("click", () => openProfile(user.id));
      footer.append(button);
      card.append(head, body, tags, footer);
      return card;
    }),
  );

  if (ideas.length === 0) {
    refs.ideaBoard.append(createElement("div", "empty-state", "Ідей за цим запитом немає. Створи пост з типом “Ідея” або “Питання”."));
  }
}

function renderProjects() {
  const term = searchTerm.toLowerCase();
  const projects = state.projects.filter((project) => {
    const memberText = project.members.map((id) => getUser(id).name).join(" ");
    const text = `${project.title} ${project.tag} ${project.status} ${project.summary} ${memberText}`.toLowerCase();
    return !term || text.includes(term);
  });

  refs.projectBoard.replaceChildren(
    ...projects.map((project) => {
      const card = createElement("article", "project-card");
      const head = createElement("header", "person-head");
      const info = createElement("div", "person-info");
      info.append(createElement("strong", "", project.title), createElement("span", "person-meta", `${project.status} · ${project.tag}`));
      head.append(createElement("div", "avatar", project.title.slice(0, 2).toUpperCase()), info);

      const progress = createElement("div", "progress-track");
      const fill = createElement("span", "progress-fill");
      fill.style.width = `${project.progress}%`;
      progress.append(fill);

      const members = createElement("div", "skill-list");
      members.replaceChildren(...project.members.map((id) => createElement("span", "skill", displayName(getUser(id)))));

      const footer = createElement("div", "project-footer");
      footer.append(createElement("span", "", `${project.progress}% готово`));
      const button = createElement("button", "ghost-button small", "Відкрити кімнату");
      button.type = "button";
      button.addEventListener("click", () => {
        searchTerm = project.tag;
        refs.searchInput.value = project.tag;
        activeView = "feed";
        renderApp();
      });
      footer.append(button);

      card.append(head, createElement("p", "", project.summary), progress, members, footer);
      return card;
    }),
  );

  if (projects.length === 0) {
    refs.projectBoard.append(createElement("div", "empty-state", "Проєктів за цим запитом немає."));
  }
}

function conversationsForUser(userId) {
  return state.chats
    .filter((chat) => chat.participants.includes(userId))
    .sort((a, b) => lastMessageTime(b) - lastMessageTime(a));
}

function lastMessageTime(chat) {
  return chat.messages.at(-1)?.createdAt || 0;
}

function otherParticipant(chat) {
  return getUser(chat.participants.find((id) => id !== currentId()) || currentId());
}

function presenceLabel(user) {
  if (!user || user.id === "missing") return "поза мережею";
  if (user.id === currentId() || Date.now() - (user.lastSeenAt || 0) < ONLINE_WINDOW) return "онлайн";
  return `був ${relativeTime(user.lastSeenAt || user.joinedAt || Date.now())}`;
}

function isTypingInChat(user, chatId) {
  return Boolean(user?.typingChatId === chatId && Date.now() - (user.typingAt || 0) < TYPING_WINDOW);
}

function renderChat() {
  const me = currentId();
  const chats = conversationsForUser(me);
  if (!activeChatId || !chats.some((chat) => chat.id === activeChatId)) {
    activeChatId = chats[0]?.id || "";
  }

  const chat = state.chats.find((item) => item.id === activeChatId);
  const wasMarked = chat && activeView === "chat" ? markChatRead(chat, me) : false;
  renderChatMatches();
  refs.conversationList.replaceChildren(...chats.map(renderConversation));
  if (chats.length === 0) {
    refs.conversationList.append(createElement("div", "empty-state compact", "Почни діалог через пошук або профіль людини."));
  }

  if (!chat) {
    refs.chatHead.replaceChildren(createElement("strong", "", "Немає діалогів"));
    refs.messageList.replaceChildren(createElement("div", "empty-state", "Відкрий профіль людини і натисни “Написати”."));
    setMessageFormEnabled(false);
    return;
  }

  const other = otherParticipant(chat);
  const headText = createElement("div", "chat-head-copy");
  headText.append(
    createElement("strong", "", displayName(other)),
    createElement("span", "person-meta", `${displayHandle(other)} · ${presenceLabel(other)} · ${chat.messages.length} повідомлень`),
  );
  const actions = createElement("div", "chat-head-actions");
  const profileButton = createElement("button", "ghost-button small", "Профіль");
  profileButton.type = "button";
  profileButton.addEventListener("click", () => openProfile(other.id));
  actions.append(profileButton);
  refs.chatHead.replaceChildren(createAvatar(other), headText, actions);
  refs.messageList.replaceChildren(
    ...(chat.messages.length
      ? chat.messages.map((message) => renderMessage(message, chat))
      : [createElement("div", "empty-state", "Діалог створено. Перше повідомлення з'явиться тут після відправлення.")]),
  );
  if (isTypingInChat(other, chat.id)) {
    refs.messageList.append(createElement("div", "typing-indicator", `${displayName(other)} пише...`));
  }
  refs.messageList.scrollTop = refs.messageList.scrollHeight;
  setMessageFormEnabled(true);
  if (wasMarked) saveState();
}

function renderChatMatches() {
  const term = chatSearchTerm.toLowerCase();
  if (!term) {
    refs.chatMatches.classList.add("hidden");
    refs.chatMatches.replaceChildren();
    return;
  }

  const me = currentId();
  const matches = state.users
    .filter((user) => user.id !== me)
    .filter((user) => `${user.name} ${user.handle} ${user.role}`.toLowerCase().includes(term))
    .slice(0, 5);

  refs.chatMatches.classList.toggle("hidden", matches.length === 0);
  refs.chatMatches.replaceChildren(
    ...matches.map((user) => {
      const button = createElement("button", "chat-match");
      button.type = "button";
      const info = createElement("div", "conversation-copy");
      info.append(createElement("strong", "", displayName(user)), createElement("span", "conversation-preview", `${displayHandle(user)} · ${displayRole(user)}`));
      button.append(createAvatar(user), info);
      button.addEventListener("click", () => {
        chatSearchTerm = "";
        refs.chatSearch.value = "";
        openChatWith(user.id);
      });
      return button;
    }),
  );
}

function renderConversation(chat) {
  const other = otherParticipant(chat);
  const last = chat.messages.at(-1);
  const unread = unreadMessages(chat).length;
  const button = createElement("button", "conversation-item");
  button.type = "button";
  button.classList.toggle("active", chat.id === activeChatId);

  const copy = createElement("div", "conversation-copy");
  copy.append(
    createElement("strong", "", displayName(other)),
    createElement("span", "conversation-preview", conversationPreview(last)),
  );
  const meta = createElement("div", "conversation-meta");
  meta.append(createElement("span", "conversation-time", last ? relativeTime(last.createdAt) : ""));
  if (unread > 0) meta.append(createElement("span", "conversation-badge", String(unread)));
  button.append(createAvatar(other), copy, meta);
  button.addEventListener("click", () => {
    activeChatId = chat.id;
    renderChat();
  });
  return button;
}

function renderMessage(message, chat) {
  const me = currentId();
  const author = getUser(message.authorId);
  const isMine = message.authorId === me;
  const other = otherParticipant(chat);
  const isDeleted = Boolean(message.deletedAt);
  const item = createElement("article", `message ${isMine ? "mine" : ""} ${isDeleted ? "deleted" : ""}`);
  const meta = createElement("div", "message-meta");
  const status = isMine && (message.readBy || []).includes(other.id) ? "прочитано" : "доставлено";
  const edited = message.editedAt && !isDeleted ? " · ред." : "";
  meta.append(
    createElement("strong", "", isMine ? "Ви" : displayName(author)),
    createElement("span", "", `${relativeTime(message.createdAt)}${edited}${isMine ? ` · ${status}` : ""}`),
  );
  item.append(meta);

  if (isDeleted) {
    item.append(createElement("p", "message-text", "Повідомлення видалено"));
    return item;
  }

  if (message.text) item.append(createElement("p", "message-text", message.text));
  if (message.attachments?.length) {
    const attachments = createElement("div", "message-attachments");
    attachments.replaceChildren(...message.attachments.map(renderAttachment));
    item.append(attachments);
  }
  if (isMine) item.append(renderMessageActions(message.id));
  return item;
}

function conversationPreview(message) {
  if (!message) return "Новий діалог";
  if (message.deletedAt) return "Повідомлення видалено";
  if (message.text) return message.text;
  if (message.attachments?.length) return `Вкладення: ${message.attachments[0].name}`;
  return "Нове повідомлення";
}

function renderAttachment(attachment) {
  const wrap = createElement("a", "message-attachment");
  wrap.href = attachment.dataUrl;
  wrap.download = attachment.name;
  wrap.target = "_blank";
  wrap.rel = "noreferrer";
  if (attachment.type?.startsWith("image/")) {
    const image = document.createElement("img");
    image.src = attachment.dataUrl;
    image.alt = attachment.name;
    wrap.append(image);
  }
  const copy = createElement("span", "", `${attachment.name} · ${formatBytes(attachment.size)}`);
  wrap.append(copy);
  return wrap;
}

function renderMessageActions(messageId) {
  const actions = createElement("div", "message-actions");
  const edit = createElement("button", "", "Редагувати");
  edit.type = "button";
  edit.addEventListener("click", () => editMessage(messageId));
  const remove = createElement("button", "", "Видалити");
  remove.type = "button";
  remove.addEventListener("click", () => deleteMessage(messageId));
  actions.append(edit, remove);
  return actions;
}

function formatBytes(size) {
  if (!size) return "0 KB";
  if (size < 1024 * 1024) return `${Math.ceil(size / 1024)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function unreadMessages(chat) {
  const me = currentId();
  return chat.messages.filter((message) => message.authorId !== me && !(message.readBy || []).includes(me));
}

function markChatRead(chat, userId) {
  let changed = false;
  chat.messages.forEach((message) => {
    if (message.authorId === userId) return;
    message.readBy ||= [message.authorId];
    if (!message.readBy.includes(userId)) {
      message.readBy.push(userId);
      changed = true;
    }
  });
  state.notifications.forEach((notification) => {
    if (notification.userId === userId && notification.view === "chat" && chat.participants.includes(notification.actorId) && !notification.read) {
      notification.read = true;
      changed = true;
    }
  });
  return changed;
}

function setMessageFormEnabled(enabled) {
  refs.messageText.disabled = !enabled;
  refs.messageForm.querySelector("button[type='submit']").disabled = !enabled;
  refs.attachButton.disabled = !enabled;
}

function renderNotifications() {
  const items = state.notifications
    .filter((notification) => notification.userId === currentId())
    .sort((a, b) => b.createdAt - a.createdAt);

  refs.notificationList.replaceChildren(...items.map(renderNotification));
  if (items.length === 0) {
    refs.notificationList.append(createElement("div", "empty-state", "Тут поки тихо. Лайки, коментарі й чати з'являться тут."));
  }
}

function renderNotification(notification) {
  const actor = getUser(notification.actorId);
  const row = createElement("button", `notification ${notification.read ? "" : "unread"}`);
  row.type = "button";
  const dot = createElement("span", "notification-dot");
  const copy = createElement("div");
  copy.append(
    createElement("strong", "", displayName(actor)),
    createElement("p", "", notification.text),
    createElement("span", "", relativeTime(notification.createdAt)),
  );
  row.append(dot, createAvatar(actor), copy);
  row.addEventListener("click", () => {
    notification.read = true;
    if (notification.view === "profile") {
      activePersonId = notification.actorId;
      activeView = "person";
    } else {
      activeView = notification.view || "notifications";
    }
    saveState();
    renderApp();
  });
  return row;
}

function unreadNotifications() {
  return state.notifications.filter((notification) => notification.userId === currentId() && !notification.read);
}

function renderProfile() {
  const user = currentUser();
  refs.profileName.textContent = user.name;
  refs.profileMeta.textContent = `@${user.handle} · ${user.role} · ${user.location}${user.privateMode ? " · напіванонімно" : ""}`;
  refs.profileBio.textContent = user.bio;

  refs.profileForm.elements.name.value = user.name;
  refs.profileForm.elements.handle.value = user.handle;
  refs.profileForm.elements.role.value = user.role;
  refs.profileForm.elements.location.value = user.location;
  refs.profileForm.elements.bio.value = user.bio;
  refs.profileForm.elements.privateMode.checked = Boolean(user.privateMode);

  const followers = Object.values(state.following).filter((list) => list.includes(user.id)).length;
  const ownPostCount = state.posts.filter((post) => post.authorId === user.id).length;
  renderMetrics(refs.profileStats, [
    { value: ownPostCount, label: "постів" },
    { value: state.following[user.id]?.length || 0, label: "підписок" },
    { value: followers, label: "читачів" },
  ]);

  const posts = state.posts.filter((post) => post.authorId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  refs.profilePosts.replaceChildren(...posts.map(renderPost));
  if (posts.length === 0) {
    refs.profilePosts.append(createElement("div", "empty-state", "Ти ще нічого не публікував."));
  }
}

function renderPersonProfile() {
  const me = currentId();
  const user = getUser(activePersonId);
  if (!user || user.id === "missing" || user.id === me) {
    refs.personProfile.replaceChildren(createElement("div", "empty-state", "Вибери людину зі стрічки, чату або розділу “Люди”."));
    return;
  }

  const isFollowing = (state.following[me] || []).includes(user.id);
  const followers = Object.values(state.following).filter((list) => list.includes(user.id)).length;
  const posts = state.posts.filter((post) => post.authorId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  const publicBio = user.privateMode
    ? "Цей профіль у напіванонімному режимі: мінімум публічних даних, але приватний чат і підписка доступні."
    : user.bio;

  const profile = createElement("section", "person-profile");
  const cover = createElement("div", "profile-cover");
  const main = createElement("div", "profile-main");
  const copy = createElement("div");
  copy.append(
    createElement("h2", "", displayName(user)),
    createElement("p", "", `${displayHandle(user)} · ${displayRole(user)} · ${user.privateMode ? "приватність" : user.location}`),
    createElement("p", "", publicBio),
  );
  main.append(createAvatar(user, "avatar profile-avatar"), copy);
  profile.append(cover, main);

  const metrics = createElement("div", "metric-grid");
  renderMetrics(metrics, [
    { value: posts.length, label: "постів" },
    { value: state.following[user.id]?.length || 0, label: "підписок" },
    { value: followers, label: "читачів" },
  ]);

  const actions = createElement("div", "person-profile-actions");
  const follow = createElement("button", "follow-button", isFollowing ? "Читаю" : "Читати");
  follow.type = "button";
  follow.addEventListener("click", () => toggleFollow(user.id));
  const message = createElement("button", "message-button", "Написати приватно");
  message.type = "button";
  message.addEventListener("click", () => openChatWith(user.id));
  const back = createElement("button", "ghost-button", "До людей");
  back.type = "button";
  back.addEventListener("click", () => setView("discover"));
  actions.append(follow, message, back);

  profile.append(metrics, actions);

  const postsWrap = createElement("section");
  const head = createElement("div", "section-head");
  const headCopy = createElement("div");
  headCopy.append(createElement("h2", "", "Пости профілю"), createElement("p", "", user.privateMode ? "У напіванонімному режимі видимі лише публічні пости." : "Публікації цього автора."));
  head.append(headCopy);
  const list = createElement("div", "post-list");
  list.replaceChildren(...posts.map(renderPost));
  if (posts.length === 0) list.append(createElement("div", "empty-state", "У цього профілю поки немає постів."));
  postsWrap.append(head, list);

  const wrap = createElement("div", "profile-mini-grid");
  wrap.append(profile, postsWrap);
  refs.personProfile.replaceChildren(wrap);
}

function toggleLike(postId) {
  const me = currentId();
  const post = state.posts.find((item) => item.id === postId);
  if (!post) return;

  const index = post.likes.indexOf(me);
  if (index >= 0) {
    post.likes.splice(index, 1);
  } else {
    post.likes.push(me);
    if (post.authorId !== me) {
      addNotification(post.authorId, me, "лайкнув твій пост.", "feed");
    }
  }

  if (backendOnline) {
    apiFetch(`/api/posts/${postId}/likes`, {
      method: "POST",
      body: JSON.stringify({ userId: me }),
    }).catch(error => {
      console.error("Failed to update like:", error);
    });
  } else {
    saveState();
    renderApp();
  }
}

function toggleFollow(userId) {
  const me = currentId();
  const targetId = resolveUserId(userId);
  if (!targetId || targetId === me) return;
  const follows = state.following[me] || [];
  const index = follows.indexOf(targetId);
  if (index >= 0) {
    follows.splice(index, 1);
  } else {
    follows.push(targetId);
    addNotification(targetId, me, "почав читати твій профіль.", "profile");
  }
  state.following[me] = follows;

  if (backendOnline) {
    apiFetch("/api/follow", {
      method: "POST",
      body: JSON.stringify({ userId: me, targetId }),
    }).catch(error => {
      console.error("Failed to update follow:", error);
    });
  } else {
    saveState();
    renderApp();
  }
}

function addComment(postId, text) {
  const cleanText = text.trim();
  if (!cleanText) return;

  const post = state.posts.find((item) => item.id === postId);
  if (!post) return;

  post.comments.push({
    id: uid("comment"),
    authorId: currentId(),
    text: cleanText,
    createdAt: Date.now(),
  });
  if (post.authorId !== currentId()) {
    addNotification(post.authorId, currentId(), "прокоментував твій пост.", "feed");
  }

  if (backendOnline) {
    apiFetch(`/api/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({
        authorId: currentId(),
        text: cleanText,
      }),
    }).catch(error => {
      console.error("Failed to create comment:", error);
    });
  } else {
    saveState();
    renderApp();
  }
}

function openChatWith(userId) {
  const chat = ensureChatWith(userId);
  if (!chat) return;
  activeChatId = chat.id;
  activeView = "chat";
  saveState();
  renderApp();
}

function openProfile(userId) {
  const targetId = resolveUserId(userId);
  if (targetId === currentId()) {
    activeView = "profile";
  } else {
    activePersonId = targetId || userId;
    activeView = "person";
  }
  renderApp();
}

function ensureChatWith(userId) {
  const me = currentId();
  const targetId = resolveUserId(userId);
  if (!targetId || targetId === me) return null;
  let chat = state.chats.find((item) => item.participants.includes(me) && item.participants.includes(targetId));
  if (!chat) {
    chat = {
      id: uid("chat"),
      participants: [me, targetId],
      messages: [],
    };
    state.chats.push(chat);
  }
  return chat;
}

function sendMessage(text) {
  const cleanText = text.trim();
  const chat = state.chats.find((item) => item.id === activeChatId);
  if ((!cleanText && !selectedAttachment) || !chat) return;

  const me = currentId();
  const other = otherParticipant(chat);
  const attachments = selectedAttachment ? [selectedAttachment] : [];
  chat.messages.push({
    id: uid("message"),
    authorId: me,
    text: cleanText,
    attachments,
    createdAt: Date.now(),
    editedAt: 0,
    deletedAt: 0,
    readBy: [me],
  });
  clearAttachment();
  setTyping(false);
  addNotification(other.id, me, "написав тобі в чаті.", "chat");

  if (backendOnline) {
    apiFetch("/api/messages", {
      method: "POST",
      body: JSON.stringify({
        chatId: activeChatId,
        authorId: me,
        text: cleanText,
        participantIds: chat.participants,
        attachments,
      }),
    }).catch(error => {
      console.error("Failed to send message:", error);
    });
  } else {
    saveState();
    renderApp();
  }
}

function findMessage(messageId) {
  for (const chat of state.chats) {
    const message = chat.messages.find((item) => item.id === messageId);
    if (message) return { chat, message };
  }
  return {};
}

function editMessage(messageId) {
  const { message } = findMessage(messageId);
  if (!message || message.authorId !== currentId() || message.deletedAt) return;

  const nextText = window.prompt("Оновити повідомлення", message.text || "");
  if (nextText === null) return;
  const cleanText = nextText.trim();
  if (!cleanText && !message.attachments?.length) return;

  message.text = cleanText;
  message.editedAt = Date.now();
  saveState();
  renderApp();
}

function deleteMessage(messageId) {
  const { message } = findMessage(messageId);
  if (!message || message.authorId !== currentId() || message.deletedAt) return;
  if (!window.confirm("Видалити це повідомлення?")) return;

  message.text = "";
  message.attachments = [];
  message.deletedAt = Date.now();
  saveState();
  renderApp();
}

function setTyping(isTyping) {
  const user = currentUser();
  if (!user) return;
  user.typingChatId = isTyping ? activeChatId : "";
  user.typingAt = isTyping ? Date.now() : 0;
  saveState();
}

function scheduleTypingStop() {
  window.clearTimeout(typingTimer);
  typingTimer = window.setTimeout(() => setTyping(false), 2600);
}

function handleAttachmentFile(file) {
  if (!file) return;
  if (file.size > 2 * 1024 * 1024) {
    refs.authMessage.textContent = "Файл завеликий для демо-чату. Максимум 2 MB.";
    refs.attachmentInput.value = "";
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    selectedAttachment = {
      id: uid("file"),
      name: file.name,
      type: file.type || "application/octet-stream",
      size: file.size,
      dataUrl: reader.result,
    };
    renderAttachmentPreview();
  });
  reader.readAsDataURL(file);
}

function clearAttachment() {
  selectedAttachment = null;
  refs.attachmentInput.value = "";
  renderAttachmentPreview();
}

function renderAttachmentPreview() {
  if (!selectedAttachment) {
    refs.attachmentPreview.classList.add("hidden");
    refs.attachmentPreview.replaceChildren();
    return;
  }

  const copy = createElement("div");
  copy.append(
    createElement("strong", "", selectedAttachment.name),
    createElement("span", "", formatBytes(selectedAttachment.size)),
  );
  const remove = createElement("button", "ghost-button small", "Прибрати");
  remove.type = "button";
  remove.addEventListener("click", clearAttachment);
  refs.attachmentPreview.classList.remove("hidden");
  refs.attachmentPreview.replaceChildren(copy, remove);
}

function addNotification(userId, actorId, text, view) {
  if (userId === actorId) return;
  state.notifications.push({
    id: uid("notification"),
    userId,
    actorId,
    text,
    view,
    read: false,
    createdAt: Date.now(),
  });
}

function setView(view) {
  activeView = view;
  renderApp();
}

function showAuthPanel(panel) {
  refs.authTabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.authTab === panel));
  refs.authForms.forEach((form) => form.classList.toggle("hidden", form.dataset.authPanel !== panel));
  refs.authMessage.textContent = "";
}

async function signIn(handle, password) {
  const normalized = normalizeHandle(handle);
  let user = state.users.find((item) => item.handle === normalized || item.id === normalized);

  if (backendOnline) {
    try {
      const data = await apiFetch("/api/login", {
        method: "POST",
        body: JSON.stringify({ handle: normalized, password }),
      });
      state = normalizeState({ ...data.state, sessionUserId: data.user.id, theme: state.theme });
      user = getUser(data.user.id);
      saveState({ sync: false });
      renderApp();
      return;
    } catch {
      // Fall back to local auth below.
    }
  }

  if (!user || user.password !== password) {
    refs.authMessage.textContent = "Невірний логін або пароль.";
    return;
  }

  state.sessionUserId = user.id;
  user.lastSeenAt = Date.now();
  saveState();
  renderApp();
}

async function registerUser(formData) {
  const name = formData.get("name").trim();
  const handle = normalizeHandle(formData.get("handle"));
  const password = formData.get("password");
  const inviteCode = (formData.get("inviteCode") || "").trim();

  if (!name || !handle || !password) {
    refs.authMessage.textContent = "Заповни всі поля.";
    return;
  }

  if (handle.length < 3) {
    refs.authMessage.textContent = "Нікнейм має містити мінімум 3 символи.";
    return;
  }

  if (inviteCode !== INVITE_CODE) {
    refs.authMessage.textContent = "Невірний код запрошення.";
    return;
  }

  const exists = state.users.some((user) => user.handle === handle || user.id === handle);
  if (exists) {
    refs.authMessage.textContent = "Такий нікнейм уже зайнятий.";
    return;
  }

  if (backendOnline) {
    try {
      const data = await apiFetch("/api/register", {
        method: "POST",
        body: JSON.stringify({ name, handle, password, inviteCode }),
      });
      state = normalizeState({ ...data.state, sessionUserId: data.user.id, theme: state.theme });
      saveState({ sync: false });
      renderApp();
      return;
    } catch (error) {
      refs.authMessage.textContent = error.message || "Не вдалося створити акаунт.";
      return;
    }
  }

  const user = {
    id: handle,
    name,
    handle,
    password,
    role: "Member",
    location: "Online",
    bio: "Новий користувач Pulse.",
    skills: ["Pulse"],
    privateMode: false,
    lastSeenAt: Date.now(),
    joinedAt: Date.now(),
  };

  state.users.push(user);
  state.following[user.id] = [];
  state.sessionUserId = user.id;
  saveState();
  renderApp();
}

function updateProfile(formData) {
  const user = currentUser();
  const handle = normalizeHandle(formData.get("handle"));
  const duplicate = state.users.some((item) => item.handle.toLowerCase() === handle.toLowerCase() && item.id !== user.id);

  if (handle.length < 3) {
    refs.profileMessage.textContent = "Нікнейм має містити мінімум 3 символи.";
    return;
  }
  if (duplicate) {
    refs.profileMessage.textContent = "Такий нікнейм уже зайнятий.";
    return;
  }

  user.name = formData.get("name").trim() || user.name;
  user.handle = handle;
  user.role = formData.get("role").trim() || "Member";
  user.location = formData.get("location").trim() || "Online";
  user.bio = formData.get("bio").trim() || "Новий користувач Pulse.";
  user.privateMode = formData.get("privateMode") === "on";

  refs.profileMessage.textContent = "Профіль збережено.";
  saveState();
  renderApp();
}

refs.navItems.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

refs.feedFilters.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-feed-mode]");
  if (!button) return;
  feedMode = button.dataset.feedMode;
  renderApp();
});

refs.searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value.trim();
  renderApp();
});

refs.clearSearch.addEventListener("click", () => {
  searchTerm = "";
  refs.searchInput.value = "";
  renderApp();
});

refs.chatSearch.addEventListener("input", (event) => {
  chatSearchTerm = event.target.value.trim();
  renderChat();
});

refs.ideaShortcut.addEventListener("click", () => {
  activeView = "feed";
  refs.postMood.value = "idea";
  renderApp();
  refs.postText.focus();
});

refs.themeToggle.addEventListener("click", () => {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveState();
  renderApp();
});

refs.logoutButton.addEventListener("click", () => {
  setTyping(false);
  state.sessionUserId = "";
  saveState();
  renderApp();
});

refs.authTabs.forEach((button) => {
  button.addEventListener("click", () => showAuthPanel(button.dataset.authTab));
});

refs.loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(refs.loginForm);
  signIn(formData.get("handle"), formData.get("password"));
});

refs.registerForm.addEventListener("submit", (event) => {
  event.preventDefault();
  registerUser(new FormData(refs.registerForm));
});

refs.demoLogin.addEventListener("click", () => {
  signIn("yaroslav", "demo123");
});

refs.postForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = refs.postText.value.trim();
  if (!text || !currentUser()) {
    refs.authMessage.textContent = "Спочатку зайди в акаунт.";
    return;
  }

  refs.postText.value = "";
  refs.charCount.textContent = "0/360";
  feedMode = "all";
  activeView = "feed";

  if (backendOnline) {
    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({
          authorId: currentId(),
          text,
          tags: extractTags(text),
          mood: refs.postMood.value,
        }),
      });
    } catch (error) {
      console.error("Failed to create post:", error);
      // Fall back to local state
      state.posts.unshift({
        id: uid("post"),
        authorId: currentId(),
        text,
        tags: extractTags(text),
        mood: refs.postMood.value,
        likes: [],
        comments: [],
        createdAt: Date.now(),
      });
      saveState();
    }
  } else {
    state.posts.unshift({
      id: uid("post"),
      authorId: currentId(),
      text,
      tags: extractTags(text),
      mood: refs.postMood.value,
      likes: [],
      comments: [],
      createdAt: Date.now(),
    });
    saveState();
  }
  
  setTimeout(() => renderApp(), 0);
});

refs.postText.addEventListener("input", () => {
  refs.charCount.textContent = `${refs.postText.value.length}/360`;
});

refs.messageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(refs.messageText.value);
  refs.messageText.value = "";
  refs.messageCount.textContent = "0/500";
});

refs.messageText.addEventListener("input", () => {
  refs.messageCount.textContent = `${refs.messageText.value.length}/500`;
  if (activeChatId && refs.messageText.value.trim()) {
    setTyping(true);
    scheduleTypingStop();
  } else {
    setTyping(false);
  }
});

refs.attachButton.addEventListener("click", () => {
  refs.attachmentInput.click();
});

refs.attachmentInput.addEventListener("change", () => {
  handleAttachmentFile(refs.attachmentInput.files?.[0]);
});

refs.markRead.addEventListener("click", () => {
  state.notifications.forEach((notification) => {
    if (notification.userId === currentId()) notification.read = true;
  });
  saveState();
  renderApp();
});

refs.profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateProfile(new FormData(refs.profileForm));
});

initializeApp();
