import { CreateTableStatement } from "./DatabaseManager"

export const DATABASE_SETUP_STATEMENTS: CreateTableStatement[] = [
  {
    tableName: "users",
    columns: [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "name TEXT NOT NULL",
      "email TEXT UNIQUE",
      "createdAt INTEGER NOT NULL",
    ],
  },
  {
    tableName: "notes",
    columns: [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "title TEXT NOT NULL",
      "content TEXT NOT NULL",
      "timestamp INTEGER NOT NULL",
      "tags TEXT DEFAULT '[]'",
      "has_audio BOOLEAN DEFAULT 0",
      "has_images BOOLEAN DEFAULT 0",
      "audio_path TEXT",
      "image_paths TEXT DEFAULT '[]'",
    ],
  },
  {
    tableName: "chat_sessions",
    columns: [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "user_id INTEGER NOT NULL",
      "startedAt INTEGER NOT NULL",
      "FOREIGN KEY(user_id) REFERENCES users(id)",
    ],
  },
  {
    tableName: "messages",
    columns: [
      "id INTEGER PRIMARY KEY AUTOINCREMENT",
      "session_id INTEGER NOT NULL",
      "type TEXT NOT NULL CHECK(type IN ('user', 'assistant'))",
      "content TEXT NOT NULL",
      "timestamp INTEGER NOT NULL",
      "notes TEXT",
      "has_images BOOLEAN DEFAULT 0",
      "image_paths TEXT DEFAULT '[]'",
      "FOREIGN KEY(session_id) REFERENCES chat_sessions(id)",
    ],
  },
]