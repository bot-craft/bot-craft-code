import CodeIcon from '@mui/icons-material/Code';
import { IconButton, Tooltip } from '@mui/material';
// import React from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';

const CodeEditorBtn = ({ chatbotSlug }) => {
  const navigate = useNavigate();
  
  const handleEditorNavigate = () => {
    navigate(`/editor/${chatbotSlug}`);
  };

  return (
    <Tooltip title="Open Code Editor">
      <IconButton 
        onClick={handleEditorNavigate}
        sx={{ 
          color: 'text.secondary',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <CodeIcon />
      </IconButton>
    </Tooltip>
  );
};

export default CodeEditorBtn;
