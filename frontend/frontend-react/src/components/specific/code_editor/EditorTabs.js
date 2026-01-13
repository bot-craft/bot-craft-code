// components/specific/code_editor/EditorTabs.js

import React from 'react';
import { Box, Tab, Tabs, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const EditorTabs = ({ openFiles, activeFile, onFileSelect, onFileClose, theme }) => {
  const tabsContainerRef = React.useRef(null);

  const handleTabsWheel = (e) => {
    // Permitir scroll horizontal con rueda del ratón sin pulsar Shift
    if (e.deltaY !== 0) {
      // Intentamos encontrar el contenedor scroller de MUI
      const container = tabsContainerRef.current?.querySelector('.MuiTabs-scroller');
      if (container) {
        container.scrollLeft += e.deltaY;
        // Prevenir el scroll vertical de la ventana si estamos sobre las tabs
        // e.preventDefault(); // Nota: React SyntheticEvent no siempre soporta preventDefault en onWheel para scroll pasivo.
      }
    }
  };

  return (
    <Box 
      ref={tabsContainerRef}
      onWheel={handleTabsWheel}
      sx={{ 
        bgcolor: theme.tabBg,
        borderBottom: 1,
        borderColor: theme.border,
        // Estilos para la barra de scroll horizontal
        '& .MuiTabs-scroller': {
          overflowX: 'auto !important',
          // Scrollbar estilo VS Code (discreto)
          '&::-webkit-scrollbar': {
            height: '4px', // Altura pequeña
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.mode === 'dark' ? 'rgba(121, 121, 121, 0.4)' : 'rgba(100, 100, 100, 0.4)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent'
          },
          // Firefox
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.mode === 'dark' ? 'rgba(121, 121, 121, 0.4)' : 'rgba(100, 100, 100, 0.4)'} transparent`,
        }
      }}
    >
      <Tabs
        value={activeFile}
        onChange={(e, newValue) => onFileSelect(newValue)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: '35px',
          '.MuiTab-root': {
            minHeight: '35px',
            fontSize: '13px',
            color: theme.iconColor,
            textTransform: 'none',
            borderRight: 1, // Borde vertical para separar tabs
            borderColor: theme.border,
            '&.Mui-selected': {
              color: theme.text,
              bgcolor: theme.bg
            }
          }
        }}
      >
        {openFiles.map((file) => (
          <Tab
            key={file.path}
            value={file.path}
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {file.path.split('/').pop()}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileClose(file.path);
                  }}
                  component="span"
                  sx={{ 
                    ml: 1, 
                    p: 0.2,
                    color: theme.iconColor,
                    '&:hover': {
                      bgcolor: theme.hoverBg,
                      color: theme.text
                    }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Box>
            }
          />
        ))}
      </Tabs>
    </Box>
  );
};

export default EditorTabs;