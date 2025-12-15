// components/specific/chat/Chat.js

import React, { useState } from 'react';
import { Box } from '@mui/material';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatSidebar from './chat_sidebar/ChatSidebar';
import ChatArea from './chat_area/ChatArea';
import MongoDBService from '../../../services/MongoDBService';

const Chat = ({ chatbotSlug }) => {

  const [currentConversation, setCurrentConversation] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [messageInputDisabled, setMessageInputDisabled] = useState(false);

  const getAliveConversations = async () => {
    const convs = await MongoDBService.getConversations(chatbotSlug);

    // console.log("convs DEBUG");
    // console.log(convs);

    // Filtrar y devolver un diccionario solo con las conversaciones vivas
    let aliveConversations = Object.keys(convs)
      .filter(key => !convs[key].is_dead)
      .reduce((obj, key) => {
      obj[key] = convs[key];
      return obj;
      }, {});

    // console.log("getAliveConversations DEBUG");
    // console.log(aliveConversations);

    return aliveConversations
  }
  
  const updateCurrentConversation = async () => {
    let aliveConversations = await getAliveConversations();

    // console.log("aliveConversations");
    // console.log(aliveConversations);

    // console.log("currentConversation");
    // console.log(currentConversation);

    setMessageInputDisabled(false);

    if (!currentConversation) {
      
      const conversation_num = await getAutoIncrementConvName();
      let newConversationName = `Conversation_${conversation_num}`;
      let newConversationId = null;

      if (aliveConversations && Object.keys(aliveConversations).length > 0) {
        newConversationName = Object.keys(aliveConversations)[0];
        newConversationId = aliveConversations[newConversationName]?.id ?? null;

      } else {
        await MongoDBService.createChatbotConversation(chatbotSlug, newConversationName);
        // PENDING: updatear la sidebar para que se vea la nueva conversación
      }

      setConversationId(newConversationId);
      setCurrentConversation(newConversationName);

    } else if (!aliveConversations[currentConversation]) {

      setMessageInputDisabled(true);
      
    }

    aliveConversations = await getAliveConversations();
    
    const currentConversationId = aliveConversations[currentConversation]?.id ?? null;
    setConversationId(currentConversationId);

  //   console.log("currentConversationId");
  //   console.log(currentConversationId);

  //   console.log("aliveConversations[currentConversation]");
  //   console.log(aliveConversations[currentConversation]);
    
  //   console.log("-------- END FUNC --------");
  }
  
  useEffect(() => {

    
    updateCurrentConversation();
    // console.log("chat");

  }, [currentConversation, conversationId]);
  
  // ----------------------------
  
  // const [chatSidebarVisible, setChatSidebarVisible] = useState(false);
  const [chatSidebarVisible, setChatSidebarVisible] = useState(true);
  
  const toggleChatSidebar = () => {
    setChatSidebarVisible(!chatSidebarVisible);
  };

  const getAutoIncrementConvName = async () => {
    const currentConversations = await MongoDBService.getConversations(chatbotSlug);
    let conversationList = Object.keys(currentConversations);

    // console.log("#############");
    // console.log("conversationList");
    // console.log(conversationList);

    // console.log("#############");

    const odd_word = "default";
    const prefix_word = "Conversation_";

    const default_idx = conversationList.indexOf(odd_word);

    // Removing the "default element"
    if (default_idx > -1) {
      conversationList.splice(default_idx, 1);
    }

    // console.log("conversationList");
    // console.log(conversationList);
    let conversationIdxList = [];

    if (conversationList.length === 0) {
      return 1
    } else {

      conversationIdxList = conversationList.map( (x) => {
        const number_part = x.slice(prefix_word.length, x.length);
        return parseInt(number_part);
      });
      // console.log("conversationIdxList");
      // console.log(conversationIdxList);
    }

    // console.log("Math.max(conversationIdxList)");
    // console.log(Math.max(...conversationIdxList));

    return Math.max(...conversationIdxList) + 1;
    
  }

  return (
    <>
      <Box sx={{ 
        display: 'flex', 
        backgroundColor: '#e7ebf0',
        width: '100%',
      }}>
        <ChatSidebar
          isVisible={chatSidebarVisible}
          onToggle={toggleChatSidebar}
          currentConversation={currentConversation}
          onConversationSelect={setCurrentConversation}
          chatbotSlug={chatbotSlug}
          conversationId={conversationId}
          setConversationId={setConversationId}
          getAutoIncrementConvName={getAutoIncrementConvName}
          updateCurrentConversation={updateCurrentConversation}
          />
        <ChatArea
          chatbotSlug={chatbotSlug}
          chatSidebarVisible={chatSidebarVisible}
          onTogglechatSidebar={toggleChatSidebar}
          currentConversation={currentConversation}
          setCurrentConversation={setCurrentConversation}
          conversationId={conversationId}
          setConversationId={setConversationId}
          messageInputDisabled={messageInputDisabled}
        /> 
      </Box>
    </>
  );
}

export default Chat;