import React, { useState } from 'react';
import { Box, Paper, Typography, Avatar, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// Importamos 'vs' para el modo claro junto con 'vscDarkPlus' para el oscuro
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import { Close } from '@mui/icons-material';
import axios from '../../../../services/axios';

const findFileInTree = (path, nodes) => {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findFileInTree(path, node.children);
      if (found) return found;
    }
  }
  return null;
};

// Añadimos 'theme' a las props desestructuradas
const CodeRenderer = ({ node, inline, className, children, projectSlug, files, onFileSystemChange, onUpdateOpenFile, openFiles, theme, ...props }) => {
    const [isCopied, setIsCopied] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showSuccessDialog, setShowSuccessDialog] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorDialog, setShowErrorDialog] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    
    const match = /language-(\w+)/.exec(className || '');
    
    const rawCode = String(children).replace(/\n$/, '');
    const fileHeaderRegex = /# -----> File: (.*?) <-----\n?/;
    const headerMatch = rawCode.match(fileHeaderRegex);
    
    const filePath = headerMatch ? headerMatch[1].trim() : null;
    const codeContent = filePath ? rawCode.replace(fileHeaderRegex, '') : rawCode;

    const handleCopy = () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeContent).then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        });
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = codeContent;
        
        textArea.style.position = 'fixed';
        textArea.style.top = '-9999px';
        textArea.style.left = '-9999px';

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
          document.execCommand('copy');
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2500);
        } catch (err) {
          console.error('Fallback: Unable to copy', err);
        }

        document.body.removeChild(textArea);
      }
    };

    const handleCreateOrUpdateFile = async () => {
        if (!filePath || !projectSlug) return;

        const fileExists = findFileInTree(filePath, files);
        
        if (fileExists) {
            setShowConfirmDialog(true);
        } else {
            await executeCreateFile();
        }
    };

    const executeCreateFile = async () => {
        const isFileOpen = openFiles?.some(file => file.path === filePath);
        
        try {
            console.log('Creating new file at path:', filePath);

            await axios.post(`/api/projects/${projectSlug}/files`, {
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                path: filePath,
                type: 'file',
                content: codeContent
              })
            });
            
            setSuccessMessage('File created successfully!');
            setShowSuccessDialog(true);
            
            if (onFileSystemChange) {
                onFileSystemChange();
            }
        } catch (error) {
            console.error('Error creating file:', error);
            setErrorMessage(`Failed to create file: ${error.response?.data?.error || error.message}`);
            setShowErrorDialog(true);
        }
    };

    const executeUpdateFile = async () => {
        const isFileOpen = openFiles?.some(file => file.path === filePath);
        
        try {
            await axios.put(`/api/projects/${projectSlug}/files/${filePath}/update`, { 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ content: codeContent })
            });

            if (isFileOpen && onUpdateOpenFile) {
                onUpdateOpenFile(filePath, codeContent);
            }

            setSuccessMessage('File updated successfully!');
            setShowSuccessDialog(true);
            setShowConfirmDialog(false);
            
            if (onFileSystemChange) {
                onFileSystemChange();
            }
        } catch (error) {
            console.error('Error updating file:', error);
            setErrorMessage(`Failed to update file: ${error.response?.data?.error || error.message}`);
            setShowErrorDialog(true);
            setShowConfirmDialog(false);
        }
    };

    if (!inline && match) {
      // Determinar el estilo de sintaxis basado en el tema
      const syntaxStyle = theme?.mode === 'light' ? vs : vscDarkPlus;
      // Determinar el color de fondo del bloque de código
      const codeBackgroundColor = theme?.codeBg || (theme?.mode === 'light' ? '#f6f8fa' : '#161b22');
      const borderColor = theme?.border || 'transparent';

      return (
        <>
          <Box sx={{ position: 'relative' }}>
            <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 1 }}>
              {filePath && onFileSystemChange && (
                <Tooltip title="Create/Update file" placement="top">
                  <IconButton
                    aria-label="create or update file"
                    onClick={handleCreateOrUpdateFile}
                    size="small"
                    sx={{
                      color: '#8b949e',
                      backgroundColor: theme?.mode === 'light' ? '#ffffff' : '#0d1117',
                      border: `1px solid ${borderColor}`,
                      '&:hover': {
                        color: theme?.text || '#c9d1d9',
                        backgroundColor: theme?.mode === 'light' ? '#f3f4f6' : '#161b22',
                      },
                    }}
                  >
                    <NoteAddIcon sx={{ fontSize: '0.875rem' }} />
                  </IconButton>
                </Tooltip>
              )}
              <Tooltip title={isCopied ? 'Copied!' : 'Copy code'} placement="top">
                <IconButton
                  aria-label="copy code"
                  onClick={handleCopy}
                  size="small"
                  sx={{
                    color: '#8b949e',
                    backgroundColor: theme?.mode === 'light' ? '#ffffff' : '#0d1117',
                    border: `1px solid ${borderColor}`,
                    '&:hover': {
                      color: theme?.text || '#c9d1d9',
                      backgroundColor: theme?.mode === 'light' ? '#f3f4f6' : '#161b22',
                    },
                  }}
                >
                  <ContentCopyIcon sx={{ fontSize: '0.875rem' }} />
                </IconButton>
              </Tooltip>
            </Box>
            <SyntaxHighlighter
              style={syntaxStyle}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '6px',
                backgroundColor: codeBackgroundColor,
                border: `1px solid ${borderColor}`,
                fontSize: '0.85rem',
                lineHeight: '1.5',
              }}
              {...props}
            >
              {codeContent}
            </SyntaxHighlighter>
          </Box>

          {/* Confirm Overwrite Dialog */}
          <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
            <DialogTitle>
              Confirm Overwrite
              <IconButton
                aria-label="close"
                onClick={() => setShowConfirmDialog(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography>
                Are you sure you want to overwrite the content of <strong>{filePath}</strong>?
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button color="secondary" onClick={() => setShowConfirmDialog(false)}>
                Cancel
              </Button>
              <Button color="primary" onClick={executeUpdateFile} variant="contained">
                Overwrite
              </Button>
            </DialogActions>
          </Dialog>

          {/* Success Dialog */}
          <Dialog open={showSuccessDialog} onClose={() => setShowSuccessDialog(false)}>
            <DialogTitle>
              Success
              <IconButton
                aria-label="close"
                onClick={() => setShowSuccessDialog(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography>{successMessage}</Typography>
            </DialogContent>
            <DialogActions>
              <Button color="primary" onClick={() => setShowSuccessDialog(false)}>
                OK
              </Button>
            </DialogActions>
          </Dialog>

          {/* Error Dialog */}
          <Dialog open={showErrorDialog} onClose={() => setShowErrorDialog(false)}>
            <DialogTitle>
              Error
              <IconButton
                aria-label="close"
                onClick={() => setShowErrorDialog(false)}
                sx={{
                  position: 'absolute',
                  right: 8,
                  top: 8,
                  color: (theme) => theme.palette.grey[500],
                }}
              >
                <Close />
              </IconButton>
            </DialogTitle>
            <DialogContent>
              <Typography color="error">{errorMessage}</Typography>
            </DialogContent>
            <DialogActions>
              <Button color="primary" onClick={() => setShowErrorDialog(false)}>
                OK
              </Button>
            </DialogActions>
          </Dialog>
        </>
      );
    }

    return (
      <code className={className} {...props}>
        {children}
      </code>
    );
  };


const EditorChatMessage = ({ message, isUser, isError = false, isStreaming = false, timestamp, projectSlug, files, onFileSystemChange, onUpdateOpenFile, openFiles, theme }) => {
  const formattedTime = timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  
  // Determinar colores basados en el tema
  const textColor = isError 
    ? '#f85149' 
    : (isUser ? (theme?.text || '#c9d1d9') : (theme?.chatMessageColor || '#c9d1d9'));
    
  const codeBg = theme?.codeBg || '#161b22';
  const borderColor = theme?.border || '#30363d';
  const headerColor = theme?.text || '#c9d1d9';
  
  // Colores para tablas
  const tableHeaderBg = theme?.mode === 'light' ? '#f6f8fa' : '#161b22';
  const tableRowBg = theme?.mode === 'light' ? '#ffffff' : '#0d1117';

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        mb: 2,
      }}
    >
      <Box
        sx={{
          mr: 1.5,
          mt: 0.5,
        }}
      >
        <Avatar
          sx={{
            bgcolor: isUser ? '#58a6ff' : '#238636',
            width: 28,
            height: 28,
          }}
        >
          {isUser ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
        </Avatar>
      </Box>
      
      <Box
        sx={{
          flex: 1,
          maxWidth: 'calc(100% - 44px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 0.5,
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 600,
              color: isUser ? '#58a6ff' : '#238636',
              fontSize: '0.875rem',
            }}
          >
            {isUser ? 'You' : 'Taskyto Assistant'}
          </Typography>
          
          {timestamp && (
            <Typography 
              variant="caption" 
              sx={{ 
                color: theme?.iconColor || '#8b949e',
                ml: 1,
                fontSize: '0.75rem'
              }}
            >
              {formattedTime}
            </Typography>
          )}
        </Box>
        
        <Box
          sx={{
            color: textColor, // Aplicar el color azul en modo claro
            '& pre': { m: 0, borderRadius: '6px', mt: 1, mb: 1 },
            '& code': {
              backgroundColor: codeBg, // Fondo dinámico para código inline
              color: theme?.text, // Texto legible en código inline
              borderRadius: '4px',
              p: 0.5,
              fontFamily: "'SF Mono', Consolas, 'Courier New', monospace",
              fontSize: '0.85rem',
            },
            '& p': { m: 0, mb: 1 },
            '& a': { color: '#58a6ff', textDecoration: 'none' },
            '& h1, & h2, & h3, & h4, & h5, & h6': {
              mt: 1.5,
              mb: 1,
              color: headerColor,
              borderBottom: `1px solid ${borderColor}`,
              pb: 0.5,
            },
            '& ul, & ol': {
              pl: 2.5,
            },
            '& li': {
              mb: 0.5,
            },
            '& table': {
              borderCollapse: 'collapse',
              width: '100%',
              my: 1,
            },
            '& th, & td': {
              border: `1px solid ${borderColor}`,
              padding: '6px 13px',
            },
            '& th': {
              backgroundColor: tableHeaderBg,
            },
            '& tr:nth-of-type(odd)': {
              backgroundColor: tableRowBg,
            },
          }}
        >
          {isUser ? (
            <Typography variant="body2">{message}</Typography>
          ) : (
             <ReactMarkdown
              components={{
                // Pasamos 'theme' al CodeRenderer
                code: (props) => <CodeRenderer {...props} projectSlug={projectSlug} files={files} onFileSystemChange={onFileSystemChange} onUpdateOpenFile={onUpdateOpenFile} openFiles={openFiles} theme={theme} />,
              }}
            >
              {message}
            </ReactMarkdown>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default EditorChatMessage;