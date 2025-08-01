import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, createAudioPlayer, AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorderState } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import { useMemoryVault } from '../app/contexts/MemoryVaultContext';
import { DatabaseManager, Note } from '../database/DatabaseManager';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [activeAudioUri, setActiveAudioUri] = useState<string | null>(null);

  const [showCreateEditModal, setShowCreateEditModal] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'paused'>('idle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { setCurrentScreen } = useMemoryVault();

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const playerRef = useRef<any>(null);
  const statusListenerRef = useRef<any>(null);

  useEffect(() => {
    loadNotes();
    requestPermissions();
    return () => cleanupPlayer();
  }, []);

  const cleanupPlayer = () => {
    // Clear the status listener
    if (statusListenerRef.current) {
      statusListenerRef.current.remove();
      statusListenerRef.current = null;
    }

    // Release the player
    if (playerRef.current) {
      try {
        playerRef.current.remove();
      } catch (error) {
        
      }
      playerRef.current = null;
    }

    // Reset all audio states
    setIsPlaying(false);
    setActiveAudioUri(null);
    setCurrentTime(0);
    setDuration(0);
  };

  const requestPermissions = async () => {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const audioPermission = await AudioModule.requestRecordingPermissionsAsync();

    if (cameraPermission.status !== 'granted' || mediaLibraryPermission.status !== 'granted' || !audioPermission.granted) {
      Alert.alert('Permissions required', 'Please grant camera, media library, and microphone permissions to use all features.');
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });
  };

  const loadNotes = async () => {
    try {
      const dbManager = DatabaseManager.getInstance();
      const allNotes = await dbManager.getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      
    }
  };

  const handleSaveNote = async () => {
    if (!newNoteTitle.trim() || !newNoteContent.trim()) {
      Alert.alert('Missing information', 'Please add both a title and content for your note.');
      return;
    }

    try {
      const dbManager = DatabaseManager.getInstance();
      const tags = newNoteTags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

      let permanentAudioPath: string | null = audioUri;
      if (audioUri && !audioUri.startsWith(FileSystem.documentDirectory!)) {
        permanentAudioPath = `${FileSystem.documentDirectory}audio_${Date.now()}.m4a`;
        await FileSystem.moveAsync({ from: audioUri, to: permanentAudioPath });
      }

      let permanentImagePaths: string[] = [];
      for (const imageUri of selectedImages) {
        if (imageUri.startsWith('file://')) {
          const permanentImagePath = `${FileSystem.documentDirectory}image_${Date.now()}_${Math.random()}.jpg`;
          await FileSystem.copyAsync({ from: imageUri, to: permanentImagePath });
          permanentImagePaths.push(permanentImagePath);
        } else {
          permanentImagePaths.push(imageUri);
        }
      }

      if (editingNote) {
        const updatedNote: Note = { 
          ...editingNote, 
          title: newNoteTitle.trim(), 
          content: newNoteContent.trim(), 
          tags, 
          hasAudio: !!permanentAudioPath, 
          hasImages: permanentImagePaths.length > 0, 
          audioPath: permanentAudioPath, 
          imagePaths: permanentImagePaths 
        };
        await dbManager.updateNote(updatedNote);
        Alert.alert('Success', 'Your memory has been updated!');
      } else {
        const noteData: Omit<Note, 'id'> = { 
          title: newNoteTitle.trim(), 
          content: newNoteContent.trim(), 
          timestamp: Date.now(), 
          tags, 
          hasAudio: !!permanentAudioPath, 
          hasImages: permanentImagePaths.length > 0, 
          audioPath: permanentAudioPath, 
          imagePaths: permanentImagePaths 
        };
        await dbManager.createNote(noteData);
        Alert.alert('Success', 'Your memory has been saved!');
      }

      await resetForm();
      loadNotes();
    } catch (error) {
      Alert.alert('Error', 'Failed to save your note. Please try again.');
    }
  };

  const resetForm = async () => {
    if (recordingStatus !== 'idle') {
      await stopRecording(false);
    }
    
    cleanupPlayer();
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteTags('');
    setSelectedImages([]);
    setAudioUri(null);
    setEditingNote(null);
    setShowCreateEditModal(false);
  };

  const handleOpenCreateModal = async () => {
    await resetForm();
    setShowCreateEditModal(true);
  };

  const handleOpenEditModal = (note: Note) => {
    setViewingNote(null);
    setEditingNote(note);
    setNewNoteTitle(note.title);
    setNewNoteContent(note.content);
    setNewNoteTags(note.tags.join(', '));
    setSelectedImages(note.imagePaths || []);
    setAudioUri(note.audioPath || null);
    setShowCreateEditModal(true);
  };

  const handleDeleteNote = async (id: number) => {
    Alert.alert('Delete Memory', 'Are you sure you want to permanently delete this memory?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            const dbManager = DatabaseManager.getInstance();
            await dbManager.deleteNote(id);
            setViewingNote(null);
            loadNotes();
            Alert.alert('Deleted', 'The memory has been deleted.');
          } catch (error) {
            Alert.alert('Error', 'Failed to delete the memory.');
          }
        }
      },
    ]);
  };

  const pickImageAsync = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ['images'],
      allowsEditing: true, 
      quality: 1 
    });
    if (!result.canceled) {
      setSelectedImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const takePhoto = async () => {
    let result = await ImagePicker.launchCameraAsync({ 
      allowsEditing: true, 
      quality: 1 
    });
    if (!result.canceled) {
      setSelectedImages(prev => [...prev, result.assets[0].uri]);
    }
  };

  const startRecording = async () => {
    try {
      cleanupPlayer();
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setRecordingStatus('recording');
    } catch (err) {
      Alert.alert("Recording Error", "Failed to start recording. Please ensure you have granted microphone permissions.");
    }
  };

  const pauseRecording = async () => {
    try {
      audioRecorder.pause();
      setRecordingStatus('paused');
    } catch (error) {
      Alert.alert("Recording Error", "Failed to pause recording.");
    }
  };

  const resumeRecording = async () => {
    try {
      audioRecorder.record();
      setRecordingStatus('recording');
    } catch (error) {
      Alert.alert("Recording Error", "Failed to resume recording.");
    }
  };

  const stopRecording = async (save: boolean = true) => {
    try {
      await audioRecorder.stop();
      const uri = audioRecorder.uri;
      setRecordingStatus('idle');
      if (save && uri) {
        setAudioUri(uri);
      } else if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
        setAudioUri(null);
      }
    } catch (error) {
      Alert.alert("Recording Error", "Failed to stop recording.");
    }
  };

  const playSound = async (uri: string) => {
    try {
      const isThisSoundActive = activeAudioUri === uri;

      // If this audio is currently playing, pause it
      if (isPlaying && isThisSoundActive && playerRef.current) {
        playerRef.current.pause();
        return;
      }

      // If this audio is paused, resume it
      if (!isPlaying && isThisSoundActive && playerRef.current) {
        playerRef.current.play();
        return;
      }

      // Clean up any existing player
      cleanupPlayer();

      playerRef.current = createAudioPlayer(uri);
      setActiveAudioUri(uri);

      // Set up status listener
      statusListenerRef.current = playerRef.current.addListener('playbackStatusUpdate', (status) => {
        setIsPlaying(currentIsPlaying => {
            if (status.playbackState === 'playing') {
                return true;
            }
            if (['paused', 'stopped', 'error', 'idle'].includes(status.playbackState)) {
                return false;
            }
            // for 'loading' or other states, don't change the current state
            return currentIsPlaying;
        });

        setCurrentTime(status.currentTime || 0);
        setDuration(status.duration || 0);
        
        if (status.didJustFinish) {
          setIsPlaying(false);
          setCurrentTime(0);
          // Keep the activeAudioUri so replay works
        }
      });
      
      // Start playback
      playerRef.current.seekTo(0);
      playerRef.current.play();
      
      // Immediately set playing state
      setIsPlaying(true);

    } catch (error) {
      cleanupPlayer();
      Alert.alert('Playback Error', 'Failed to play audio. Please try again.');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  // Helper function to check if a specific audio is currently playing
  const isAudioPlaying = (audioPath: string) => {
    return isPlaying && activeAudioUri === audioPath;
  };

  return { 
    notes, editingNote, viewingNote, newNoteTitle, newNoteContent, newNoteTags, selectedImages, audioUri, activeAudioUri, 
    showCreateEditModal, recordingStatus, isPlaying, currentTime, duration, setViewingNote, setNewNoteTitle, setNewNoteContent, 
    setNewNoteTags, setAudioUri, setShowCreateEditModal, loadNotes, handleSaveNote, resetForm, handleOpenCreateModal, 
    handleOpenEditModal, handleDeleteNote, pickImageAsync, takePhoto, startRecording, pauseRecording, resumeRecording, 
    stopRecording, playSound, formatDate, formatTime, removeImage, setCurrentScreen, isAudioPlaying,
  };
};
