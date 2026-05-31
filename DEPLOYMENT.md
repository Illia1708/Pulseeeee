# Pulse Beta: безкоштовна публікація для тесту

Pulse зараз готовий як закрита beta для друзів: один Node.js сервер віддає frontend, REST API і WebSocket.

## 1. Перевір локально

```bash
npm install
npm start
```

Відкрий:

```text
http://localhost:3000
```

Демо-акаунт:

```text
yaroslav / demo123
```

## 2. Опублікуй код на GitHub

```bash
git add .
git commit -m "Prepare Pulse beta deploy"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pulse.git
git push -u origin main
```

Якщо `remote origin` вже існує:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/pulse.git
git push -u origin main
```

## 3. Безкоштовний хостинг для тесту

### Рекомендовано: Koyeb Free

Плюси:
- один безкоштовний web service;
- підходить для Node.js + WebSocket;
- дає публічний HTTPS URL.

Кроки:
1. Створи акаунт на `https://www.koyeb.com`.
2. Create App -> GitHub.
3. Вибери репозиторій `pulse`.
4. Instance type: `Free`.
5. Build command: залиш порожнім або `npm install`.
6. Run command: `npm start`.
7. Port: `3000`.
8. Deploy.

Після деплою отримаєш URL на кшталт:

```text
https://pulse-YOURNAME.koyeb.app
```

### Альтернатива: Render Free

Кроки:
1. Створи акаунт на `https://render.com`.
2. New -> Web Service.
3. Підключи GitHub репозиторій.
4. Runtime: Node.
5. Build command: `npm install`.
6. Start command: `npm start`.
7. Instance type: Free.
8. Deploy.

Render Free може засинати після простою, тому перший запуск інколи займає близько хвилини.

## 4. Важливе обмеження beta

Зараз дані зберігаються у `backend/db.json`. Це нормально для першого тесту з друзями, але на free-хостингах локальна файлова система може очищатися після рестарту, redeploy або scale-to-zero.

Для справжньої соцмережі наступний крок:
- PostgreSQL замість `db.json`;
- хешування паролів;
- JWT/session tokens;
- нормальне зберігання файлів;
- резервні копії.

## 5. Мінімальна безпека перед тим, як дати друзям

У хостингу додай environment variables:

```text
INVITE_CODE=твій-секретний-код
NODE_ENV=production
```

Після цього реєстрація працюватиме тільки з твоїм кодом.
