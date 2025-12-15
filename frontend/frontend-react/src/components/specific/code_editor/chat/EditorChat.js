import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, IconButton, CircularProgress, Divider, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import EditorChatMessage from './EditorChatMessage';
import EditorChatInput from './EditorChatInput';
import EditorChatService from '../../../../services/EditorChatService';
import MongoDBService from '../../../../services/MongoDBService';
import ThemeToggleButton from '../ThemeToggleButton'; // Importar botón

const EditorChat = ({ 
  isOpen, 
  onClose, 
  projectSlug, 
  editorContent, 
  files, 
  onFileSystemChange, 
  onUpdateOpenFile, 
  openFiles,
  theme, // Nueva prop
  isDarkMode, // Nueva prop
  onToggleTheme // Nueva prop
}) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamedResponse, setStreamedResponse] = useState('');
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Load conversation history on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      const history = await EditorChatService.getConversationHistory();
      setMessages(history);
    };
    
    loadChatHistory();
  }, []);

  // Save conversation history when it changes
  useEffect(() => {
    if (messages.length > 0) {
      EditorChatService.saveConversationHistory(messages);
    }
  }, [messages]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamedResponse]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSendMessage = async (text) => {
    // Add user message to chat
    const userMessage = {
      text,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setStreamedResponse('');
    
    try {
      // Get all files in the project to provide context
      // This would need to be implemented in EditorChatService
      const projectFiles = await EditorChatService.getProjectFiles(projectSlug);

      // FABADA: Pillar la API key
      const userData = await MongoDBService.getCurrentUser();

      const api_key = userData?.api_key;

      // console.log("API Key del usuario en el assistant chat:", api_key);

      // Send message to backend with project context
      const response = await EditorChatService.sendMessage(
        text,
        api_key,
        null,
        (chunk) => {
          setStreamedResponse(prev => prev + chunk);
        },
        {
          projectFiles,
          currentFile: editorContent?.path,
          currentFileContent: editorContent?.content
        }
      );
      
      // If we got a streamed response, add it to messages
      if (streamedResponse) {
        const botMessage = {
          text: streamedResponse,
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } 
      // If no streaming occurred, handle regular response
      else if (response.success) {
        const botMessage = {
          text: response.answer || "I processed your request successfully.",
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, botMessage]);
      } else {

        // console.log("Response error:", response.error);
        const errorMessage = {
          text: `${response.error}. Make sure your API key is valid and has the necessary permissions.` || "Sorry, I encountered an error while processing your request.",
          isUser: false,
          isError: true,
          timestamp: new Date()
        };
        setMessages(prevMessages => [...prevMessages, errorMessage]);
      }
    } catch (error) {
      const errorMessage = {
        text: `Sorry, an error occurred: ${error.message}`,
        isUser: false,
        isError: true,
        timestamp: new Date()
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setStreamedResponse('');
    }
  };

  const handleClearConversation = async () => {
    setConfirmClearOpen(true);
  };

  const confirmClear = async () => {
    setConfirmClearOpen(false);
    setMessages([]);
    EditorChatService.saveConversationHistory([]);
    // Call backend to clear the chat_history.json file
    try {
      await EditorChatService.clearConversationHistoryBackend();
    } catch (error) {
      console.error('Error clearing backend conversation history:', error);
      // Optionally, show a user notification here if needed
    }
  };

  const cancelClear = () => {
    setConfirmClearOpen(false);
  };

  if (!isOpen) return null;

  return (
    <Box
      sx={{
        position: 'absolute',
        right: 0,
        top: 0,
        width: '450px',
        height: '100%',
        backgroundColor: theme.chatBg, // Usar tema
        display: 'flex',
        flexDirection: 'column',
        borderLeft: 1,
        borderColor: theme.chatBorder, // Usar tema
        zIndex: 1000,
        transition: 'width 0.2s ease',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1.5,
          borderBottom: 1,
          borderColor: theme.chatBorder, // Usar tema
          backgroundColor: theme.chatHeader, // Usar tema
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ color: theme.text, fontWeight: 'medium' }}>
            Taskyto Assistant
            </Typography>
            <ThemeToggleButton isDarkMode={isDarkMode} onToggle={onToggleTheme} />
        </Box>
        
        <Box>
          <Tooltip title="Clear conversation">
            <IconButton 
              size="small" 
              onClick={handleClearConversation} 
              sx={{ color: theme.iconColor, mr: 1 }} // Usar tema
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Close">
            <IconButton size="small" onClick={onClose} sx={{ color: theme.iconColor }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Chat Messages */}
      <Box
        ref={chatContainerRef}
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: theme.chatBg, // Usar tema
          '&::-webkit-scrollbar': {
            width: '10px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.chatBorder, // Usar tema
            borderRadius: '6px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.chatBg, // Usar tema
          },
        }}
      >
        {messages.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            color: theme.iconColor, // Usar tema
            p: 3,
            textAlign: 'center',
          }}>
            <SmartToyIcon sx={{ fontSize: 48, mb: 2, color: '#238636' }} />
            <Typography variant="h6" sx={{ color: theme.text, mb: 1 }}>
              Taskyto Assistant
            </Typography>
            <Typography variant="body2">
              I can help you build Taskyto chatbots, explain YAML syntax, and provide guidance on your projects.
            </Typography>
            <Divider sx={{ my: 2, width: '80%', borderColor: '#30363d' }} />
            <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
              Try asking about module types, YAML syntax, or how to structure your project.
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            <EditorChatMessage
              key={index}
              message={msg.text}
              isUser={msg.isUser}
              isError={msg.isError}
              timestamp={msg.timestamp}
              projectSlug={projectSlug}
              files={files}
              onFileSystemChange={onFileSystemChange}
              onUpdateOpenFile={onUpdateOpenFile}
              openFiles={openFiles}
              theme={theme} // <--- Pasamos el tema aquí
            />
          ))
        )}
        
        {/* Streaming message if active */}
        {isLoading && streamedResponse && (
          <EditorChatMessage
            message={streamedResponse}
            isUser={false}
            isStreaming={true}
            projectSlug={projectSlug}
            files={files}
            onFileSystemChange={onFileSystemChange}
            onUpdateOpenFile={onUpdateOpenFile}
            openFiles={openFiles}
            theme={theme} // <--- Pasamos el tema aquí también
          />
        )}
        
        {/* Loading indicator if no streaming content yet */}
        {isLoading && !streamedResponse && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1.5, 
            color: '#8b949e', // GitHub muted
            ml: 5, // Align with messages (accounting for avatar)
            mt: 1
          }}>
            <CircularProgress size={16} sx={{ color: '#238636' }} /> {/* GitHub green */}
            <Typography variant="body2">Thinking...</Typography>
          </Box>
        )}
        
        <div ref={messagesEndRef} />
      </Box>

      {/* Input area */}
      <EditorChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading} 
        theme={theme} // Pasar el tema al input
      />

      {/* Confirm clear conversation dialog */}
      <Dialog open={confirmClearOpen} onClose={cancelClear}>
        <DialogTitle>Confirm Clear Conversation</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to clear the conversation history? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelClear}>Cancel</Button>
          <Button onClick={confirmClear} color="error">Clear</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EditorChat;