# The Problem
Memory loss is one of the fastest-growing health challenges worldwide, affecting people across all age groups. While commonly associated with older adults, younger individuals are not immune since severe memory decline can also result from brain injuries, chronic illnesses, mental health conditions, trauma, or even genetic factors.

While a few digital tools exist to support memory management, they share common drawbacks. Most store user data on remote servers, raising serious privacy concerns. Many require constant internet connectivity, creating accessibility barriers for those in low-connectivity areas. Login systems that demand usernames, passwords, or email verification add friction for users who need simplicity, not complexity.

Remembering tasks, important dates, or cherished memories should be effortless. These personal moments should remain securely stored on the user’s own device, not scattered across servers vulnerable to breaches.

Memory Vault was built to address these challenges head-on. It offers a simpler, more private, and more accessible approach to supporting memory without unnecessary hurdles.

# Core Features

**1. Memory Game Integration**  
The system includes an interactive memory training game designed to strengthen recall and engagement. The memory completion game presents partial memories for the user to complete, evaluating the accuracy of their recall and providing feedback or hints when needed. The game leverages the AI system to create adaptive cognitive exercises that are tailored to each user's memories and cognitive patterns, making the training more relevant and effective.

**2. Multimodal Notes**  
The comprehensive note creation system supports titles, descriptions, visual documentation through camera capture or gallery selection, and audio recordings of voices or ambient sounds. Integrated playback features enable users to experience their stored memories through direct audio playback and image viewing within the interface.

**3. Reminiscence Therapy**  
This therapeutic feature helps users reconnect with their past through AI-curated memory experiences. The system analyzes saved notes to identify recurring themes then weaves selected memories into cohesive, story-like narratives. The experience combines gentle storytelling.

**4. Chat with AI**  
The app provides a secure, private, and conversational AI assistant powered by the on-device Gemma 3n model. Users can engage in natural, open-ended conversations, ask questions about their memories, or simply chat to combat loneliness. The interface supports both text and image inputs, allowing the AI to understand and respond to visual context. All conversation history is stored locally in the device's SQLite database, ensuring that every interaction remains completely private and accessible offline.

**5. Private-Offline ready**  
The entire system is engineered to be fully private and functional without an internet connection. All user data including notes, images, audio recordings, and chat logs is stored exclusively on the device's local storage and is never sent to or stored on any external server. The AI model is bundled with the app and runs directly on the device, meaning no network calls are made for inference. This offline-first, privacy-centric design eliminates the need for user accounts or logins, providing a truly anonymous and secure environment where users have complete control over their personal information.


# System Architecture
Memory Vault employs a sophisticated yet streamlined architecture designed around three core principles: **privacy-first design**, **offline-first functionality**, and **cognitive accessibility**. The system operates entirely on-device without any external dependencies, ensuring users maintain complete control over their personal data.

**1. Frontend Architecture (React Native + Expo):** The application uses a screen-based navigation system with six main screens:
   - OnboardingScreen: Initial setup for new users
   - HomeScreen: Main dashboard and navigation hub
   - ChatScreen: AI conversation interface
   - NotesScreen: Create, edit, and organize memories
   - ReminiscenceScreen: Browse and search stored memories
   - GamesScreen: Cognitive training game for memory exercise  
The state management layer is built around a centralized MemoryVaultContext, which maintains the global application state including user data, navigation state, and initialization details. This is supported by a set of custom hooks that modularize functionality.

**2. Local Data Architecture:** Memory Vault follows a local-first storage approach, combining a structured SQLite database with the device’s file system to keep all data fully offline. On installation, the app initializes SQLite as its primary storage, creating a self-contained database that stays entirely on the user’s device and persists across sessions and restarts. Larger files, such as Gemma 3n model files, are stored in the device’s file system. This architecture ensures fast access, complete offline functionality, and strong privacy, as all data remains securely on the user’s device without relying on external servers.

# Integration of Gemma 3n
The integration of Gemma is built on a hybrid architecture that separates high-performance native operations from the application's UI logic. This was achieved by creating a native bridge between the React Native frontend and a custom Kotlin module on Android. At the core of this integration is Google's MediaPipe framework, which runs the Gemma model directly on the user's device. The process is managed through a layered system:

- **Native Layer (Kotlin):** A custom module, `GemmaBridgeModule.kt`, handles all direct interactions with the MediaPipe `LlmInference` task. It's responsible for loading the model from device storage, running inference, and managing the model's lifecycle. It also intelligently determines whether to use the CPU or GPU for inference, checking device capabilities to optimize performance and automatically falling back to CPU if a GPU is not suitable.

- **JavaScript/TypeScript Layer:** On the React Native side, a `ModelManager.ts` class orchestrates the entire process. It communicates with the native module to load/unload the model and run inference. It works with `FileManager.ts`, which handles the model file itself. To ensure the app works completely offline, the Gemma model file is bundled directly within the app's assets. On first launch, `FileManager.ts` copies this model into the app's private, internal storage, making it immediately available without needing a download.

- **React Hooks Layer:** The entire system is abstracted away from the UI by a simple React hook, `useGemmaModel`. This hook provides components with the model's current status (e.g., loading, ready, error) and clean functions to interact with it, making it easy to build features like the AI Chat.

A critical part of the implementation is how the app leverages Gemma's native multimodal capabilities to understand both text and images. When a user submits a prompt with an image, the request flows through our system to deliver a truly contextual response:
1. The text prompt and the image's local file path are passed from the UI to the `ModelManager`.
2. The request is sent across the native bridge to our `GemmaBridgeModule.kt` module.
3. The Kotlin module initiates a special inference session with the model's vision modality enabled.
4. It then loads the user's image from its file path, converts it into a format that MediaPipe can process (`MPImage`), and adds both the image and the text prompt to the session.
5. Finally, the module requests a response from Gemma, which generates text based on the combined context of the user's words and the contents of the image.

# Techstack / Technologies 
**Core Framework:**
- **React Native & Expo:** For cross-platform mobile application development.
- **TypeScript:** For type-safe JavaScript development.

**On-Device AI:**
- **Google MediaPipe (tasks-genai:0.10.11):** For running the Gemma 3n model directly on the device.
- **Kotlin:** For building the native bridge to communicate with the MediaPipe library on Android.

**Data Storage:**
- **Expo-SQLite:** For local, on-device database management.
- **Expo-File-System:** For managing larger files like the AI model and audio recordings.

**UI & Styling:**
- **Nativewind:** For utility-first styling using Tailwind CSS in React Native.
- **React Navigation:** For routing and navigation between screens.

**Key Libraries:**
- **Expo-Router:** For file-based routing.
- **Expo-Audio & Expo-Image-Picker:** For handling multimodal inputs (audio and images).


# Conclusion
Memory Vault represents a paradigm shift toward truly private, accessible cognitive support technology. By keeping personal memories entirely on-device while leveraging advanced AI capabilities, it demonstrates that privacy and functionality need not be mutually exclusive. As memory-related challenges continue to grow globally, solutions like Memory Vault point toward a future where technology empowers users without compromising their most intimate data.
