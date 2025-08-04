# Memory Vault

A privacy-first, offline memory management app that helps users store, organize, and interact with their personal memories using on-device AI. Powered by Google's Gemma 3n model, Memory Vault keeps all your data completely private and accessible without an internet connection.

📖 For detailed technical information, architecture, and features, please read [Technical Writeup](./technical_writeup.md)

## On-Device AI Model Setup

Memory Vault uses Google's Gemma 3n model that runs entirely on your device for complete privacy. The codebase includes all the necessary bridge code and model integration, but due to GitHub's file size limitations, you'll need to add the model file manually.

### Required Setup:
1. **Download the Gemma 3n model**: Obtain the `.task` file for Gemma 3n
2. **Place in assets folder**: Copy the model file to `assets/gemma.task`

### Credits
This implementation was made possible thanks to these excellent repositories:
- [MediaPipe LLM Inference Android Sample](https://github.com/google-ai-edge/mediapipe-samples/tree/main/examples/llm_inference/android)
- [Gemma3na React Native Integration](https://github.com/zakabdu205/Gemma3na-ReactNative)

## Project Structure

```
memory-vault/
├── src/
│   ├── app/
│   │   ├── contexts/           # React contexts for state management
│   │   └── index.tsx          # Main app entry point
│   ├── screens/               # Main application screens
│   │   ├── OnboardingScreen.tsx    # User onboarding flow
│   │   ├── HomeScreen.tsx          # Main dashboard
│   │   ├── ChatScreen.tsx          # AI chat interface
│   │   ├── NotesScreen.tsx         # Memory creation and editing
│   │   ├── ReminiscenceScreen.tsx  # Memory browsing and therapy
│   │   └── GamesScreen.tsx         # Memory training games
│   ├── games/
│   │   └── completeMemory.tsx      # Memory completion game component
│   ├── hooks/
│   │   ├── useGames.ts            # Memory game logic and state
│   │   ├── useReminiscence.ts     # Reminiscence therapy functionality
│   │   └── useChat.ts             # Chat functionality with AI
│   ├── lib/
│   │   ├── GemmaBridge.ts         # TypeScript bridge to native Gemma module
│   │   ├── ModelManager.ts        # AI model lifecycle management
│   │   ├── FileManager.ts         # File operations and model loading
│   │   └── hooks/                 # Custom React hooks for AI integration
│   ├── database/
│   │   └── DatabaseManager.ts     # SQLite database operations
├── android/
│   └── app/src/main/java/com/memoryvault/
│       └── GemmaBridgeModule.kt   # Native Android module for Gemma integration
├── assets/                       # Static assets (place Gemma model here)
├── technical_writeup.md          # Detailed technical documentation
└── README.md                     # This file
```

## Challenges Faced & Future Improvements

### Current Limitations
- **Audio Processing**: Unfortunately, the current Gemma 3n implementation on Android doesn't support audio input processing. This limits the conversational experience to text and images only.

### Future Enhancements
- **Voice Interaction**: Implement audio understanding capabilities so users can chat and respond using voice commands, making the app more accessible and natural to use
- **Additional Games**: Expand the memory training suite with more diverse cognitive exercises and personalized challenges
- **Enhanced Reminiscence Therapy**: Improve the AI-generated storytelling with richer narrative structures, better theme detection, and more interactive memory exploration features
- **Sync Options**: Optional encrypted local network sync between user's own devices while maintaining privacy
