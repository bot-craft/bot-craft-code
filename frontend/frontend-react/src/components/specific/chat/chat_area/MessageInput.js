// components/specific/chat/chat_area/MessageInput.js

import React, { useState, useEffect, useRef } from 'react';
import { Paper, InputBase, IconButton, Tooltip } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MicIcon from '@mui/icons-material/Mic';
import ChatbotService from '../../../../services/ChatbotService';
import MongoDBService from '../../../../services/MongoDBService';

const MessageInput = ({ chatbotSlug, currentConversation, onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');
  const [isChatbotOn, setIsChatbotOn] = useState(true);
  const [isConversationAlive, setIsConversationAlive] = useState(true);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Helper to get alive conversations (copied from Chat.js)
  const getAliveConversations = async () => {
    const convs = await MongoDBService.getConversations(chatbotSlug);
    let aliveConversations = Object.keys(convs)
      .filter(key => !convs[key].is_dead)
      .reduce((obj, key) => {
        obj[key] = convs[key];
        return obj;
      }, {});
    return aliveConversations;
  };

  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      setLoading(true);
      try {
        // Check chatbot status
        const status = await ChatbotService.checkChatbotStatus(chatbotSlug);
        if (isMounted) setIsChatbotOn(status === 'on');
        // Check conversation liveness
        const aliveConvs = await getAliveConversations();
        if (isMounted) setIsConversationAlive(!!aliveConvs[currentConversation]);
      } catch (e) {
        if (isMounted) {
          setIsChatbotOn(false);
          setIsConversationAlive(false);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (chatbotSlug && currentConversation) {
      fetchStatus();
    }
    return () => { isMounted = false; };
  }, [chatbotSlug, currentConversation]);

  // Determine if input should be disabled
  const shouldDisable = disabled || loading || !isConversationAlive || (isConversationAlive && !isChatbotOn);
  const showTooltip = isConversationAlive && !isChatbotOn;
  const tooltipTitle = `Power On ${chatbotSlug} to interact with it`;

  useEffect(() => {
    if (!shouldDisable && inputRef.current) {
      inputRef.current.focus();
    }
  }, [shouldDisable]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!shouldDisable && message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const inputForm = (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      sx={{ 
        p: '2px 4px', 
        display: 'flex', 
        alignItems: 'center',
        borderRadius: '25px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        backgroundColor: shouldDisable ? '#f0f1f3' : '#fff',
        opacity: shouldDisable ? 0.7 : 1,
        pointerEvents: shouldDisable ? 'none' : 'auto',
      }}
    >
      <InputBase
        inputRef={inputRef}
        sx={{ 
          ml: 2, 
          flex: 1,
          '& input': {
            padding: '10px 0',
          }
        }}
        placeholder="Type a message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        inputProps={{ 'aria-label': 'type a message', disabled: shouldDisable }}
        disabled={shouldDisable}
      />
      <IconButton sx={{ p: '10px' }} aria-label="voice" disabled={shouldDisable}>
        <MicIcon />
      </IconButton>
      <IconButton 
        type="submit" 
        sx={{ 
          p: '10px',
          color: '#419fd9',
          '&:hover': {
            backgroundColor: 'rgba(65, 159, 217, 0.1)',
          } 
        }} 
        aria-label="send"
        disabled={shouldDisable}
      >
        <SendIcon />
      </IconButton>
    </Paper>
  );

  return showTooltip ? (
    <Tooltip title={tooltipTitle} placement="top">
      <span style={{ width: '100%' }}>{inputForm}</span>
    </Tooltip>
  ) : inputForm;
}

export default MessageInput;