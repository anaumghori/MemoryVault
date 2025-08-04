import { useState, useCallback } from "react"
import { DatabaseManager, Note } from "../database/DatabaseManager"
import SimplifiedGemmaBridge from "../lib/GemmaBridge"
import { useGemmaModel } from "../lib/hooks"

export interface MemoryCompletion {
  id: number
  note: Note
  partialMemory: string
  expectedCompletion: string
  userCompletion?: string
  isCorrect?: boolean
  feedback?: string
}

export const useGames = () => {
  const [currentMemoryGame, setCurrentMemoryGame] = useState<MemoryCompletion | null>(null)
  const [isMemoryLoading, setIsMemoryLoading] = useState(false)
  const [memoryError, setMemoryError] = useState<string | null>(null)

  const { isLoaded, loadModel } = useGemmaModel()
  const dbManager = DatabaseManager.getInstance()

  const generateMemoryCompletion = useCallback(async () => {
    setIsMemoryLoading(true)
    setMemoryError(null)
    
    try {
      // Load model if not loaded
      if (!isLoaded) {
        
        const loaded = await loadModel()
        if (!loaded) {
          throw new Error("Failed to load model")
        }
      }

      const notes = await dbManager.getAllNotes()
      if (notes.length === 0) {
        throw new Error("No memories found to create completion game. Please add some memories first!")
      }

      // Select a random note
      const randomNote = notes[Math.floor(Math.random() * notes.length)]
      
      const prompt = `
You are creating a memory completion game from the user's personal note.

**Instructions:**
1. Take the provided memory and create a partial version (show about 60-70% of it)
2. Hide a meaningful part that the user should remember
3. Provide the expected completion text
4. Make it engaging and test meaningful recall

**Note Title:** ${randomNote.title}
**Note Content:** ${randomNote.content}

**Response Format:** Return a JSON object:
{
  "partialMemory": "The partial memory with [___] where completion should go",
  "expectedCompletion": "The text that should complete the memory"
}

**Your JSON Response:**
`

      // Use SimplifiedGemmaBridge instead of ModelManager
      const rawResponse = await SimplifiedGemmaBridge.generateResponse(prompt)
      const cleanedResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim()
      const parsedResponse = JSON.parse(cleanedResponse)

      const memoryGame: MemoryCompletion = {
        id: Date.now(),
        note: randomNote,
        partialMemory: parsedResponse.partialMemory,
        expectedCompletion: parsedResponse.expectedCompletion
      }

      setCurrentMemoryGame(memoryGame)
    } catch (error) {
      
      setMemoryError(error instanceof Error ? error.message : "Failed to generate memory completion game")
    } finally {
      setIsMemoryLoading(false)
    }
  }, [isLoaded, loadModel])

  const submitMemoryCompletion = useCallback(async (completion: string) => {
    if (!currentMemoryGame) return

    try {
      // Load model if not loaded
      if (!isLoaded) {
        
        const loaded = await loadModel()
        if (!loaded) {
          throw new Error("Failed to load model")
        }
      }

      const prompt = `
You are an empathetic AI tutor evaluating a memory completion.

**Original Memory:** ${currentMemoryGame.note.content}
**Expected Completion:** ${currentMemoryGame.expectedCompletion}
**User's Completion:** ${completion}

**Instructions:**
1. Determine if the user's completion captures the essence of the expected completion
2. Be generous - look for meaning rather than exact words
3. Provide warm, encouraging feedback
4. If correct: celebrate their memory
5. If incorrect: be gentle and show what they might have remembered

**Response Format:** Return a JSON object:
{
  "isCorrect": true/false,
  "feedback": "Your warm, encouraging response here"
}

**Your JSON Response:**
`

      // Use SimplifiedGemmaBridge instead of ModelManager
      const rawResponse = await SimplifiedGemmaBridge.generateResponse(prompt)
      const cleanedResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim()
      const evaluation = JSON.parse(cleanedResponse)

      const updatedMemoryGame = {
        ...currentMemoryGame,
        userCompletion: completion,
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback
      }

      setCurrentMemoryGame(updatedMemoryGame)
    } catch (error) {
      
    }
  }, [currentMemoryGame, isLoaded, loadModel])

  const resetMemoryGame = useCallback(() => {
    setCurrentMemoryGame(null)
    setMemoryError(null)
  }, [])

  return {
    // Memory completion state
    currentMemoryGame,
    isMemoryLoading,
    memoryError,
    
    // Memory completion actions
    generateMemoryCompletion,
    submitMemoryCompletion,
    resetMemoryGame
  }
}