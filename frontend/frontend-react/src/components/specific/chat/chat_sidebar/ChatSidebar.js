// import React from 'react';
import React, { useState, useEffect } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
// import CodeIcon from '@mui/icons-material/Code';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import ChatItemSelector from './ChatItemSelector';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useNavigate } from 'react-router-dom';
import MongoDBService from '../../../../services/MongoDBService'

import CodeEditorBtn from '../../../generic/CodeEditorBtn';

import ChatbotPowerSitch from '../../../generic/ChatbotPowerSitch';


// const CodeEditorBtn = ({ chatbotSlug }) => {
//   const navigate = useNavigate();
  
//   const handleEditorNavigate = () => {
//     navigate(`/editor/${chatbotSlug}`);
//   };

//   return (
//     <Tooltip title="Open Code Editor">
//       <IconButton 
//         onClick={handleEditorNavigate}
//         sx={{ 
//           color: 'text.secondary',
//           '&:hover': {
//             backgroundColor: 'rgba(0, 0, 0, 0.04)'
//           }
//         }}
//       >
//         <CodeIcon />
//       </IconButton>
//     </Tooltip>
//   );
// };

const ChatSidebar = ({ 
  isVisible, 
  onToggle, 
  // FABADA: pending este para que se quede seleccionado
  currentConversation, 
  onConversationSelect, 
  chatbotSlug,
  conversationId,
  setConversationId,
  getAutoIncrementConvName,
  updateCurrentConversation
}) => {
  const chatbots = ['Bot 1', 'Bot 2', 'Bot 3'];
  const chats = ['Mountain', 'Pizza', 'A'];

  const [conversationList, setConversationList] = useState([]);

  const [aliveConversationList, setAliveConversationList] = useState([]);
  const [deadConversationList, setDeadConversationList] = useState([]);

  // Load conversations for the current chatbot
  const fetchConversations = async () => {
    try {
      const convs = await MongoDBService.getConversations(chatbotSlug);
      
      const aliveConversations = Object.keys(convs).filter(key => !convs[key].is_dead);
      const deadConversations = Object.keys(convs).filter(key => convs[key].is_dead);

      // console.log('Alive Conversations:');
      // console.log(aliveConversations);

      // console.log('Dead Conversations:');
      // console.log(deadConversations);
      
      // console.log('Conversations:');
      // console.log(convs);

      // console.log('Conversations keys:');
      // console.log(Object.keys(convs));

      setConversationList(Object.keys(convs));

      setAliveConversationList(aliveConversations);
      setDeadConversationList(deadConversations);

    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
    // console.log("sidebar");

  }, [chatbotSlug, currentConversation]);  

  const handleAddConversation = async () => {

    const conversation_num = await getAutoIncrementConvName();

    // FABADA: obtener la id?
    // const newConversationName = `Conversation_${Date.now()}`;
    const newConversationName = `Conversation_${conversation_num}`;
    await MongoDBService.createChatbotConversation(chatbotSlug, newConversationName);
    
    // // Update local state
    // setConversationList(prev => [...prev, newConversationName]);
    setAliveConversationList(prev => [...prev, newConversationName]);
    
    // Automatically select the new conversation
    onConversationSelect(newConversationName);
  };

  return (
    <Box
      sx={{
        width: '25%',
        minWidth: 240,
        maxWidth: 320,
        flexShrink: 0,
        bgcolor: 'grey.100',
        display: isVisible ? 'flex' : 'none',
        flexDirection: 'column',
        height: '100%',
        boxShadow: 3,
      }}
    >
      <Box 
        sx={{ 
          p: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1
      }}>
        <IconButton onClick={onToggle}>
          <MenuIcon />
        </IconButton>
        <CodeEditorBtn chatbotSlug={chatbotSlug} />
        <ChatbotPowerSitch 
            bot={{slug: chatbotSlug, name: chatbotSlug, active: true}}
            onToggle={ 
              async () => {
                onConversationSelect(null);
                await updateCurrentConversation();
                await fetchConversations();
              }
            }
        />
      </Box>
      <PanelGroup direction="vertical" style={{ height: 'calc(100% - 48px)' }}>
        {/* <Panel>
            <ChatItemSelector
              items={chatbots}
              icon={SmartToyOutlinedIcon}
              onAdd={() => console.log('Add chatbot')}
              filterPlaceholder="Filter Chatbots"
            />
          </Panel>
        <PanelResizeHandle style={{ height: 8, backgroundColor: '#ddd', cursor: 'row-resize' }} /> */}
        <Panel>
          <ChatItemSelector
            items={aliveConversationList}
            itemsName="alive conversations"
            icon={ChatOutlinedIcon}
            onAdd={handleAddConversation}
            filterPlaceholder="Filter Chats"
            onItemSelect={onConversationSelect}
            currentItem={currentConversation}
            />
        </Panel>
        <PanelResizeHandle style={{ height: 8, backgroundColor: '#ddd', cursor: 'row-resize' }} />
        <Panel>
          <ChatItemSelector
            items={deadConversationList}
            itemsName="dead conversations"
            icon={ChatOutlinedIcon}
            onAdd={handleAddConversation}
            filterPlaceholder="Filter Dead Conversations 💀"
            onItemSelect={onConversationSelect}
            currentItem={currentConversation}
          />
        </Panel>
      </PanelGroup>
    </Box>
  );
}

export default ChatSidebar;