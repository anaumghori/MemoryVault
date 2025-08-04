"use client"

import type React from "react"
import { useState } from "react"
import { View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Alert } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { DatabaseManager } from "../database/DatabaseManager"
import { Brain, MessageCircle, Target, Lock, Heart } from "lucide-react-native"

interface OnboardingScreenProps {
  onComplete: (userName: string) => void
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Updated theme colors - forest green instead of brown
  const primaryGreen = "#15803d" // green-700
  const lightGreen = "#dcfce7" // green-100
  const darkGreen = "#166534" // green-800

  const insets = useSafeAreaInsets()

  const handleContinue = async () => {
    if (!name.trim()) {
      Alert.alert("Please enter your name", "We need your name to personalize your Memory Vault experience.")
      return
    }

    setIsLoading(true)
    try {
      const dbManager = DatabaseManager.getInstance()
      await dbManager.initialize()
      await dbManager.createUser(name.trim())
      onComplete(name.trim())
    } catch (error) {
      Alert.alert("Setup Error", "There was an error setting up your Memory Vault. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 justify-center px-8">
        {/* Welcome Header */}
        <View className="items-center mb-12">
          <Text className="text-3xl text-green-700 mb-3 font-medium">Welcome to</Text>
          <Text className="text-5xl font-bold text-green-800 mb-4">Memory Vault</Text>
          <Text className="text-xl text-center text-green-700 font-medium">
            Your personal AI-powered memory assistant
          </Text>
        </View>

        {/* Features Overview */}
        <View className="mb-12">
          <Text className="text-2xl font-bold text-green-800 mb-6 text-center">What you can do:</Text>

          <View className="flex-row items-center mb-4 px-6">
            <View className="mr-4 w-10">
              <Brain size={32} color={primaryGreen} />
            </View>
            <Text className="text-xl flex-1 text-green-800 font-medium">
              Create rich notes with text, voice, and photos
            </Text>
          </View>

          <View className="flex-row items-center mb-4 px-6">
            <View className="mr-4 w-10">
              <MessageCircle size={32} color={primaryGreen} />
            </View>
            <Text className="text-xl flex-1 text-green-800 font-medium">
              Chat with AI about your memories and experiences
            </Text>
          </View>

          <View className="flex-row items-center mb-4 px-6">
            <View className="mr-4 w-10">
              <Target size={32} color={primaryGreen} />
            </View>
            <Text className="text-xl flex-1 text-green-800 font-medium">
              Play memory games to strengthen recall
            </Text>
          </View>

          <View className="flex-row items-center mb-4 px-6">
            <View className="mr-4 w-10">
              <Heart size={32} color={primaryGreen} />
            </View>
            <Text className="text-xl flex-1 text-green-800 font-medium">Enjoy daily reminiscence therapy sessions</Text>
          </View>
        </View>

        {/* Name Input */}
        <View className="mb-8">
          <Text className="text-2xl font-bold text-green-800 mb-4 text-center">What should we call you?</Text>
          <TextInput
            className="border-2 rounded-xl p-6 text-2xl text-center font-bold bg-white"
            style={{ borderColor: primaryGreen, color: darkGreen }}
            value={name}
            onChangeText={setName}
            placeholder="Enter your name"
            placeholderTextColor="#15803d80"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />
        </View>

        {/* Privacy Note */}
        <View className="p-6 rounded-xl mb-8 border-2 border-green-200 shadow" style={{ backgroundColor: lightGreen }}>
          <View className="flex-row justify-center items-center mb-3">
            <Lock size={24} color={primaryGreen} />
            <Text className="text-xl font-bold text-green-800 ml-3">Your Privacy Matters</Text>
          </View>
          <Text className="text-lg leading-7 text-center text-green-800">
            All your data stays on your device. No cloud storage, no sharing. Your memories are yours alone.
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          className={`rounded-xl p-6 items-center ${isLoading ? "opacity-60" : ""}`}
          style={{ backgroundColor: primaryGreen }}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text className="text-white text-2xl font-bold">
            {isLoading ? "Setting up your vault..." : "Start My Memory Journey"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
