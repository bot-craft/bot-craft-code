// pages/ProjectsPage.js

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import ProjectsSelection from '../components/main/ProjectSelection';

const ProjectsPage = () => {
  const navigate = useNavigate();

  const handleChatbotSelect = (chatbot) => {
    navigate(`/chat/${chatbot.slug}`);
  };

  const handleChatbotEdit = (chatbot) => {
    navigate(`/editor/${chatbot.slug}`);
  };

  return (
    // <Box sx={{ flexGrow: 1 }}>
      <ProjectsSelection 
        onChatbotSelect={handleChatbotSelect}
        onChatbotEdit={handleChatbotEdit}
      />
    // </Box>
  );
}

export default ProjectsPage;