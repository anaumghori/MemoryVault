import type React from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, SafeAreaView, Image, Modal, KeyboardAvoidingView, Platform } from "react-native"
import { useNotes } from "../hooks/useNotes"
import { ArrowLeft, Plus, FileText, Camera, Images, Mic, Music, X, Play, Pause, Edit, Trash2, Check } from "lucide-react-native"

export const NotesScreen: React.FC = () => {
  const { notes, editingNote, viewingNote, newNoteTitle, newNoteContent, newNoteTags, selectedImages, audioUri, activeAudioUri,
    showCreateEditModal, recordingStatus, currentTime, duration, setViewingNote, setNewNoteTitle, setNewNoteContent,
    setNewNoteTags, setAudioUri, handleSaveNote, resetForm, handleOpenCreateModal, handleOpenEditModal, handleDeleteNote,
    pickImageAsync, takePhoto, startRecording, pauseRecording, resumeRecording, stopRecording, playSound, formatDate,
    formatTime, removeImage, setCurrentScreen, isAudioPlaying } = useNotes()

  const primaryGreen = "#15803d"
  const lightGreen = "#dcfce7"
  const darkGreen = "#166534"

  // Helper function to render audio player with clear visual feedback
  const renderAudioPlayer = (audioPath: string, label = "Play Recording") => {
    const isCurrentlyPlaying = isAudioPlaying(audioPath)
    const isThisAudio = activeAudioUri === audioPath

    return (
      <View className="p-5 rounded-xl border-2 border-green-200" style={{ backgroundColor: lightGreen }}>
        <TouchableOpacity onPress={() => playSound(audioPath)} className="flex-row items-center">
          <View
            className="w-12 h-12 rounded-full items-center justify-center mr-4"
            style={{ backgroundColor: isCurrentlyPlaying ? "#ef4444" : primaryGreen }}
          >
            {isCurrentlyPlaying ? (
              <Pause size={24} color="white" />
            ) : (
              <Play size={24} color="white" style={{ marginLeft: 2 }} />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-xl font-bold text-green-800">{isCurrentlyPlaying ? "Playing..." : label}</Text>
            {isThisAudio && duration > 0 && (
              <View className="mt-2">
                <Text className="text-lg text-green-700 font-medium">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </Text>
                <View className="w-full h-2 bg-green-200 rounded-full mt-2">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: primaryGreen,
                      width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                    }}
                  />
                </View>
              </View>
            )}
            {!isThisAudio && <Text className="text-lg text-green-700 mt-1 font-medium">Tap to play</Text>}
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white" style={{ paddingTop: 20 }}>
      <View className="flex-row items-center justify-between px-6 py-4 bg-white border-b-2 border-green-100">
        <TouchableOpacity className="flex-row items-center mr-4 p-2" onPress={() => setCurrentScreen("home")}>
          <ArrowLeft size={28} color={primaryGreen} />
          <Text className="text-xl font-bold text-green-800 ml-2">Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-green-800 flex-1">My Memories</Text>
        <TouchableOpacity
          className="flex-row items-center rounded-full px-5 py-3"
          style={{ backgroundColor: primaryGreen }}
          onPress={handleOpenCreateModal}
        >
          <Plus size={20} color="white" style={{ marginRight: 8 }} />
          <Text className="text-white text-lg font-bold">New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {notes.length === 0 ? (
          <View className="flex-1 justify-center items-center p-10 mt-24">
            <FileText size={80} color={primaryGreen} style={{ marginBottom: 24 }} />
            <Text className="text-3xl font-bold text-green-800 mb-4 text-center">No memories yet</Text>
            <Text className="text-xl text-center text-green-700 leading-8">
              Start creating your first memory by tapping the "New" button above
            </Text>
          </View>
        ) : (
          <View className="p-6">
            {notes.map((note) => (
              <TouchableOpacity
                key={note.id}
                className="p-6 rounded-2xl mb-6 bg-white shadow border-2 border-green-200"
                onPress={() => setViewingNote(note)}
              >
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-2xl font-bold text-green-800 flex-1" numberOfLines={1}>
                    {note.title}
                  </Text>
                  <Text className="text-lg text-green-700 font-medium">{formatDate(note.timestamp)}</Text>
                </View>
                <Text className="text-xl leading-8 text-green-800 mb-4" numberOfLines={3}>
                  {note.content}
                </Text>
                {note.hasImages && note.imagePaths && note.imagePaths.length > 0 && (
                  <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
                    {note.imagePaths.slice(0, 3).map((imagePath, index) => (
                      <Image
                        key={index}
                        source={{ uri: imagePath }}
                        className="w-20 h-20 rounded-xl mr-3 border-2 border-green-200"
                      />
                    ))}
                  </ScrollView>
                )}
                <View className="flex-row justify-between items-center">
                  {note.tags.length > 0 && (
                    <View className="flex-row items-center flex-1">
                      {note.tags.slice(0, 2).map((tag, index) => (
                        <View
                          key={index}
                          className="px-3 py-2 rounded-xl mr-2 border-2 border-green-300"
                          style={{ backgroundColor: lightGreen }}
                        >
                          <Text className="text-lg font-bold text-green-800">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View className="flex-row">
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showCreateEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={async () => await resetForm()}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 bg-white"
        >
          <View className="flex-row items-center justify-between p-6 bg-white border-b-2 border-green-100">
            <TouchableOpacity onPress={async () => await resetForm()}>
              <Text className="text-xl font-bold text-green-800">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-green-800">{editingNote ? "Edit Memory" : "New Memory"}</Text>
            <TouchableOpacity
              className="rounded-full px-5 py-3"
              style={{ backgroundColor: primaryGreen }}
              onPress={handleSaveNote}
            >
              <Text className="text-white text-lg font-bold">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
            <View className="mb-8">
              <Text className="text-xl font-bold text-green-800 mb-3">Memory Title</Text>
              <TextInput
                className="border-2 rounded-xl p-5 text-xl bg-white"
                style={{ borderColor: primaryGreen, color: darkGreen }}
                value={newNoteTitle}
                onChangeText={setNewNoteTitle}
                placeholder="Give your memory a title..."
                placeholderTextColor="#15803d60"
              />
            </View>

            <View className="mb-8">
              <Text className="text-xl font-bold text-green-800 mb-3">What Happened?</Text>
              <TextInput
                className="border-2 rounded-xl p-5 text-xl bg-white"
                style={{ borderColor: primaryGreen, color: darkGreen, minHeight: 140, textAlignVertical: "top" }}
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                placeholder="Describe your memory..."
                placeholderTextColor="#15803d60"
                multiline
              />
            </View>

            <View className="mb-8">
              <Text className="text-xl font-bold text-green-800 mb-4">Add Media</Text>
              <View className="flex-row justify-around">
                <TouchableOpacity
                  className="border-2 rounded-xl p-4 items-center w-28"
                  style={{ borderColor: primaryGreen }}
                  onPress={takePhoto}
                >
                  <Camera size={32} color={primaryGreen} style={{ marginBottom: 8 }} />
                  <Text className="text-lg font-bold text-green-800">Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="border-2 rounded-xl p-4 items-center w-28"
                  style={{ borderColor: primaryGreen }}
                  onPress={pickImageAsync}
                >
                  <Images size={32} color={primaryGreen} style={{ marginBottom: 8 }} />
                  <Text className="text-lg font-bold text-green-800">Gallery</Text>
                </TouchableOpacity>

                {recordingStatus === "idle" ? (
                  <TouchableOpacity
                    className="border-2 rounded-xl p-4 items-center w-28"
                    style={{ borderColor: primaryGreen }}
                    onPress={startRecording}
                  >
                    <Mic size={32} color={primaryGreen} style={{ marginBottom: 8 }} />
                    <Text className="text-lg font-bold text-green-800">Record</Text>
                  </TouchableOpacity>
                ) : recordingStatus === "recording" ? (
                  <View className="rounded-xl p-4 items-center w-28 bg-red-200 border-2 border-red-400">
                    <Text className="font-bold text-red-600 mb-3 text-lg">Recording</Text>
                    <View className="flex-row justify-around w-full">
                      <TouchableOpacity onPress={pauseRecording}>
                        <Pause size={24} color={primaryGreen} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => stopRecording(true)}>
                        <Check size={24} color={primaryGreen} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View className="rounded-xl p-4 items-center w-28 bg-yellow-200 border-2 border-yellow-400">
                    <Text className="font-bold text-yellow-800 mb-3 text-lg">Paused</Text>
                    <View className="flex-row justify-around w-full">
                      <TouchableOpacity onPress={resumeRecording}>
                        <Play size={24} color={primaryGreen} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => stopRecording(true)}>
                        <Check size={24} color={primaryGreen} />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {selectedImages.length > 0 && (
              <View className="mb-8">
                <Text className="text-xl font-bold text-green-800 mb-3">Images</Text>
                <ScrollView horizontal>
                  {selectedImages.map((uri, index) => (
                    <View key={index} className="relative mr-3">
                      <Image source={{ uri }} className="w-24 h-24 rounded-xl border-2 border-green-200" />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 rounded-full p-2"
                      >
                        <X size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {audioUri && (
              <View className="mb-8">
                <Text className="text-xl font-bold text-green-800 mb-3">Audio Recording</Text>
                {renderAudioPlayer(audioUri, "Recording saved")}
                <TouchableOpacity
                  onPress={() => setAudioUri(null)}
                  className="mt-3 p-3 rounded-xl bg-red-100 border-2 border-red-300"
                >
                  <Text className="text-lg font-bold text-red-600 text-center">Remove Recording</Text>
                </TouchableOpacity>
              </View>
            )}

            <View className="mb-8">
              <Text className="text-xl font-bold text-green-800 mb-3">Tags</Text>
              <TextInput
                className="border-2 rounded-xl p-5 text-xl"
                style={{ borderColor: primaryGreen, color: darkGreen }}
                value={newNoteTags}
                onChangeText={setNewNoteTags}
                placeholder="family, trip, celebration (comma separated)"
                placeholderTextColor="#15803d60"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {viewingNote && (
        <Modal
          visible={!!viewingNote}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setViewingNote(null)}
        >
          <View className="flex-1 bg-white">
            <View className="flex-row items-center justify-between p-6 bg-white border-b-2 border-green-100">
              <TouchableOpacity onPress={() => setViewingNote(null)}>
                <Text className="text-xl font-bold text-green-800">Close</Text>
              </TouchableOpacity>
              <View className="flex-row">
                <TouchableOpacity onPress={() => handleOpenEditModal(viewingNote)} className="p-3 mr-2">
                  <View className="flex-row items-center">
                    <Edit size={28} color={primaryGreen} />
                    <Text className="text-lg font-bold text-green-800 ml-2">Edit</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteNote(viewingNote.id)} className="p-3">
                  <View className="flex-row items-center">
                    <Trash2 size={28} color="red" />
                    <Text className="text-lg font-bold text-red-600 ml-2">Delete</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="flex-1 p-6">
              <Text className="text-3xl font-bold text-green-800 mb-3">{viewingNote.title}</Text>
              <Text className="text-lg text-green-700 mb-6 font-medium">{formatDate(viewingNote.timestamp)}</Text>
              <Text className="text-xl leading-8 text-green-800 mb-8">{viewingNote.content}</Text>

              {viewingNote.hasImages && viewingNote.imagePaths && viewingNote.imagePaths.length > 0 && (
                <View className="mb-8">
                  <Text className="text-2xl font-bold text-green-800 mb-4">Photos</Text>
                  {viewingNote.imagePaths.map((uri, index) => (
                    <Image
                      key={index}
                      source={{ uri }}
                      className="w-full h-64 rounded-xl mb-4 border-2 border-green-200"
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}

              {viewingNote.hasAudio && viewingNote.audioPath && (
                <View className="mb-8">
                  <Text className="text-2xl font-bold text-green-800 mb-4">Audio Recording</Text>
                  {renderAudioPlayer(viewingNote.audioPath, "Memory Recording")}
                </View>
              )}

              {viewingNote.tags.length > 0 && (
                <View>
                  <Text className="text-2xl font-bold text-green-800 mb-4">Tags</Text>
                  <View className="flex-row flex-wrap">
                    {viewingNote.tags.map((tag, index) => (
                      <View
                        key={index}
                        className="px-4 py-2 rounded-full mr-3 mb-3 border-2 border-green-300"
                        style={{ backgroundColor: lightGreen }}
                      >
                        <Text className="text-lg font-bold text-green-800">{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  )
}
