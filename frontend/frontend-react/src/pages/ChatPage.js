// pages/ChatPage.js

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatSidebar from '../components/specific/chat/chat_sidebar/ChatSidebar';
import ChatArea from '../components/specific/chat/chat_area/ChatArea';
import Chat from '../components/specific/chat/Chat';

import { Box } from '@mui/material';


const ChatPage = () => {

  const { chatbotSlug } = useParams();
  // const [chatSidebarVisible, setChatSidebarVisible] = useState(true);

  // const toggleChatSidebar = () => {
  //   setChatSidebarVisible(!chatSidebarVisible);
  // };

  // const { chatbotSlug } = useParams();


  return (
    <>
      {/* <ChatSidebar
        isVisible={chatSidebarVisible}
        onToggle={toggleChatSidebar} />
      <ChatArea
        chatSidebarVisible={chatSidebarVisible}
        onTogglechatSidebar={toggleChatSidebar}
        selectedChatbot={{ slug: chatbotSlug }}
      /> */}
      <Chat chatbotSlug={chatbotSlug}/>
      {/* <Chat /> */}
    </>
  );
}

export default ChatPage;