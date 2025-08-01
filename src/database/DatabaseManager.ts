import * as SQLite from "expo-sqlite"
import { DATABASE_SETUP_STATEMENTS } from "./database"

// Interfaces
export interface Note {
  id: number
  title: string
  content: string
  timestamp: number
  tags: string[]
  hasAudio: boolean
  hasImages: boolean
  audioPath?: string
  imagePaths?: string[]
}

export interface User {
  id: number
  name: string
  createdAt: number
}

export interface ChatSession {
  id: number
  user_id: number
  startedAt: number
}

export interface Message {
  id: number
  session_id: number
  type: "user" | "assistant"
  content: string
  timestamp: number
  notes?: Note[]
  hasImages: boolean
  imagePaths?: string[]
}

export type CreateTableStatement = {
  tableName: string
  columns: string[]
}

export class DatabaseManager {
  private static instance: DatabaseManager
  private db: SQLite.SQLiteDatabase | null = null

  private constructor() {}

  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  // Initialize database
  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync("memory_vault.db")
      await this.createTables()
    } catch (error) {
      throw error
    }
  }

  // Create database tables
  private async createTables(): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")

    for (const statement of DATABASE_SETUP_STATEMENTS) {
      const columns = statement.columns.join(", ")
      const query = `CREATE TABLE IF NOT EXISTS ${statement.tableName} (${columns});`
      await this.db.execAsync(query)
    }

    await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_notes_timestamp ON notes(timestamp);`)
    await this.db.execAsync(`CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);`)
  }

  // User operations
  async createUser(name: string, email?: string): Promise<User> {
    if (!this.db) throw new Error("Database not initialized")

    const createdAt = Date.now()
    const result = await this.db.runAsync("INSERT INTO users (name, createdAt) VALUES (?, ?, ?)", [
      name,
      createdAt,
    ])

    return {
      id: result.lastInsertRowId,
      name,
      createdAt,
    }
  }

  async getUser(): Promise<User | null> {
    if (!this.db) throw new Error("Database not initialized")
    const result = await this.db.getFirstAsync<User>("SELECT * FROM users LIMIT 1")
    return result || null
  }

  // Note operations
  private parseNote(row: any): Note {
    return {
      id: row.id,
      title: row.title,
      content: row.content,
      timestamp: row.timestamp,
      tags: JSON.parse(row.tags || "[]"),
      hasAudio: !!row.has_audio,
      hasImages: !!row.has_images,
      audioPath: row.audio_path,
      imagePaths: JSON.parse(row.image_paths || "[]"),
    }
  }

  // Message operations
  private parseMessage(row: any): Omit<Message, 'notes'> {
    return {
      id: row.id,
      session_id: row.session_id,
      type: row.type,
      content: row.content,
      timestamp: row.timestamp,
      hasImages: !!row.has_images,
      imagePaths: JSON.parse(row.image_paths || "[]"),
    }
  }

  async createNote(note: Omit<Note, "id">): Promise<Note> {
    if (!this.db) throw new Error("Database not initialized")

    const result = await this.db.runAsync(
      `INSERT INTO notes (title, content, timestamp, tags, has_audio, has_images, audio_path, image_paths) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        note.title,
        note.content,
        note.timestamp,
        JSON.stringify(note.tags),
        note.hasAudio ? 1 : 0,
        note.hasImages ? 1 : 0,
        note.audioPath || null,
        JSON.stringify(note.imagePaths || []),
      ],
    )

    return { id: result.lastInsertRowId, ...note }
  }

  async updateNote(note: Note): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")
    await this.db.runAsync(
      `UPDATE notes SET title = ?, content = ?, timestamp = ?, tags = ?, has_audio = ?, 
       has_images = ?, audio_path = ?, image_paths = ? WHERE id = ?`,
      [
        note.title,
        note.content,
        note.timestamp,
        JSON.stringify(note.tags),
        note.hasAudio ? 1 : 0,
        note.hasImages ? 1 : 0,
        note.audioPath || null,
        JSON.stringify(note.imagePaths || []),
        note.id,
      ],
    )
  }

  async getAllNotes(): Promise<Note[]> {
    if (!this.db) throw new Error("Database not initialized")
    const rows = await this.db.getAllAsync<any>("SELECT * FROM notes ORDER BY timestamp DESC")
    return rows.map(this.parseNote)
  }

  async getNoteById(id: number): Promise<Note | null> {
    if (!this.db) throw new Error("Database not initialized")
    const row = await this.db.getFirstAsync<any>("SELECT * FROM notes WHERE id = ?", [id])
    return row ? this.parseNote(row) : null
  }

  async getNotesByIds(ids: number[]): Promise<Note[]> {
    if (!this.db) throw new Error("Database not initialized")
    if (ids.length === 0) return []

    const placeholders = ids.map(() => "?").join(", ")
    const query = `SELECT * FROM notes WHERE id IN (${placeholders})`
    const rows = await this.db.getAllAsync<any>(query, ids)
    return rows.map(this.parseNote)
  }

  async searchNotes(query: string): Promise<Note[]> {
    if (!this.db) throw new Error("Database not initialized")
    const searchQuery = `%${query}%`
    const rows = await this.db.getAllAsync<any>(
      "SELECT * FROM notes WHERE title LIKE ? OR content LIKE ? OR tags LIKE ? ORDER BY timestamp DESC",
      [searchQuery, searchQuery, searchQuery],
    )
    return rows.map(this.parseNote)
  }

  async deleteNote(id: number): Promise<void> {
    if (!this.db) throw new Error("Database not initialized")
    await this.db.runAsync("DELETE FROM notes WHERE id = ?", [id])
  }

  // Chat operations
  async getOrCreateChatSession(userId: number): Promise<ChatSession> {
    if (!this.db) throw new Error("Database not initialized")

    let session = await this.db.getFirstAsync<ChatSession>(
      "SELECT * FROM chat_sessions WHERE user_id = ? ORDER BY startedAt DESC LIMIT 1",
      [userId],
    )

    if (!session) {
      const startedAt = Date.now()
      const result = await this.db.runAsync("INSERT INTO chat_sessions (user_id, startedAt) VALUES (?, ?)", [
        userId,
        startedAt,
      ])
      session = {
        id: result.lastInsertRowId,
        user_id: userId,
        startedAt,
      }
    }

    return session
  }

  async saveMessage(
    sessionId: number,
    type: "user" | "assistant",
    content: string,
    noteIds: number[] = [],
    imagePaths: string[] = [],
  ): Promise<Message> {
    if (!this.db) throw new Error("Database not initialized")

    const timestamp = Date.now()
    const notesJson = JSON.stringify(noteIds)
    const hasImages = imagePaths.length > 0
    const imagePathsJson = JSON.stringify(imagePaths)

    const result = await this.db.runAsync(
      "INSERT INTO messages (session_id, type, content, timestamp, notes, has_images, image_paths) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [sessionId, type, content, timestamp, notesJson, hasImages ? 1 : 0, imagePathsJson],
    )

    const notes = await this.getNotesByIds(noteIds)

    return {
      id: result.lastInsertRowId,
      session_id: sessionId,
      type,
      content,
      timestamp,
      notes,
      hasImages,
      imagePaths,
    }
  }

  async getMessagesForSession(sessionId: number): Promise<Message[]> {
    if (!this.db) throw new Error("Database not initialized")

    const dbMessages = await this.db.getAllAsync<any>(
      "SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp ASC",
      [sessionId],
    )

    const messages: Message[] = []
    for (const dbMessage of dbMessages) {
      const noteIds = JSON.parse(dbMessage.notes || "[]")
      const notes = noteIds.length > 0 ? await this.getNotesByIds(noteIds) : []
      const parsedMessage = this.parseMessage(dbMessage)
      messages.push({
        ...parsedMessage,
        notes,
      })
    }

    return messages
  }

  // AI context
  async getNotesForAIContext(): Promise<string> {
    const notes = await this.getAllNotes()
    if (notes.length === 0) {
      return "The user has not created any memories yet. Encourage them to create their first one!"
    }

    return notes
      .map((note) => {
        const timestamp = new Date(note.timestamp).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
        const tags = note.tags.length > 0 ? `Tags: ${note.tags.join(", ")}` : ""
        const media = []
        if (note.hasImages) {
          const imageCount = note.imagePaths?.length || 0
          media.push(`This note has ${imageCount} image(s) that could be compared with user-shared images.`)
        }
        if (note.hasAudio) media.push("This note has an audio recording.")

        return `\n[Note ID: ${note.id}]\nOn ${timestamp}, the user recorded a memory titled "${note.title}".\nContent: ${note.content}\n${tags}\n${media.join(" ")}\n      `.trim()
      })
      .join("\n\n---\n\n")
  }
}
