"use client"

import React, { useState } from "react"
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, StatusBar } from "react-native"
import { useMemoryVault } from "../app/contexts/MemoryVaultContext"
import { ArrowLeft, Brain, Lightbulb, Trophy, Gamepad2, Sparkles } from "lucide-react-native"
import { Quiz } from "../games/quiz"
import { CompleteMemory } from "../games/completeMemory"

type GameType = "menu" | "quiz" | "memory"

export const GamesScreen: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<GameType>("menu")
  const { setCurrentScreen } = useMemoryVault()

  const primaryGreen = "#15803d"
  const lightGreen = "#dcfce7"
  const darkGreen = "#166534"

  const renderGameContent = () => {
    switch (currentGame) {
      case "quiz":
        return <Quiz onBack={() => setCurrentGame("menu")} />
      case "memory":
        return <CompleteMemory onBack={() => setCurrentGame("menu")} />
      default:
        return renderGameMenu()
    }
  }

  const renderGameMenu = () => (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* Header Section */}
      <View className="p-8 items-center">
        <Gamepad2 size={80} color={primaryGreen} className="mb-6" />
        <Text className="text-3xl font-bold text-green-800 mb-4 text-center">Memory Games</Text>
        <Text className="text-xl text-green-700 text-center leading-7 font-medium">
          Test your memory with fun, AI-powered games based on your personal experiences
        </Text>
      </View>

      {/* Games Grid */}
      <View className="px-6 pb-8">
        {/* Quiz Game */}
        <TouchableOpacity
          className="p-8 rounded-2xl mb-6 bg-white shadow border-2 border-green-200"
          onPress={() => setCurrentGame("quiz")}
        >
          <View className="flex-row items-center mb-4">
            <Brain size={48} color={primaryGreen} style={{ marginRight: 16 }} />
            <View className="flex-1">
              <Text className="text-2xl font-bold text-green-800 mb-2">Memory Quiz</Text>
              <Text className="text-lg text-green-700 font-medium">
                Test your recall with personalized questions
              </Text>
            </View>
          </View>
          
          <View className="p-4 rounded-xl border-2 border-green-200" style={{ backgroundColor: lightGreen }}>
            <Text className="text-lg text-green-800 leading-6">
              AI creates custom quiz questions from your memories. Answer questions about specific details from your notes and experiences.
            </Text>
          </View>
          
          <View className="flex-row items-center mt-4">
            <Trophy size={20} color="#f59e0b" style={{ marginRight: 8 }} />
            <Text className="text-lg font-bold text-green-800">Challenge your memory!</Text>
          </View>
        </TouchableOpacity>

        {/* Memory Completion Game */}
        <TouchableOpacity
          className="p-8 rounded-2xl mb-6 bg-white shadow border-2 border-green-200"
          onPress={() => setCurrentGame("memory")}
        >
          <View className="flex-row items-center mb-4">
            <Lightbulb size={48} color={primaryGreen} style={{ marginRight: 16 }} />
            <View className="flex-1">
              <Text className="text-2xl font-bold text-green-800 mb-2">Complete the Memory</Text>
              <Text className="text-lg text-green-700 font-medium">
                Fill in the missing parts of your memories
              </Text>
            </View>
          </View>
          
          <View className="p-4 rounded-xl border-2 border-green-200" style={{ backgroundColor: lightGreen }}>
            <Text className="text-lg text-green-800 leading-6">
              AI shows you a partial memory from your notes. Your task is to complete it with what you remember happening next.
            </Text>
          </View>
          
          <View className="flex-row items-center mt-4">
            <Sparkles size={20} color="#8b5cf6" style={{ marginRight: 8 }} />
            <Text className="text-lg font-bold text-green-800">Relive your moments!</Text>
          </View>
        </TouchableOpacity>

        {/* Benefits Section */}
        <View className="p-6 rounded-2xl bg-green-50 border-2 border-green-200">
          <Text className="text-2xl font-bold text-green-800 mb-4 text-center">Why Play Memory Games?</Text>
          <View className="space-y-3">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-4" style={{ backgroundColor: primaryGreen }} />
              <Text className="text-lg text-green-800 flex-1 leading-6">
                Strengthen your memory recall abilities
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-4" style={{ backgroundColor: primaryGreen }} />
              <Text className="text-lg text-green-800 flex-1 leading-6">
                Rediscover forgotten details in your memories
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-4" style={{ backgroundColor: primaryGreen }} />
              <Text className="text-lg text-green-800 flex-1 leading-6">
                Exercise your brain with personalized content
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full mr-4" style={{ backgroundColor: primaryGreen }} />
              <Text className="text-lg text-green-800 flex-1 leading-6">
                Connect more deeply with your experiences
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View className="flex-row items-center px-6 pt-8 pb-4 bg-white border-b-2 border-green-100">
        <TouchableOpacity
          className="flex-row items-center mr-4 p-2"
          onPress={() => {
            if (currentGame === "menu") {
              setCurrentScreen("home")
            } else {
              setCurrentGame("menu")
            }
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={28} color={primaryGreen} />
          <Text className="text-xl font-bold text-green-800 ml-2">Back</Text>
        </TouchableOpacity>
        
        <View className="flex-1 flex-row items-center justify-center">
          {currentGame === "menu" && <Gamepad2 size={24} color={primaryGreen} style={{ marginRight: 12 }} />}
          <Text className="text-2xl font-bold text-green-800 text-left" numberOfLines={1}>
            {currentGame === "menu" ? "Memory Game" : 
             currentGame === "quiz" ? "Memory Quiz" : "Complete the Memory"}
          </Text>
        </View>
        
        <View className="w-20" />
      </View>

      {/* Game Content */}
      {renderGameContent()}
    </SafeAreaView>
  )
} 