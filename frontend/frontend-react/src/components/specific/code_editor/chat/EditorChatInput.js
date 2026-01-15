import React, { useState, useEffect, useRef } from 'react';
import { Box, TextField, IconButton, Tooltip, Chip, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import FileAttachmentDialog from './FileAttachmentDialog';

const EditorChatInput = ({ onSendMessage, disabled, theme, history = [], shouldFocus, files }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef(null);
  
  // File attachments state
  const [isAttachmentDialogOpen, setIsAttachmentDialogOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Auto-focus when shouldFocus becomes true (chat opens)
  useEffect(() => {
    if (shouldFocus && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 50);
    }
  }, [shouldFocus]);

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

  const handleToggleFile = (filePath) => {
    setSelectedFiles(prev => {
      if (prev.includes(filePath)) {
        return prev.filter(p => p !== filePath);
      } else {
        return [...prev, filePath];
      }
    });
  };

  const handleRemoveFile = (filePath) => {
    setSelectedFiles(prev => prev.filter(p => p !== filePath));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      // Send both message and files
      onSendMessage(message, selectedFiles);
      setMessage('');
      setSelectedFiles([]);
      setHistoryIndex(-1);
      if (isRecording && recognition) {
        recognition.stop();
        setIsRecording(false);
      }
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
      return;
    }

    if (e.key === 'ArrowUp') {
      if (history.length > 0) {
        e.preventDefault();
        let nextIndex;
        if (historyIndex === -1) {
            nextIndex = history.length - 1;
        } else {
            nextIndex = Math.max(0, historyIndex - 1);
        }
        setHistoryIndex(nextIndex);
        setMessage(history[nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      if (historyIndex !== -1) {
        e.preventDefault();
        const nextIndex = historyIndex + 1;
        if (nextIndex >= history.length) {
            setHistoryIndex(-1);
            setMessage('');
        } else {
            setHistoryIndex(nextIndex);
            setMessage(history[nextIndex]);
        }
      }
      // Removed handleSubmit(e) from here
    }
  };

  return (
    <Box
        sx={{
            p: 1.5,
            borderTop: 1,
            borderColor: theme.chatBorder,
            backgroundColor: theme.chatBg,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
        }}
    >
        {/* Attachments Row */}
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'flex-start',
            flexWrap: 'wrap',
            gap: 0.5
        }}>
            {/* Selected Files Chips */}
            {selectedFiles.map((file) => {
                // Get filename from path
                const filename = file.split('/').pop();
                return (
                    <Chip
                        key={file}
                        label={filename}
                        size="small"
                        onDelete={() => handleRemoveFile(file)}
                        deleteIcon={
                            <CloseIcon 
                                style={{ 
                                    color: theme.iconColor, 
                                    // Make 'x' appear on left as requested? 
                                    // Chips typically have 'x' on right. 
                                    // Customizing to have 'x' on left requires deeper customization or custom component.
                                    // Standard Material UI Chip has delete icon on right.
                                    // To strictly follow "x a su izquierda" (x on left):
                                }} 
                            />
                        }
                        sx={{
                            backgroundColor: theme.chatHeader,
                            color: theme.text,
                            borderColor: theme.border,
                            border: 1,
                            borderRadius: '4px',
                            maxWidth: '150px',
                            '& .MuiChip-label': {
                                padding: '0 8px',
                            },
                            // Reorder children to put delete icon first using flex order hack?
                            // Or just standard Chip which is cleaner.
                            // If strictly required 'x' on left:
                            flexDirection: 'row-reverse',
                            '& .MuiChip-deleteIcon': {
                                margin: '0 0 0 4px', // Adjust margins for reversed order
                            }, 
                            '& .MuiChip-label': {
                                paddingRight: '4px'
                            }
                        }}
                    />
                );
            })}
            
            {shouldFocus ? (
              <Tooltip title="Attach files">
                <IconButton
                    onClick={() => setIsAttachmentDialogOpen(true)}
                    size="small"
                    aria-label="attach files"
                    sx={{
                        color: theme.iconColor,
                        padding: '2px', // Make it smaller/tighter
                        '&:hover': {
                            color: '#58a6ff',
                            backgroundColor: theme.hoverBg
                        }
                    }}
                >
                    <AttachFileIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            ) : (
              <IconButton
                  onClick={() => setIsAttachmentDialogOpen(true)}
                  size="small"
                  aria-label="attach files"
                  sx={{
                      color: theme.iconColor,
                      padding: '2px', // Make it smaller/tighter
                      '&:hover': {
                          color: '#58a6ff',
                          backgroundColor: theme.hoverBg
                      }
                  }}
              >
                  <AttachFileIcon fontSize="small" />
              </IconButton>
            )}
        </Box>

        <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 1,
                width: '100%',
            }}
        >
            <TextField
                inputRef={inputRef}
                multiline
                maxRows={4}
                placeholder="Ask Taskyto Assistant..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
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
          <span>
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
          </span>
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

        <FileAttachmentDialog 
            open={isAttachmentDialogOpen}
            onClose={() => setIsAttachmentDialogOpen(false)}
            files={files}
            selectedFiles={selectedFiles}
            onToggleFile={handleToggleFile}
            theme={theme}
        />
    </Box>
  );
};

export default EditorChatInput;