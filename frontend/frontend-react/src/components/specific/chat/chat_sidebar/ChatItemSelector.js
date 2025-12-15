// components/specific/chat/chat_sidebar/ChatItemSelector.js

import React, { useState } from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, TextField, IconButton, InputAdornment } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const ChatItemSelector = ({ 
  items, 
  itemsName, 
  icon: ItemIcon, 
  onAdd, 
  filterPlaceholder ,
  onItemSelect,
  currentItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const isDeadCoversations = itemsName === "dead conversations";

  // // if items is null or undefined, set it undefined
  // const filteredItems = items?.filter(item =>
  //   item.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  const filteredItems = items?.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const handleItemClick = (item) => {
    if (onItemSelect) {
      onItemSelect(item);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        {!isDeadCoversations &&
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: 'grey.200',
              borderRadius: 20,
              p: 0.5,
              mr: 1,
              border: '1px solid',
              borderColor: "grey.300",
              '&:hover': {
                // bgcolor: 'grey.100',
                borderColor: "black",
              },
            }}
          >
            <IconButton 
              size="small" 
              onClick={onAdd}
              sx={{
                '&:hover': {
                  bgcolor: 'grey.400',
                }, 
              }}
            >
              <AddIcon 
                fontSize="small" 
              />
                </IconButton>
              <ItemIcon sx={{ ml: 0.5 }} />
          </Box>
        }
              <TextField
                fullWidth
                size="small"
                placeholder={filterPlaceholder}
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                  <SearchIcon />
                  </InputAdornment>
                ),
                sx: {
                  borderRadius: 20,
                  '& fieldset': {
                    borderColor: 'grey.300',
                  },
                },
                }}
              />
              </Box>
              {
                (items && items.length > 0) && (filteredItems.length > 0) ?
                (
                <List sx={{ flexGrow: 1, overflow: 'auto' }}>
                  {filteredItems.map((item, index) => (
                    <ListItemButton
                      key={index}
                      sx={{
                        borderRadius: 20,
                        mb: 1,
                        bgcolor: item === currentItem ? 'grey.300' : 'transparent',
                        '&:hover': {
                        bgcolor: 'grey.200',
                        },
                        border: '1px solid',
                        borderColor: item === currentItem ? 'grey.500' : 'lightgrey',
                      }}
                      onClick={() => handleItemClick(item)}
                    >
                      <ListItemIcon>
                        <ItemIcon />
                      </ListItemIcon>

                      <ListItemText 
                        primary={item} 
                        sx={{
                        flex: '1 1 auto',
                        overflow: 'hidden',
                        '& .MuiTypography-root': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          wordBreak: 'break-word'
                          }
                        }}
                      />
                      {/* Options (3 dots button disabled for now) */}
                      {/* <IconButton size="small">
                        <MoreVertIcon fontSize="small" />
                      </IconButton> */}
                    </ListItemButton>
                    )
                    )
                  }
                </List>
                ): (
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  margin : 'auto',
                  marginTop: '10vh', // 10% del alto de la ventana del navegador
                  flexGrow: 1 
              }}>
                <ListItemText primary={<>No <strong>{itemsName}</strong> found 🙁</>} />
              </Box>
            )
          }
    </Box>
  );
}

export default ChatItemSelector;