"use client"

import React, { useEffect, useRef } from "react"
import { View, Text, TouchableOpacity, ScrollView, SafeAreaView, Image, Dimensions, ActivityIndicator } from "react-native"
import { useMemoryVault } from "../app/contexts/MemoryVaultContext"
import { useReminiscence } from "../hooks/useReminiscence"
import { useNotes } from "../hooks/useNotes"
import { ArrowLeft, RefreshCw, Heart, Music, Lightbulb, ChevronLeft, ChevronRight, Play, Pause } from "lucide-react-native"

const { width: screenWidth } = Dimensions.get("window")

export const ReminiscenceScreen: React.FC = () => {
  const { session, isLoading, error, generateSession } = useReminiscence()
  const { setCurrentScreen } = useMemoryVault()
  const { playSound, isAudioPlaying, activeAudioUri, currentTime, duration, formatTime } = useNotes()
  const scrollViewRef = useRef<ScrollView>(null)

  const primaryGreen = "#15803d"
  const lightGreen = "#dcfce7"
  const darkGreen = "#166534"

  useEffect(() => {
    generateSession()
  }, [generateSession])

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={primaryGreen} />
          <Text className="text-xl text-green-700 mt-4 font-medium">Crafting a memory story for you...</Text>
        </View>
      )
    }

    if (error) {
      return (
        <View className="flex-1 justify-center items-center p-10">
          <Heart size={80} color={primaryGreen} className="mb-6" />
          <Text className="text-3xl font-bold text-green-800 mb-4 text-center">Could not create a session</Text>
          <Text className="text-xl text-center text-green-700 leading-8 mb-8">{error}</Text>
          <TouchableOpacity
            className="rounded-full px-8 py-4 bg-green-700"
            onPress={() => generateSession()}
          >
            <Text className="text-white text-xl font-bold">Try Again</Text>
          </TouchableOpacity>
        </View>
      )
    }

    if (!session) {
      return null
    }

    return (
      <ScrollView ref={scrollViewRef} className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-green-800 text-center leading-10">{session.title}</Text>
          </View>

          <View className="p-6 rounded-2xl bg-white shadow-lg border-2 border-green-200 mb-8">
            <Text className="text-xl leading-9 text-green-900">{session.narrative}</Text>
          </View>

          {session.notes && session.notes.length > 0 && (
            <View className="mb-8">
              <Text className="text-2xl font-bold text-green-800 mb-4">Memories from this story</Text>
              <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} className="-mx-6 px-6">
                {session.notes.map((note, index) => (
                  <View key={index} className="p-4 rounded-2xl bg-white shadow-md border-2 border-green-100 mr-4" style={{ width: screenWidth - 64 }}>
                    <Text className="text-2xl font-bold text-green-800 mb-3" numberOfLines={1}>{note.title}</Text>
                    
                    {note.imagePaths && note.imagePaths.length > 0 && (
                      <Image source={{ uri: note.imagePaths[0] }} className="w-full h-48 rounded-xl mb-4 border-2 border-green-200" resizeMode="cover" />
                    )}
                    
                    <Text className="text-lg leading-7 text-green-800 mb-4" numberOfLines={3}>{note.content}</Text>

                    {note.audioPath && (
                      <View className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
                        <TouchableOpacity onPress={() => playSound(note.audioPath!)} className="flex-row items-center">
                          <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${isAudioPlaying(note.audioPath!) ? "bg-red-500" : "bg-green-700"}`}>
                            {isAudioPlaying(note.audioPath!) ? <Pause size={24} color="white" /> : <Play size={24} color="white" style={{ marginLeft: 2 }} />}
                          </View>
                          <View className="flex-1">
                            <Text className="text-xl font-bold text-green-800">{isAudioPlaying(note.audioPath!) ? "Playing..." : "Play Recording"}</Text>
                            {activeAudioUri === note.audioPath && duration > 0 && (
                              <Text className="text-base text-green-700 font-medium mt-1">{formatTime(currentTime)} / {formatTime(duration)}</Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View className="p-6 rounded-2xl border-2 border-green-200 bg-green-50">
            <View className="flex-row items-center mb-4">
              <Lightbulb size={24} color={primaryGreen} className="mr-3" />
              <Text className="text-2xl font-bold text-green-800">Reflection Time</Text>
            </View>
            {session.promptingQuestions.map((q, i) => (
              <Text key={i} className="text-xl leading-8 text-green-900 mb-3">
                • {q}
              </Text>
            ))}
          </View>

          <View className="px-6 py-8">
            <TouchableOpacity
              className={`flex-row items-center justify-center rounded-full px-8 py-4 bg-green-700 ${isLoading ? "opacity-50" : ""}`}
              onPress={generateSession}
              disabled={isLoading}
            >
              <RefreshCw size={24} color="white" />
              <Text className="text-white text-xl font-bold ml-3">New Story</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-6 pt-8 pb-4 bg-white border-b-2 border-green-100">
        <TouchableOpacity
          className="flex-row items-center mr-4 p-2"
          onPress={() => setCurrentScreen("home")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ArrowLeft size={28} color={primaryGreen} />
          <Text className="text-xl font-bold text-green-800 ml-2">Back</Text>
        </TouchableOpacity>
        <View className="flex-1 flex-row items-center justify-center">
          <Heart size={24} color={primaryGreen} style={{ marginRight: 12 }} />
          <Text className="text-2xl font-bold text-green-800">Memory Lane</Text>
        </View>
        <View className="w-20" />
      </View>
      {renderContent()}
    </SafeAreaView>
  )
}