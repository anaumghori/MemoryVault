import React, { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { useGames } from "../hooks/useGames"
import { Lightbulb, CheckCircle, XCircle, Brain, RotateCcw, Sparkles } from "lucide-react-native"

interface CompleteMemoryProps {
  onBack: () => void
}

export const CompleteMemory: React.FC<CompleteMemoryProps> = ({ onBack }) => {
  const [userCompletion, setUserCompletion] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  
  const {
    currentMemoryGame,
    isMemoryLoading,
    memoryError,
    generateMemoryCompletion,
    submitMemoryCompletion,
    resetMemoryGame
  } = useGames()

  const primaryGreen = "#15803d"
  const lightGreen = "#dcfce7"
  const darkGreen = "#166534"

  useEffect(() => {
    if (!currentMemoryGame && !isMemoryLoading && !memoryError) {
      generateMemoryCompletion()
    }
  }, [currentMemoryGame, isMemoryLoading, memoryError, generateMemoryCompletion])

  const handleSubmitCompletion = async () => {
    if (!userCompletion.trim()) {
      Alert.alert("Please enter your completion", "Fill in what you remember about this memory.")
      return
    }

    await submitMemoryCompletion(userCompletion.trim())
    setShowFeedback(true)
  }

  const handleStartNewGame = () => {
    resetMemoryGame()
    setUserCompletion("")
    setShowFeedback(false)
    generateMemoryCompletion()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isMemoryLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <ActivityIndicator size="large" color={primaryGreen} />
        <Text className="text-xl text-green-700 mt-4 font-medium text-center">
          Selecting a memory for you to complete...
        </Text>
      </View>
    )
  }

  if (memoryError) {
    return (
      <View className="flex-1 justify-center items-center p-10">
        <Brain size={80} color={primaryGreen} className="mb-6" />
        <Text className="text-3xl font-bold text-green-800 mb-4 text-center">Oops!</Text>
        <Text className="text-xl text-center text-green-700 leading-8 mb-8">{memoryError}</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            className="rounded-full px-6 py-4 bg-green-700"
            onPress={() => generateMemoryCompletion()}
          >
            <Text className="text-white text-xl font-bold">Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-full px-6 py-4 border-2 border-green-700"
            onPress={onBack}
          >
            <Text className="text-green-700 text-xl font-bold">Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (!currentMemoryGame) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-xl text-green-700">No memory available</Text>
      </View>
    )
  }

  if (showFeedback && currentMemoryGame.feedback) {
    return (
      <ScrollView className="flex-1 p-6">
        <View className="items-center mb-8">
          <Sparkles size={80} color={primaryGreen} className="mb-6" />
          <Text className="text-3xl font-bold text-green-800 mb-4 text-center">
            Memory Complete!
          </Text>
        </View>

        {/* Original Memory Info */}
        <View className="p-6 rounded-xl bg-white shadow border-2 border-green-200 mb-6">
          <Text className="text-xl font-bold text-green-800 mb-2">{currentMemoryGame.note.title}</Text>
          <Text className="text-lg text-green-700 font-medium mb-4">
            {formatDate(currentMemoryGame.note.timestamp)}
          </Text>
        </View>

        {/* Your Completion */}
        <View className="p-6 rounded-xl bg-blue-50 border-2 border-blue-200 mb-6">
          <Text className="text-xl font-bold text-blue-800 mb-3">Your Completion:</Text>
          <Text className="text-lg text-blue-800 leading-7">{currentMemoryGame.userCompletion}</Text>
        </View>

        {/* Expected Completion */}
        <View className="p-6 rounded-xl bg-green-50 border-2 border-green-200 mb-6">
          <Text className="text-xl font-bold text-green-800 mb-3">Original Memory:</Text>
          <Text className="text-lg text-green-800 leading-7">{currentMemoryGame.expectedCompletion}</Text>
        </View>

        {/* Feedback */}
        <View className={`p-6 rounded-xl mb-8 border-2 ${
          currentMemoryGame.isCorrect 
            ? "bg-green-50 border-green-300" 
            : "bg-orange-50 border-orange-300"
        }`}>
          <View className="flex-row items-center mb-3">
            {currentMemoryGame.isCorrect ? (
              <CheckCircle size={32} color="#22c55e" style={{ marginRight: 12 }} />
            ) : (
              <XCircle size={32} color="#f59e0b" style={{ marginRight: 12 }} />
            )}
            <Text className={`text-2xl font-bold ${
              currentMemoryGame.isCorrect ? "text-green-800" : "text-orange-800"
            }`}>
              {currentMemoryGame.isCorrect ? "Great Memory!" : "Close, but not quite"}
            </Text>
          </View>
          <Text className={`text-lg leading-7 ${
            currentMemoryGame.isCorrect ? "text-green-800" : "text-orange-800"
          }`}>
            {currentMemoryGame.feedback}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-4 pb-6">
          <TouchableOpacity
            className="flex-1 rounded-full px-6 py-4 bg-green-700"
            onPress={handleStartNewGame}
          >
            <View className="flex-row items-center justify-center">
              <RotateCcw size={24} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white text-xl font-bold">New Memory</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 rounded-full px-6 py-4 border-2 border-green-700"
            onPress={onBack}
          >
            <Text className="text-green-700 text-xl font-bold text-center">Back to Games</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    )
  }

  return (
    <ScrollView className="flex-1 p-6">
      {/* Header */}
      <View className="items-center mb-8">
        <Lightbulb size={60} color={primaryGreen} className="mb-4" />
        <Text className="text-4xl font-bold text-green-800 mb-2 text-center">Complete the Memory</Text>
        <Text className="text-lg text-green-700 text-center leading-6">
          Can you remember how this memory continues?
        </Text>
      </View>

      {/* Memory Info */}
      <View className="p-6 rounded-xl bg-white shadow border-2 border-green-200 mb-6">
        <Text className="text-2xl font-bold text-green-800 mb-2">{currentMemoryGame.note.title}</Text>
        <Text className="text-lg text-green-700 font-medium mb-4">
          {formatDate(currentMemoryGame.note.timestamp)}
        </Text>
      </View>

      {/* Partial Memory */}
      <View className="p-6 rounded-xl border-2 border-green-200 mb-6" style={{ backgroundColor: lightGreen }}>
        <Text className="text-xl font-bold text-green-800 mb-3">Your Memory (partial):</Text>
        <Text className="text-lg text-green-800 leading-7 font-medium">
          {currentMemoryGame.partialMemory}
        </Text>
      </View>

      {/* Completion Input */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-green-800 mb-3">Complete the memory:</Text>
        <TextInput
          className="border-2 rounded-xl p-5 text-xl bg-white"
          style={{ 
            borderColor: primaryGreen, 
            color: darkGreen,
            minHeight: 140,
            textAlignVertical: "top"
          }}
          value={userCompletion}
          onChangeText={setUserCompletion}
          placeholder="Fill in what you remember about this memory..."
          placeholderTextColor="#15803d60"
          multiline
        />
      </View>

      {/* Helper Text */}
      <View className="p-4 rounded-xl bg-blue-50 border-2 border-blue-200 mb-8">
        <Text className="text-lg text-blue-800 text-center leading-6">
          💡 Think about what happened next, who was there, how you felt, or any other details you remember
        </Text>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-4 pb-6">
        <TouchableOpacity
          className="flex-1 rounded-full px-6 py-4 bg-green-700"
          onPress={handleSubmitCompletion}
          disabled={!userCompletion.trim()}
        >
          <Text className="text-white text-xl font-bold text-center">Submit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          className="rounded-full px-6 py-4 border-2 border-green-700"
          onPress={onBack}
        >
          <Text className="text-green-700 text-xl font-bold">Back</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
} 