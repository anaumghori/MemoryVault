"use client"

import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform, Modal,
  StatusBar, Alert, Image, Dimensions } from "react-native"
import { useMemoryVault } from "../app/contexts/MemoryVaultContext"
import { Note, DatabaseManager } from "../database/DatabaseManager"
import { ArrowLeft, MessageCircle, Send, X, BookOpen, Camera, ImageIcon } from "lucide-react-native"
import { useGemmaModel } from "../lib/hooks"
import SimplifiedGemmaBridge from "../lib/GemmaBridge"
import * as ImagePicker from 'expo-image-picker'

interface Message {
  id: number
  type: "user" | "assistant"
  content: string
  timestamp: number
  notes?: Note[]
  hasImages: boolean
  imagePaths?: string[]
}

export const ChatScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false)
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [showImageActionSheet, setShowImageActionSheet] = useState(false)

  const primaryGreen = "#15803d" // green-700
  const darkGreen = "#166534" // green-800

  const { user, setCurrentScreen } = useMemoryVault()
  const scrollViewRef = useRef<ScrollView>(null)

  const {
    status,
    isLoaded,
    isLoading: isModelLoading,
    error,
    loadModel,
    unloadModel,
    deviceCapabilities,
  } = useGemmaModel();

  useEffect(() => {
    initializeChat()
    requestPermissions()
  }, [])

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [messages])

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync()
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync()

    if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted') {
      Alert.alert('Permissions Required', 'Please grant camera and media library permissions to send images.')
    }
  }

  const pickImageFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
        allowsMultipleSelection: false,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from library.')
    }
    setShowImageActionSheet(false)
  }

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setSelectedImages(prev => [...prev, result.assets[0].uri])
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo.')
    }
    setShowImageActionSheet(false)
  }

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  

  const initializeChat = async () => {
    if (!user) return

      const welcomeMessageContent = `Hello ${user.name}! I'm here to help you explore your memories and experiences. What would you like to talk about today?`
      const welcomeMessage: Message = {
        id: Date.now(),
        type: "assistant",
        content: welcomeMessageContent,
        timestamp: Date.now(),
        hasImages: false,
        imagePaths: [],
      }
      setMessages([welcomeMessage])
  }

  const sendMessage = useCallback(async () => {
    if ((!inputText.trim() && selectedImages.length === 0) || isGenerating) return;

    const userMessageContent = inputText.trim();
    const messageImages = [...selectedImages];
    setInputText("")
    setSelectedImages([])
    setIsGenerating(true)

    const userMessageForUI: Message = {
      id: Date.now(),
      type: "user",
      content: userMessageContent || (messageImages.length > 0 ? "📸 Sent images" : ""),
      timestamp: Date.now(),
      hasImages: messageImages.length > 0,
      imagePaths: messageImages,
    }
    setMessages((prev) => [...prev, userMessageForUI])

    try {
      // Load model if not loaded
      if (!isLoaded) {
        const loadSuccess = await loadModel();
        if (!loadSuccess) {
          throw new Error("Failed to load model");
        }
      }

      // Generate response (with or without images)
      const userPrompt = userMessageContent || "Please analyze and discuss these images in relation to my memories."

      const result = messageImages.length > 0 
        ? await SimplifiedGemmaBridge.generateResponseWithImages(
            userPrompt,
            messageImages
          )
        : await SimplifiedGemmaBridge.generateResponse(
            userPrompt
          );

      // Add assistant response to conversation
      const assistantMessage: Message = {
        id: Date.now() + 1,
        type: "assistant",
        content: result,
        timestamp: Date.now(),
        hasImages: false,
        imagePaths: [],
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error: any) {
      // Add error message to conversation
      const errorMessage: Message = {
        id: Date.now() + 1,
        type: "assistant",
        content: `Error: ${error.message}`,
        timestamp: Date.now(),
        hasImages: false,
        imagePaths: [],
      };
      setMessages((prev) => [...prev, errorMessage]);

      // Show user-friendly error
      Alert.alert("Error", `Failed to generate response: ${error.message}`, [
        { text: "OK" },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, selectedImages, isLoaded, isGenerating, loadModel]);


  const openNoteModal = (note: Note) => {
    setSelectedNote(note)
    setIsNoteModalVisible(true)
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="white" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
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
            <MessageCircle size={24} color={primaryGreen} style={{ marginRight: 12 }} />
            <Text className="text-2xl font-bold text-green-800">AI Assistant</Text>
          </View>
          <View className="w-20" />
        </View>

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 24 }}
          className="flex-1 bg-white"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              className={`mb-6 flex-row ${message.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <View
                className={`max-w-[85%] p-4 rounded-2xl shadow-md ${
                  message.type === "user"
                    ? "bg-green-700 rounded-br-sm"
                    : "bg-green-50 rounded-bl-sm border-2 border-green-200"
                }`}
              >
                <Text className={`text-lg leading-7 ${message.type === "user" ? "text-white" : "text-green-900"}`}>
                  {message.content}
                </Text>
                {message.hasImages && message.imagePaths && message.imagePaths.length > 0 && (
                  <View className="mt-3 flex-row flex-wrap gap-2">
                    {message.imagePaths.map((imagePath, index) => (
                      <Image
                        key={index}
                        source={{ uri: imagePath }}
                        className="w-32 h-32 rounded-lg"
                        style={{ width: 128, height: 128 }}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}
                {message.notes && message.notes.length > 0 && (
                  <View className="mt-3 pt-3 border-t border-green-200">
                    <Text className="text-sm font-bold text-green-900 mb-2">Referenced Memories:</Text>
                    {message.notes.map((note) => (
                      <TouchableOpacity
                        key={note.id}
                        className="flex-row items-center bg-green-100 py-2 px-3 rounded-xl mt-1"
                        onPress={() => openNoteModal(note)}
                      >
                        <BookOpen size={16} color={darkGreen} />
                        <Text className="ml-2 text-base font-semibold text-green-800 flex-shrink" numberOfLines={1}>
                          {note.title}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                <Text
                  className={`text-sm mt-3 text-right font-medium ${
                    message.type === "user" ? "text-white opacity-70" : "text-green-800 opacity-80"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}

          {isGenerating && (
            <View className="flex-row items-center p-6 rounded-2xl bg-green-50 border-2 border-green-200 self-start">
              <ActivityIndicator size="small" color={primaryGreen} />
              <Text className="ml-3 text-lg italic text-green-800 font-medium">
                {isLoaded ? "AI is thinking..." : "Loading AI model..."}
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Selected Images Preview */}
        {selectedImages.length > 0 && (
          <View className="px-6 py-3 bg-gray-50 border-t border-green-100">
            <Text className="text-sm font-medium text-green-800 mb-2">Selected Images:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-2">
                {selectedImages.map((imageUri, index) => (
                  <View key={index} className="relative">
                    <Image
                      source={{ uri: imageUri }}
                      className="w-16 h-16 rounded-lg"
                      style={{ width: 64, height: 64 }}
                      resizeMode="cover"
                    />
                    <TouchableOpacity
                      className="absolute -top-2 -right-2 bg-red-500 rounded-full w-6 h-6 justify-center items-center"
                      onPress={() => removeImage(index)}
                    >
                      <X size={12} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Input area */}
        <View className="flex-row items-end gap-4 px-6 py-4 bg-white border-t-2 border-green-100">
          <TouchableOpacity
            className="bg-green-100 h-14 w-14 rounded-full justify-center items-center"
            onPress={() => setShowImageActionSheet(true)}
          >
            <Camera size={24} color={primaryGreen} />
          </TouchableOpacity>
          <TextInput
            className="flex-1 border-2 rounded-2xl px-6 py-4 text-xl bg-white border-green-700 text-green-800"
            style={{ maxHeight: 120, minHeight: 56 }}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask about your memories..."
            placeholderTextColor="#15803d60"
            multiline
            maxLength={500}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            className={`bg-green-700 h-14 w-14 rounded-full justify-center items-center ${
              (!inputText.trim() && selectedImages.length === 0) || isGenerating || !isLoaded ? "opacity-50" : ""
            }`}
            onPress={sendMessage}
            disabled={(!inputText.trim() && selectedImages.length === 0) || isGenerating || !isLoaded}
          >
            <Send size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Note Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isNoteModalVisible}
        onRequestClose={() => setIsNoteModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="w-[90%] max-h-[80%] bg-white rounded-2xl p-6 shadow-lg">
            <TouchableOpacity className="self-end p-2" onPress={() => setIsNoteModalVisible(false)}>
              <X size={28} color="#333" />
            </TouchableOpacity>
            {selectedNote && (
              <>
                <Text className="text-2xl font-bold text-green-800 mb-4">{selectedNote.title}</Text>
                <ScrollView style={{ flexGrow: 0 }}>
                  <Text className="text-lg leading-7 text-gray-800">{selectedNote.content}</Text>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Image Action Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showImageActionSheet}
        onRequestClose={() => setShowImageActionSheet(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 pb-8">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
            <Text className="text-xl font-bold text-center text-gray-800 mb-6">Add Image</Text>
            
            <TouchableOpacity
              className="flex-row items-center p-4 bg-green-50 rounded-2xl mb-3"
              onPress={takePhoto}
            >
              <Camera size={24} color={primaryGreen} />
              <Text className="ml-4 text-lg font-semibold text-green-800">Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center p-4 bg-green-50 rounded-2xl mb-6"
              onPress={pickImageFromLibrary}
            >
              <ImageIcon size={24} color={primaryGreen} />
              <Text className="ml-4 text-lg font-semibold text-green-800">Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="p-4 bg-gray-100 rounded-2xl"
              onPress={() => setShowImageActionSheet(false)}
            >
              <Text className="text-center text-lg font-semibold text-gray-600">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}