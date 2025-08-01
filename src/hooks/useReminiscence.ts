import { useState, useCallback } from "react"
import { Alert } from "react-native"
import { DatabaseManager } from "../database/DatabaseManager"
import SimplifiedGemmaBridge from "../lib/GemmaBridge"
import { useGemmaModel } from "../lib/hooks"

// Remove the old ModelManager import and ReminiscenceSession interface, define it locally
export interface ReminiscenceSession {
  title: string;
  narrative: string;
  notes: any[];
  promptingQuestions: string[];
}

export const useReminiscence = () => {
  const [session, setSession] = useState<ReminiscenceSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isLoaded, loadModel } = useGemmaModel()

  const generateSession = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load model if not loaded
      if (!isLoaded) {
        
        const loaded = await loadModel()
        if (!loaded) {
          throw new Error("Could not load the AI model.")
        }
      }

      const dbManager = DatabaseManager.getInstance()
      const notes = await dbManager.getAllNotes()

      if (notes.length < 3) {
        setError("You need at least 3 memories to create a reminiscence session. Keep adding memories!")
        setSession(null)
        setIsLoading(false)
        return
      }

      const notesContext = await dbManager.getNotesForAIContext()

      const prompt = `
You are an expert in reminiscence therapy. Your task is to create a themed "memory album" from the user's notes.

**Instructions:**
1.  Analyze the user's notes to find a recurring theme (e.g., "Family Gatherings," "Travels," "Childhood Pets," "Summer Holidays").
2.  Select 3-5 notes that strongly relate to this theme.
3.  Create a title for the session based on the theme.
4.  Write a gentle, story-like narrative that weaves the selected notes together. The narrative should be warm, engaging, and feel like a story.
5.  Generate 2-3 thoughtful, open-ended questions to prompt the user for reflection.
6.  Your response MUST be a JSON object with the following structure:
    {
      "title": "Your themed title here.",
      "narrative": "Your story-like narrative here.",
      "notes": [
        { "id": 1, "title": "Note Title 1" },
        { "id": 5, "title": "Note Title 2" }
      ],
      "promptingQuestions": [
        "Your first question here.",
        "Your second question here."
      ]
    }

**Available Notes (Memories):**
${notesContext}

**Your JSON Response:**
`
      // Use SimplifiedGemmaBridge instead of ModelManager
      const rawResponse = await SimplifiedGemmaBridge.generateResponse(prompt)
      const cleanedResponse = rawResponse.replace(/```json/g, "").replace(/```/g, "").trim()
      const generatedSession = JSON.parse(cleanedResponse)


      if (generatedSession && generatedSession.notes.length > 0) {
        const noteIds = generatedSession.notes.map((n: any) => n.id)
        const fullNotes = await dbManager.getNotesByIds(noteIds)

        // Ensure the order of notes is preserved from the AI's suggestion
        const orderedFullNotes = noteIds.map((id: number) => fullNotes.find(note => note.id === id)).filter(Boolean) as any

        const hydratedSession: ReminiscenceSession = {
          ...generatedSession,
          notes: orderedFullNotes,
        }
        setSession(hydratedSession)
      } else {
        setError("I couldn't come up with a story right now. Please try again.")
        setSession(null)
      }
    } catch (e) {
      
      setError("An unexpected error occurred while creating your memory story. Please try again.")
      Alert.alert("Error", "Failed to generate session.")
    } finally {
      setIsLoading(false)
    }
  }, [isLoaded, loadModel])

  return {
    session,
    isLoading,
    error,
    generateSession,
  }
}