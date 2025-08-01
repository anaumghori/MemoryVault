import React, { useState, useEffect } from "react"
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native"
import { useGames } from "../hooks/useGames"
import { Brain, CheckCircle, XCircle, Trophy, RotateCcw, ArrowRight } from "lucide-react-native"

interface QuizProps {
  onBack: () => void
}

export const Quiz: React.FC<QuizProps> = ({ onBack }) => {
  const [userAnswer, setUserAnswer] = useState("")
  const [showFeedback, setShowFeedback] = useState(false)
  
  const {
    currentQuiz,
    currentQuestionIndex,
    quizScore,
    isQuizLoading,
    quizError,
    generateQuiz,
    submitQuizAnswer,
    nextQuestion,
    resetQuiz,
    isQuizComplete,
    currentQuestion,
    quizProgress
  } = useGames()

  const primaryGreen = "#15803d"
  const lightGreen = "#dcfce7"
  const darkGreen = "#166534"

  useEffect(() => {
    if (currentQuiz.length === 0 && !isQuizLoading && !quizError) {
      generateQuiz(5)
    }
  }, [currentQuiz.length, isQuizLoading, quizError, generateQuiz])

  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) {
      Alert.alert("Please enter an answer", "Type your answer before submitting.")
      return
    }

    await submitQuizAnswer(userAnswer.trim())
    setShowFeedback(true)
  }

  const handleNextQuestion = () => {
    setUserAnswer("")
    setShowFeedback(false)
    nextQuestion()
  }

  const handleStartNewQuiz = () => {
    resetQuiz()
    setUserAnswer("")
    setShowFeedback(false)
    generateQuiz(5)
  }

  if (isQuizLoading) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <ActivityIndicator size="large" color={primaryGreen} />
        <Text className="text-xl text-green-700 mt-4 font-medium text-center">
          Creating personalized quiz questions from your memories...
        </Text>
      </View>
    )
  }

  if (quizError) {
    return (
      <View className="flex-1 justify-center items-center p-10">
        <Brain size={80} color={primaryGreen} className="mb-6" />
        <Text className="text-3xl font-bold text-green-800 mb-4 text-center">Oops!</Text>
        <Text className="text-xl text-center text-green-700 leading-8 mb-8">{quizError}</Text>
        <View className="flex-row gap-4">
          <TouchableOpacity
            className="rounded-full px-6 py-4 bg-green-700"
            onPress={() => generateQuiz(5)}
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

  if (isQuizComplete) {
    const percentage = Math.round((quizScore / currentQuiz.length) * 100)
    
    return (
      <ScrollView className="flex-1 p-6">
        <View className="items-center mb-8">
          <Trophy size={100} color={primaryGreen} className="mb-6" />
          <Text className="text-4xl font-bold text-green-800 mb-4">Quiz Complete!</Text>
          <Text className="text-2xl text-green-700 font-bold mb-2">
            Your Score: {quizScore}/{currentQuiz.length}
          </Text>
          <Text className="text-xl text-green-700 font-medium">
            {percentage}% - {percentage >= 80 ? "Excellent memory!" : percentage >= 60 ? "Good recall!" : "Keep practicing!"}
          </Text>
        </View>

        <View className="mb-8">
          <Text className="text-2xl font-bold text-green-800 mb-4">Review Your Answers</Text>
          {currentQuiz.map((question, index) => (
            <View key={question.id} className="p-4 rounded-xl mb-4 bg-white border-2 border-green-200">
              <Text className="text-lg font-bold text-green-800 mb-2">
                Question {index + 1}: {question.question}
              </Text>
              <View className="flex-row items-center mb-2">
                {question.isCorrect ? (
                  <CheckCircle size={20} color="#22c55e" style={{ marginRight: 8 }} />
                ) : (
                  <XCircle size={20} color="#ef4444" style={{ marginRight: 8 }} />
                )}
                <Text className={`text-lg font-medium ${question.isCorrect ? "text-green-600" : "text-red-600"}`}>
                  Your answer: {question.userAnswer}
                </Text>
              </View>
              {!question.isCorrect && (
                <Text className="text-lg text-green-700 mb-2">
                  Correct answer: {question.correctAnswer}
                </Text>
              )}
              {question.feedback && (
                <Text className="text-lg text-green-800 italic leading-6">
                  {question.feedback}
                </Text>
              )}
            </View>
          ))}
        </View>

        <View className="flex-row gap-4 pb-6">
          <TouchableOpacity
            className="flex-1 rounded-full px-6 py-4 bg-green-700"
            onPress={handleStartNewQuiz}
          >
            <View className="flex-row items-center justify-center">
              <RotateCcw size={24} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white text-xl font-bold">New Quiz</Text>
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

  if (!currentQuestion) {
    return (
      <View className="flex-1 justify-center items-center p-6">
        <Text className="text-xl text-green-700">No questions available</Text>
      </View>
    )
  }

  return (
    <ScrollView className="flex-1 p-6">
      {/* Progress Bar */}
      <View className="mb-8">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-bold text-green-800">
            Question {currentQuestionIndex + 1} of {currentQuiz.length}
          </Text>
          <Text className="text-lg font-bold text-green-800">
            Score: {quizScore}/{currentQuestionIndex}
          </Text>
        </View>
        <View className="w-full h-3 bg-green-200 rounded-full">
          <View
            className="h-3 rounded-full"
            style={{
              backgroundColor: primaryGreen,
              width: `${quizProgress}%`,
            }}
          />
        </View>
      </View>

      {/* Question */}
      <View className="p-6 rounded-2xl bg-white shadow border-2 border-green-200 mb-8">
        <Brain size={32} color={primaryGreen} className="mb-4" />
        <Text className="text-2xl font-bold text-green-800 mb-4 leading-8">
          {currentQuestion.question}
        </Text>
      </View>

      {/* Answer Input */}
      <View className="mb-8">
        <Text className="text-xl font-bold text-green-800 mb-3">Your Answer:</Text>
        <TextInput
          className="border-2 rounded-xl p-5 text-xl bg-white"
          style={{ 
            borderColor: primaryGreen, 
            color: darkGreen,
            minHeight: 120,
            textAlignVertical: "top"
          }}
          value={userAnswer}
          onChangeText={setUserAnswer}
          placeholder="Type your answer here..."
          placeholderTextColor="#15803d60"
          multiline
          editable={!showFeedback}
        />
      </View>

      {/* Feedback */}
      {showFeedback && currentQuestion.feedback && (
        <View className={`p-6 rounded-xl mb-8 border-2 ${
          currentQuestion.isCorrect 
            ? "bg-green-50 border-green-300" 
            : "bg-orange-50 border-orange-300"
        }`}>
          <View className="flex-row items-center mb-3">
            {currentQuestion.isCorrect ? (
              <CheckCircle size={28} color="#22c55e" style={{ marginRight: 12 }} />
            ) : (
              <XCircle size={28} color="#f59e0b" style={{ marginRight: 12 }} />
            )}
            <Text className={`text-xl font-bold ${
              currentQuestion.isCorrect ? "text-green-800" : "text-orange-800"
            }`}>
              {currentQuestion.isCorrect ? "Correct!" : "Not quite right"}
            </Text>
          </View>
          <Text className={`text-lg leading-7 ${
            currentQuestion.isCorrect ? "text-green-800" : "text-orange-800"
          }`}>
            {currentQuestion.feedback}
          </Text>
          {!currentQuestion.isCorrect && (
            <Text className="text-lg text-orange-800 mt-3 font-medium">
              The answer was: {currentQuestion.correctAnswer}
            </Text>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View className="flex-row gap-4 pb-6">
        {!showFeedback ? (
          <TouchableOpacity
            className="flex-1 rounded-full px-6 py-4 bg-green-700"
            onPress={handleSubmitAnswer}
            disabled={!userAnswer.trim()}
          >
            <Text className="text-white text-xl font-bold text-center">Submit Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="flex-1 rounded-full px-6 py-4 bg-green-700"
            onPress={handleNextQuestion}
          >
            <View className="flex-row items-center justify-center">
              <Text className="text-white text-xl font-bold mr-2">
                {currentQuestionIndex === currentQuiz.length - 1 ? "Finish Quiz" : "Next Question"}
              </Text>
              <ArrowRight size={24} color="white" />
            </View>
          </TouchableOpacity>
        )}
        
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