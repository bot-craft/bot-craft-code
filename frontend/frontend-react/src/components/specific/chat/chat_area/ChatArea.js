// components/specific/chat/chat_area/ChatArea.js

// import React from 'react';
import React, { useState, useRef, useEffect } from 'react';
// import { Box, Paper, Typography, IconButton } from '@mui/material';
import { Box, Paper, IconButton, CircularProgress } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MessageInput from './MessageInput';
import MongoDBService from '../../../../services/MongoDBService'
import ChatbotService from '../../../../services/ChatbotService';
import ReactMarkdown from 'react-markdown';

// ******ToDo******:
// Añadir el timestamp en los argumentos del componente
// y mostrarlo (la parte de la hora del timestamp) en el componente como si de un mensaje de red social se tratase
const Message = ({ message, isBot, timestamp }) => (
  <Box sx={{ 
    display: 'flex', 
    justifyContent: isBot ? 'flex-start' : 'flex-end',
    mb: 2,
  }}>
    <Paper elevation={1} sx={{ 
      py: 2,
      px: 3,
      maxWidth: '80%',
      borderRadius: '20px',
      backgroundColor: isBot ? '#ffffff' : '#419fd9',
      whiteSpace: 'pre-line',
      color: isBot ? 'black' : 'white',
      fontSize: '1.1rem',
      lineHeight: "1.4rem",
      // Se aplica a los párrafos y listas generados por ReactMarkdown
      '& > *': {
        margin: 0
      },
      'p, ol, ul': {
        marginBlockStart: '0.125em',
        marginBlockEnd: '0.125em',
        wordBreak: 'break-word'
      },
      wordBreak: 'break-word'
    }}>
       <Box>
        {isBot ? <ReactMarkdown>{message}</ReactMarkdown> : <p>{message}</p>}
        <small style={{ 
          display: 'block', 
          textAlign: isBot ? 'left' : 'right', 
          fontSize: '0.7em', 
          color: isBot ? '#666' : '#f0f0f0',
          marginTop: '8px'
        }}>
          {new Date(timestamp).toLocaleString()}
        </small>
      </Box>
    </Paper>
  </Box>
);

const LoadingIndicator = () => (
  <Box sx={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: 1,
    p: 2,
    maxWidth: 'fit-content',
    borderRadius: '20px',
    backgroundColor: '#ffffff',
  }}>
    <span>🤖 Thinking 🤔</span>
    <br></br>
    <CircularProgress size={20} />
  </Box>
);


const ChatArea = ({ 
  chatbotSlug, 
  chatSidebarVisible, 
  onTogglechatSidebar,
  currentConversation,
  setCurrentConversation,
  conversationId,
  setConversationId,
  messageInputDisabled,
 }) => {
   
   const [messages, setMessages] = useState([]);
   const [isLoading, setIsLoading] = useState(false);
   const messagesEndRef = useRef(null);
   const [isAliveConversation, setIsAliveConversation] = useState(false);
  
   // Load existing conversation messages when conversation changes
   useEffect(() => {
    const loadConversationMessages = async () => {
      if (currentConversation) {
        try {
          const existingMessages = await MongoDBService.getConversationMessages(
            chatbotSlug, 
            currentConversation
          );
          setMessages(existingMessages);
        } catch (error) {
          console.error('Error loading conversation messages:', error);
        }
      }
    };

    loadConversationMessages();
    // console.log("chatArea");
  }, [currentConversation, chatbotSlug]);

  
  // ******ToDo******: 
  // ToDo el nombre de la conversación también será una variable de estado. Se llamará "currentConversationName".

  // ******ToDo******: 
  // Obtener los mensajes en MongoDB dado el ChatbotSlug y el nombre de la conversación . 
  // El contenido de "messages" debería ser -> <chatbots.<chatbotSlug>.conversations.<currentConversationName>.<interaction>>
  
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // const retr
  
  
  const handleSendMessage = async (message) => {
    // Add user message
    // Cambia a toISOString() para un formato estándar y parseable
    const userTimestamp = new Date().toISOString();
    
    // ******ToDo******: 
    // Si de momento no hay conversaciones creadas, y se invoca a esta función, al escribir el primer mensaje se creará una conversación con un nombre aleatorio y esa se convertirá en la conversación seleccionada.
    
    // console.log(userTimestamp);
    
    // If no conversation is selected, create a new one
    
    try {
      
      setIsLoading(true);
      
      // Escribir user msg en la db
      const userMessage = {
        text: message,
        isBot: false,
        timestamp: userTimestamp
      };
      
      setMessages(prev => [...prev, userMessage]);
      await MongoDBService.addMessageToConversation(
        chatbotSlug,
        currentConversation,
        userMessage,
        conversationId
      );

      // Message to chatbot
      const chatbotResponse = await ChatbotService.sendMsgToChatbot(chatbotSlug, message, conversationId);
      // const chatbotResponse = await sendMsgToChatbot(chatbotSlug, message, conversationId);
      
      if (!chatbotResponse.success) {
        
        const errorMessage = { 
          text: JSON.stringify(chatbotResponse.debug_msg), 
          // text: `${JSON.stringify(chatbotResponse)}`, 
          // text: `${chatbotResponse.deug_msg}`, 
          // text: chatbotResponse.deug_msg, 
          isBot: true,
          timestamp: new Date().toISOString()
        };
        // setMessages(prev => [...prev, errorMessage]);
        
        throw new Error(chatbotResponse.deug_msg);
      }

      const botConversationId = chatbotResponse.data.id;
      const botResponse = chatbotResponse.data.message;
      let botTimestamp = chatbotResponse.data.timestamp;
      
      // Normalizar el timestamp del bot a ISO (manejo de errores si no es válido)
      try {
        botTimestamp = new Date(botTimestamp).toISOString();
      } catch (error) {
        console.warn('Bot timestamp inválido, usando fallback:', botTimestamp);
        botTimestamp = new Date().toISOString(); // Fallback a la fecha actual
      }
      
      setConversationId(botConversationId);

      // console.log(botConversationId);

      // Add bot message to local state and MongoDB
      const botMessage = {
        text: botResponse,
        isBot: true,
        timestamp: botTimestamp
      };

      setMessages(prev => [...prev, botMessage]);
      await MongoDBService.addMessageToConversation(
        chatbotSlug,
        currentConversation,
        botMessage,
		    botConversationId
      );

      
    } catch (error) {
      console.error('Error handling message:', error);
      const errorMessage = { 
        text: `Sorry, I couldn't process your message. An internal error occurred. Please try again.`, 
        isBot: true,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);

    } finally {
      setIsLoading(false);
    }
    
  };

  

  return (
    <Box sx={{ 
      flexGrow: 1, 
      display: 'flex', 
      flexDirection: 'column', 
      p: 2,
      // maxWidth: '1200px',
      maxWidth: '90%',
      margin: '0 auto',
      width: '100%',
      // testing ↓↓
      // height: '100vh',
      // backgroundColor: '#e7ebf0',
    }}>
      {!chatSidebarVisible && (
        <IconButton
          onClick={onTogglechatSidebar}
          sx={{ alignSelf: 'flex-start', mb: 2 }}
        >
          <MenuIcon />
        </IconButton>
      )}
      {`currentConversation: ${currentConversation}`}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        mb: 2,
        px: 2,
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: '#bbb',
          borderRadius: '4px',
        },
      }}>

        {messages.map((msg, index) => (
          // ******ToDo****** 
          //        Tener aquí en cuenta el timestamp para mostrarlo
          //        Como si de una red social se tratase
          //        También dentro del componente "Message"
          //        (arriba del todo)
          <Message key={index} message={msg.text} isBot={msg.isBot} timestamp={msg.timestamp} />
        ))}
        {isLoading && <LoadingIndicator />}
        <div ref={messagesEndRef} />
      </Box>
      <MessageInput chatbotSlug={chatbotSlug} currentConversation={currentConversation} onSendMessage={handleSendMessage}  disabled={isLoading || messageInputDisabled} />
      {`Conversation ID: ${conversationId}`}
    </Box>
  );
}

export default ChatArea;