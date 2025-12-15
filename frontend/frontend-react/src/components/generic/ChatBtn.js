import { useNavigate } from 'react-router-dom';
import ChatIcon from '@mui/icons-material/Chat';
import { IconButton, Tooltip } from '@mui/material';


const ChatBtn = ({ projectSlug }) => {
    const navigate = useNavigate();

    const handleChatNavigate = () => {
        navigate(`/chat/${projectSlug}`);
    };

    return (
        <Tooltip title="Open Chat">
        <IconButton 
            onClick={handleChatNavigate}
            sx={{ 
            color: '#d4d4d4',
            '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }
            }}
        >
            <ChatIcon />
        </IconButton>
        </Tooltip>
    );
}

export default ChatBtn