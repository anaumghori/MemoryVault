"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView } from "react-native"
import { useMemoryVault } from "../app/contexts/MemoryVaultContext"
import { DatabaseManager, type Note } from "../database/DatabaseManager"
import { PlusCircle, MessageCircle, Heart, Mic, Camera, Gamepad2 } from "lucide-react-native"

export const HomeScreen: React.FC = () => {
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [notesCount, setNotesCount] = useState(0)

  const primaryGreen = "#15803d" // green-700
  const lightGreen = "#dcfce7" // green-100
  const darkGreen = "#166534" // green-800

  const { user, setCurrentScreen } = useMemoryVault()

  useEffect(() => {
    loadRecentNotes()
  }, [])

  const loadRecentNotes = async () => {
    try {
      const dbManager = DatabaseManager.getInstance()
      const notes = await dbManager.getAllNotes()
      setRecentNotes(notes.slice(0, 3)) // Show last 3 notes
      setNotesCount(notes.length)
    } catch (error) {
      
    }
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 17) return "Good afternoon"
    return "Good evening"
  }

  return (
    <SafeAreaView className="flex-1 bg-white pt-6">
      <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-8 pt-4">
          <Text className="text-3xl font-bold text-green-800">
            {getGreeting()}, {user?.name}
          </Text>
          <Text className="text-xl mt-2 text-green-700 font-medium">Your Memory Vault</Text>
        </View>

        {/* Quick Stats */}
        <View className="p-8 rounded-2xl mb-8 bg-white shadow border-2 border-green-200">
          <Text className="text-2xl font-bold text-green-800 mb-6 text-center">Your Memory Journey</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-4xl font-bold text-green-700">{notesCount}</Text>
              <Text className="text-lg mt-2 text-green-700 font-medium">Memories Saved</Text>
            </View>
            <View className="items-center">
              <Text className="text-4xl font-bold text-green-700">{Math.floor(Math.random() * 50) + 20}</Text>
              <Text className="text-lg mt-2 text-green-700 font-medium">Days Active</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-green-800 mb-6">Quick Actions</Text>

          <View>
            <TouchableOpacity
              className="p-6 rounded-2xl mb-4 bg-white shadow border-2 border-green-200"
              onPress={() => setCurrentScreen("notes")}
            >
              <PlusCircle size={40} color={primaryGreen} style={{ marginBottom: 12 }} />
              <Text className="text-2xl font-bold text-green-800 mb-2">Create New Memory</Text>
              <Text className="text-lg text-green-700 font-medium">Add text, voice recordings, or photos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-6 rounded-2xl mb-4 bg-white shadow border-2 border-green-200"
              onPress={() => setCurrentScreen("chat")}
            >
              <MessageCircle size={40} color={primaryGreen} style={{ marginBottom: 12 }} />
              <Text className="text-2xl font-bold text-green-800 mb-2">Chat with AI Assistant</Text>
              <Text className="text-lg text-green-700 font-medium">Ask about your memories and experiences</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-6 rounded-2xl mb-4 bg-white shadow border-2 border-green-200"
              onPress={() => setCurrentScreen("reminiscence")}
            >
              <Heart size={40} color={primaryGreen} style={{ marginBottom: 12 }} />
              <Text className="text-2xl font-bold text-green-800 mb-2">Memory Lane</Text>
              <Text className="text-lg text-green-700 font-medium">Relive your favorite moments</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="p-6 rounded-2xl mb-4 bg-white shadow border-2 border-green-200"
              onPress={() => setCurrentScreen("games")}
            >
              <Gamepad2 size={40} color={primaryGreen} style={{ marginBottom: 12 }} />
              <Text className="text-2xl font-bold text-green-800 mb-2">Memory Game</Text>
              <Text className="text-lg text-green-700 font-medium">Exercise your memory with fun challenges</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}
