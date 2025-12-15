import React, { useState, useEffect } from 'react';
import { Box, TextField, IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';

const EditorChatInput = ({ onSendMessage, disabled, theme }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);

  // Initialize speech recognition on component mount
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setMessage(transcript);
      };
      
      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsRecording(false);
      };
      
      recognitionInstance.onend = () => {
        setIsRecording(false);
      };
      
      setRecognition(recognitionInstance);
    }
    
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognition) return;
    
    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message);
      setMessage('');
      if (isRecording && recognition) {
        recognition.stop();
        setIsRecording(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: 1.5,
        borderTop: 1,
        borderColor: theme.chatBorder,
        backgroundColor: theme.chatBg,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      <TextField
        multiline
        maxRows={4}
        placeholder="Ask Taskyto Assistant..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        fullWidth
        variant="outlined"
        size="small"
        sx={{
          '& .MuiOutlinedInput-root': {
            backgroundColor: theme.chatHeader, // Usar fondo de cabecera para input
            color: theme.text,
            borderRadius: '6px',
            '& fieldset': {
              borderColor: theme.chatBorder,
            },
            '&:hover fieldset': {
              borderColor: '#58a6ff',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#58a6ff',
            },
          },
          '& .MuiInputBase-input': {
            padding: '8px 10px',
            '&::placeholder': {
              color: theme.iconColor,
              opacity: 0.8
            }
          },
        }}
      />
      
      {('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) && (
        <Tooltip title={isRecording ? "Stop recording" : "Start voice input"}>
          <IconButton
            onClick={toggleRecording}
            disabled={disabled}
            sx={{
              color: isRecording ? '#f85149' : '#58a6ff',
              p: 1,
            }}
          >
            {isRecording ? <MicOffIcon fontSize="small" /> : <MicIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}
      
      <IconButton
        type="submit"
        disabled={disabled || !message.trim()}
        sx={{
          color: disabled || !message.trim() ? theme.iconColor : '#58a6ff',
          p: 1,
        }}
      >
        <SendIcon fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default EditorChatInput;