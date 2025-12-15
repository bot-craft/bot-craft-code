// components/specific/code_editor/StatusBar.js

import React from 'react';
import { Box, Typography } from '@mui/material';

const StatusBar = ({ theme }) => {
  return (
    <Box sx={{ 
      height: '22px',
      bgcolor: '#007acc', // VSCode blue status bar (standard in both dark/light usually)
      display: 'flex',
      alignItems: 'center',
      px: 1,
      fontSize: '12px',
      color: 'white',
      borderTop: 1,
      borderColor: theme?.border || 'transparent' // Optional border based on theme
    }}>
      <Typography variant="caption">
        Line 1, Column 1
      </Typography>
    </Box>
  );
};

export default StatusBar;