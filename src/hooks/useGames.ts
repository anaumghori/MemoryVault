import { useState, useCallback } from "react"
import { DatabaseManager, Note } from "../database/DatabaseManager"
import SimplifiedGemmaBridge from "../lib/GemmaBridge"
import { useGemmaModel } from "../lib/hooks"

export interface QuizQuestion {
  id: number
  question: string
  correctAnswer: string
  relatedNoteId: number
  userAnswer?: string
  isCorrect?: boolean
  feedback?: string
}

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
  const [currentQuiz, setCurrentQuiz] = useState<QuizQuestion[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [quizScore, setQuizScore] = useState(0)
  const [isQuizLoading, setIsQuizLoading] = useState(false)
  const [quizError, setQuizError] = useState<string | null>(null)

  const [currentMemoryGame, setCurrentMemoryGame] = useState<MemoryCompletion | null>(null)
  const [isMemoryLoading, setIsMemoryLoading] = useState(false)
  const [memoryError, setMemoryError] = useState<string | null>(null)

  const { isLoaded, loadModel } = useGemmaModel()
  const dbManager = DatabaseManager.getInstance()

  const generateQuiz = useCallback(async (questionCount: number = 5) => {
    setIsQuizLoading(true)
    setQuizError(null)
    
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
        throw new Error("No memories found to create quiz questions. Please add some memories first!")
      }

      const notesContext = await dbManager.getNotesForAIContext()
      
      const prompt = `
You are an AI quiz master creating memory-based quiz questions from the user's personal notes.

**Instructions:**
1. Create ${questionCount} quiz questions based on the user's memories
2. Questions should be personal and about specific details from their notes
3. Each question should test recall of specific events, people, places, or feelings
4. Provide the correct answer for each question
5. Include the note ID that the question relates to
6. Make questions engaging and meaningful, not just factual recall

**Response Format:** Return a JSON object with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Your quiz question here?",
      "correctAnswer": "The correct answer",
      "relatedNoteId": 123
    }
  ]
}

**Available Notes (Memories):**
${notesContext}

**Your JSON Response:**
`

      // Use SimplifiedGemmaBridge instead of ModelManager
      const rawResponse = await SimplifiedGemmaBridge.generateResponse(prompt)
      const cleanedResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim()
      const parsedResponse = JSON.parse(cleanedResponse)
      
      const questions: QuizQuestion[] = parsedResponse.questions.map((q: any, index: number) => ({
        id: index + 1,
        question: q.question,
        correctAnswer: q.correctAnswer,
        relatedNoteId: q.relatedNoteId
      }))

      setCurrentQuiz(questions)
      setCurrentQuestionIndex(0)
      setQuizScore(0)
    } catch (error) {
      
      setQuizError(error instanceof Error ? error.message : "Failed to generate quiz questions")
    } finally {
      setIsQuizLoading(false)
    }
  }, [isLoaded, loadModel])

  const submitQuizAnswer = useCallback(async (answer: string) => {
    if (currentQuestionIndex >= currentQuiz.length) return

    const currentQuestion = currentQuiz[currentQuestionIndex]
    
    try {
      // Load model if not loaded
      if (!isLoaded) {
        
        const loaded = await loadModel()
        if (!loaded) {
          throw new Error("Failed to load model")
        }
      }

      // Use AI to evaluate the answer with empathy
      const prompt = `
You are an empathetic AI tutor evaluating a quiz answer.

**Question:** ${currentQuestion.question}
**Correct Answer:** ${currentQuestion.correctAnswer}
**User's Answer:** ${answer}

**Instructions:**
1. Determine if the user's answer is essentially correct (even if not word-for-word)
2. Provide warm, encouraging feedback
3. If correct: celebrate and uplift the user
4. If incorrect: be gentle, provide the correct answer, and encourage them

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

      const updatedQuestion = {
        ...currentQuestion,
        userAnswer: answer,
        isCorrect: evaluation.isCorrect,
        feedback: evaluation.feedback
      }

      const updatedQuiz = [...currentQuiz]
      updatedQuiz[currentQuestionIndex] = updatedQuestion
      setCurrentQuiz(updatedQuiz)

      if (evaluation.isCorrect) {
        setQuizScore(prev => prev + 1)
      }

    } catch (error) {
      
    }
  }, [currentQuiz, currentQuestionIndex, isLoaded, loadModel])

  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, currentQuiz.length])

  const resetQuiz = useCallback(() => {
    setCurrentQuiz([])
    setCurrentQuestionIndex(0)
    setQuizScore(0)
    setQuizError(null)
  }, [])

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
    // Quiz state
    currentQuiz,
    currentQuestionIndex,
    quizScore,
    isQuizLoading,
    quizError,
    
    // Quiz actions
    generateQuiz,
    submitQuizAnswer,
    nextQuestion,
    resetQuiz,
    
    // Memory completion state
    currentMemoryGame,
    isMemoryLoading,
    memoryError,
    
    // Memory completion actions
    generateMemoryCompletion,
    submitMemoryCompletion,
    resetMemoryGame,
    
    // Computed values
    isQuizComplete: currentQuestionIndex >= currentQuiz.length && currentQuiz.length > 0,
    currentQuestion: currentQuiz[currentQuestionIndex] || null,
    quizProgress: currentQuiz.length > 0 ? ((currentQuestionIndex + 1) / currentQuiz.length) * 100 : 0
  }
}