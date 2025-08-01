package com.anonymous.memoryvault

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.bridge.ReadableArray
import com.google.mediapipe.tasks.core.BaseOptions
import com.google.mediapipe.tasks.genai.llminference.LlmInference
import com.google.mediapipe.tasks.genai.llminference.LlmInferenceSession
import com.google.mediapipe.framework.image.BitmapImageBuilder
import com.google.mediapipe.framework.image.MPImage
import com.google.mediapipe.tasks.core.GraphOptions
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.util.concurrent.Executors
import java.io.File
import java.io.ByteArrayOutputStream
import android.util.Base64

// Simplified Android bridge - only core MediaPipe operations
class GemmaBridgeModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private var llmInference: LlmInference? = null
    private val backgroundExecutor = Executors.newSingleThreadExecutor()

    override fun getName() = "GemmaBridge"

    // MARK: - Core Model Operations

    @ReactMethod
    fun loadModel(filePath: String, useGPU: Boolean, promise: Promise) {
        backgroundExecutor.execute {
            try {
                // The path provided by the JS layer is now always an absolute path
                // to the model file in the app's internal storage.
                val modelFile = File(filePath.replace("file://", ""))
                if (!modelFile.exists()) {
                    promise.reject("MODEL_NOT_FOUND", "Model file not found at path: ${modelFile.absolutePath}")
                    return@execute
                }

                // Create MediaPipe options
                val baseOptionsBuilder = BaseOptions.builder()
                baseOptionsBuilder.setModelAssetPath(modelFile.absolutePath)

                // Set backend based on preference and device capability
                if (useGPU && isGPUSupported()) {
                    try {
                        baseOptionsBuilder.setDelegate(BaseOptions.Delegate.GPU)
                    } catch (e: Exception) {
                        // Fallback to CPU if GPU fails
                        baseOptionsBuilder.setDelegate(BaseOptions.Delegate.CPU)
                    }
                } else {
                    baseOptionsBuilder.setDelegate(BaseOptions.Delegate.CPU)
                }

                val options = LlmInference.LlmInferenceOptions.builder()
                    .setBaseOptions(baseOptionsBuilder.build())
                    .setMaxNumImages(1) // Support for Gemma-3n multimodal
                    .build()

                // Load model
                llmInference = LlmInference.createFromOptions(reactContext, options)
                promise.resolve(true)

            } catch (e: Exception) {
                promise.reject("MODEL_LOAD_FAILED", "Failed to load model: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun unloadModel(promise: Promise) {
        backgroundExecutor.execute {
            try {
                llmInference?.close()
                llmInference = null
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("UNLOAD_ERROR", "Failed to unload model: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun isModelLoaded(promise: Promise) {
        promise.resolve(llmInference != null)
    }

    // MARK: - Simple Inference

    @ReactMethod
    fun generateResponse(prompt: String, promise: Promise) {
        val inference = llmInference
        if (inference == null) {
            promise.reject("MODEL_NOT_LOADED", "Model is not loaded")
            return
        }

        backgroundExecutor.execute {
            try {
                val startTime = System.currentTimeMillis()
                
                val response = inference.generateResponse(prompt)
                
                val endTime = System.currentTimeMillis()
                val inferenceTimeMs = endTime - startTime
                val tokenCount = estimateTokenCount(response)

                val result = WritableNativeMap().apply {
                    putString("response", response)
                    putDouble("inferenceTimeMs", inferenceTimeMs.toDouble())
                    putInt("tokenCount", tokenCount)
                }

                promise.resolve(result)

            } catch (e: Exception) {
                promise.reject("INFERENCE_ERROR", "Inference failed: ${e.message}", e)
            }
        }
    }

    @ReactMethod
    fun generateResponseWithImages(prompt: String, imagePaths: ReadableArray, promise: Promise) {
        val inference = llmInference
        if (inference == null) {
            promise.reject("MODEL_NOT_LOADED", "Model is not loaded")
            return
        }

        backgroundExecutor.execute {
            try {
                val startTime = System.currentTimeMillis()
                
                // Create session options with vision modality enabled
                val sessionOptions = LlmInferenceSession.LlmInferenceSessionOptions.builder()
                    .setTopK(40)
                    .setTemperature(0.8f)
                    .setGraphOptions(GraphOptions.builder().setEnableVisionModality(true).build())
                    .build()

                // Create session for multimodal inference
                inference.use { llm ->
                    LlmInferenceSession.createFromOptions(llm, sessionOptions).use { session ->
                        
                        // Add text prompt
                        session.addQueryChunk(prompt)
                        
                        // Process and add images (limit to 1 for Gemma-3n)
                        val maxImages = minOf(imagePaths.size(), 1) // Gemma-3n supports max 1 image
                        for (i in 0 until maxImages) {
                            val imagePath = imagePaths.getString(i)
                            val mpImage = loadImageAsMPImage(imagePath)
                            if (mpImage != null) {
                                session.addImage(mpImage)
                            }
                        }
                        
                        // Generate response
                        val response = session.generateResponse()
                        
                        val endTime = System.currentTimeMillis()
                        val inferenceTimeMs = endTime - startTime
                        val tokenCount = estimateTokenCount(response)

                        val result = WritableNativeMap().apply {
                            putString("response", response)
                            putDouble("inferenceTimeMs", inferenceTimeMs.toDouble())
                            putInt("tokenCount", tokenCount)
                        }

                        promise.resolve(result)
                    }
                }

            } catch (e: Exception) {
                promise.reject("INFERENCE_ERROR", "Multimodal inference failed: ${e.message}", e)
            }
        }
    }

    // MARK: - Device Info

    @ReactMethod
    fun getDeviceInfo(promise: Promise) {
        val deviceInfo = WritableNativeMap().apply {
            putString("platform", "Android")
            putBoolean("supportsGPU", isGPUSupported())
            putInt("totalMemoryMB", getTotalMemoryMB())
        }
        promise.resolve(deviceInfo)
    }

    // MARK: - Image Processing Helper Methods

    private fun loadImageAsMPImage(imagePath: String): MPImage? {
        return try {
            val bitmap = loadBitmapFromPath(imagePath)
            if (bitmap != null) {
                // Convert bitmap to MPImage for MediaPipe
                BitmapImageBuilder(bitmap).build()
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    private fun loadBitmapFromPath(imagePath: String): Bitmap? {
        return try {
            val file = File(imagePath.replace("file://", ""))
            if (file.exists()) {
                BitmapFactory.decodeFile(file.absolutePath)
            } else {
                null
            }
        } catch (e: Exception) {
            null
        }
    }

    // MARK: - Helper Methods

    private fun isGPUSupported(): Boolean {
        return try {
            android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N &&
            reactContext.packageManager.hasSystemFeature(android.content.pm.PackageManager.FEATURE_VULKAN_HARDWARE_COMPUTE) &&
            getTotalMemoryMB() >= 4000 // Minimum 4GB RAM for GPU mode
        } catch (e: Exception) {
            false
        }
    }

    private fun getTotalMemoryMB(): Int {
        val activityManager = reactContext.getSystemService(android.content.Context.ACTIVITY_SERVICE) as android.app.ActivityManager
        val memInfo = android.app.ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memInfo)
        return (memInfo.totalMem / (1024 * 1024)).toInt()
    }

    private fun estimateTokenCount(text: String): Int {
        // Simple estimation: ~4 characters per token
        return maxOf(1, text.length / 4)
    }

    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        backgroundExecutor.execute {
            llmInference?.close()
            llmInference = null
        }
    }
}
