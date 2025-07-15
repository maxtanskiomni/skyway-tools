import React from 'react';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import InputAdornment from '@mui/material/InputAdornment';
import useStyles from '../utilities/styles';
import firebase from '../utilities/firebase';
import { StateManager } from '../utilities/stateManager';
import moment from 'moment';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import RequestManager from '../utilities/requestManager';
import Button from '@mui/material/Button';
import AddIcon from '@mui/icons-material/Add';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import algolia from '../utilities/algolia';
import ResultsList from '../components/ResultsList';

export default function SalesInboxPage() {
  const classes = useStyles();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [threads, setThreads] = React.useState([]);
  const [selectedThread, setSelectedThread] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [newMessage, setNewMessage] = React.useState('');
  const [selectedImages, setSelectedImages] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingMessages, setLoadingMessages] = React.useState(false);
  const [error, setError] = React.useState(null);
  const fileInputRef = React.useRef();
  const [newConversationOpen, setNewConversationOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [selectedSearchResult, setSelectedSearchResult] = React.useState(0);

  // Set page title
  React.useEffect(() => {
    StateManager.setTitle("Sales Inbox");
  }, []);

  // Fetch threads
  React.useEffect(() => {
    const fetchThreads = async () => {
      try {
        setError(null);
        const threadsRef = firebase.firestore().collection('threads');
        const snapshot = await threadsRef
          .orderBy('lastMessageDate', 'desc')
          .limit(50)
          .get();
        
        const threadList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setThreads(threadList);
      } catch (error) {
        console.error('Error fetching threads:', error);
        setError('Failed to load conversations');
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, []);

  // Load messages when thread is selected
  React.useEffect(() => {
    const loadMessages = async () => {
      if (!selectedThread) {
        setMessages([]);
        return;
      }

      setLoadingMessages(true);
      try {
        const messagesRef = firebase.firestore().collection('messages');
        const snapshot = await messagesRef
          .where('threadId', '==', selectedThread.id)
          .orderBy('dateCreated', 'desc')
          .limit(100)
          .get();

        const messageList = snapshot.docs.map(doc => ({
          messageId: doc.id,
          ...doc.data()
        }));

        setMessages(messageList);
      } catch (error) {
        console.error('Error loading messages:', error);
        StateManager.setAlertAndOpen('Failed to load messages', 'error');
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [selectedThread]);

  // Filter threads based on search term
  const filteredThreads = React.useMemo(() => {
    if (!searchTerm) return threads;
    
    const searchLower = searchTerm.toLowerCase();
    return threads.filter(thread => 
      thread?.name?.toLowerCase().includes(searchLower) ||
      thread.phoneNumber?.includes(searchTerm) ||
      thread.lastMessageBody?.toLowerCase().includes(searchLower)
    );
  }, [threads, searchTerm]);

  const handleImageSelect = (event) => {
    const files = Array.from(event.target.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    // Convert files to URLs for preview
    const imageUrls = imageFiles.map(file => URL.createObjectURL(file));
    setSelectedImages(prev => [...prev, ...imageUrls]);
  };

  const handleRemoveImage = (indexToRemove) => {
    setSelectedImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && selectedImages.length === 0) || !selectedThread) return;

    // Create the message object first
    const now = firebase.firestore.Timestamp.now();
    const localMessageData = {
      messageId: Date.now().toString(),
      threadId: selectedThread.id,
      to: selectedThread.phoneNumber,
      from: '+19402304846', // Your business number
      body: newMessage.trim(),
      mediaUrls: selectedImages,
      status: 'pending',
      direction: 'outbound',
      dateCreated: now,
      dateUpdated: now,
      numMedia: selectedImages.length,
    };

    // Update thread data locally
    const updatedThread = {
      ...selectedThread,
      lastMessageBody: newMessage.trim(),
      lastMessageDate: now,
      lastMessageDirection: 'outbound',
      lastMessageId: localMessageData.messageId,
      messageCount: (selectedThread.messageCount || 0) + 1,
      updatedAt: now
    };

    // Optimistically update UI
    setMessages(prev => [localMessageData, ...prev]);
    setThreads(prev => [
      updatedThread,
      ...prev.filter(t => t.id !== selectedThread.id)
    ]);
    setSelectedThread(updatedThread);
    setNewMessage('');
    setSelectedImages([]);

    try {
      const messageData = {
        to: selectedThread.phoneNumber,
        body: newMessage.trim(),
        mediaUrl: selectedImages[0],
        threadId: selectedThread.id,
        testMode: process.env.NODE_ENV === 'development'
      };

      const response = await RequestManager.post({
        function: 'sendMessage',
        variables: messageData
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      StateManager.setAlertAndOpen('Failed to send message. Please try again.', 'error');
      
      // Revert the optimistic updates
      setMessages(prev => prev.filter(msg => msg.messageId !== localMessageData.messageId));
      setThreads(prev => prev.map(t => t.id === selectedThread.id ? selectedThread : t));
      setSelectedThread(selectedThread);
    }
  };

  const startNewConversation = async (customer) => {
    const phone = customer.phone_number.startsWith('+') ? customer.phone_number : `+1${customer.phone_number}`;
    
    // Check if thread already exists
    const existingThread = threads.find(t => t.phoneNumber === phone);
    if (existingThread) {
      setSelectedThread(existingThread);
      setNewConversationOpen(false);
      setSearchValue('');
      setSearchResults([]);
      return;
    }

    // Create new thread
    const now = new Date();
    const threadData = {
      id: Date.now().toString(),
      phoneNumber: phone,
      createdAt: now,
      updatedAt: now,
      hasUnread: false,
      messageCount: 0,
      lastMessageBody: "Initial thread message",
      lastMessageDate: now,
      lastMessageDirection: "outbound",
      lastMessageId: `msg_${Date.now()}`,
      contact: {
        name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'Unknown',
        phone: phone,
      }
    };

    try {
      await firebase.firestore().collection('threads').doc(threadData.id).set(threadData);
      setThreads(prev => [threadData, ...prev]);
      setSelectedThread(threadData);
    } catch (error) {
      console.error('Error creating thread:', error);
      StateManager.setAlertAndOpen('Failed to create conversation', 'error');
    }

    setNewConversationOpen(false);
    setSearchValue('');
    setSearchResults([]);
  };

  const renderMessage = (message) => {
    const isOutbound = message.direction === 'outbound';
    return (
      <Paper 
        key={message.messageId} 
        elevation={1}
        style={{ 
          padding: '12px 16px',
          backgroundColor: isOutbound ? '#e3f2fd' : '#fff',
          alignSelf: isOutbound ? 'flex-end' : 'flex-start',
          maxWidth: '80%',
          borderRadius: '12px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
        }}
      >
        <Typography variant="body1" style={{ marginBottom: message.mediaUrls?.length ? '8px' : '4px' }}>
          {message.body}
        </Typography>
        
        {message.mediaUrls && message.mediaUrls.length > 0 && (
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '8px',
            marginBottom: '8px' 
          }}>
            {message.mediaUrls.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`Attachment ${index + 1}`}
                style={{
                  maxWidth: '200px',
                  maxHeight: '200px',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  cursor: 'pointer'
                }}
                onClick={() => window.open(image, '_blank')}
              />
            ))}
          </div>
        )}
        
        <Typography 
          variant="caption" 
          color="textSecondary" 
          style={{ 
            display: 'block', 
            textAlign: isOutbound ? 'right' : 'left' 
          }}
        >
          {(() => {
            try {
              if (message.dateCreated?.toDate) {
                return moment(message.dateCreated.toDate()).format('MMM D, YYYY h:mm A');
              } else if (message.dateCreated) {
                return moment(message.dateCreated).format('MMM D, YYYY h:mm A');
              }
              return 'Invalid date';
            } catch (err) {
              return 'Invalid date';
            }
          })()}
        </Typography>
      </Paper>
    );
  };

  const handleSearchCustomer = async (value) => {
    setSearchValue(value);
    
    if (!value) {
      setSearchResults([]);
      return;
    }

    const index = algolia.client.initIndex('customers');
    const { hits } = await index.search(value);
    const results = hits
      .filter(hit => hit.phone_number)
      .map(hit => ({
        ...hit,
        action: () => startNewConversation(hit),
        label: getCustomerLabel(hit),
        avatar: getCustomerAvatar(hit)
      }));

    setSearchResults(results);
  };

  const getCustomerLabel = (hit) => {
    return `${hit.first_name || ''} ${hit.last_name || ''}`.trim() || 'Unknown Customer';
  };

  const getCustomerAvatar = (hit) => {
    const name = `${hit.first_name || ''}`.trim();
    return name ? name[0].toUpperCase() : '#';
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchResults.length > 0) {
      searchResults[selectedSearchResult].action();
    } else if (e.key === 'Escape') {
      setSearchResults([]);
    } else if (e.key === 'ArrowUp') {
      setSelectedSearchResult(prev => Math.max(0, prev - 1));
    } else if (e.key === 'ArrowDown') {
      setSelectedSearchResult(prev => Math.min(searchResults.length - 1, prev + 1));
    }
  };

  if (error) {
    return (
      <div style={{ 
        height: 'calc(100vh - 120px)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
      }}>
        <Typography color="error">{error}</Typography>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ 
        height: 'calc(100vh - 120px)',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff'
      }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div style={{ 
      height: 'calc(100vh - 120px)',
      width: '100%',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff'
    }}>
      <Dialog 
        open={newConversationOpen} 
        onClose={() => setNewConversationOpen(false)}
        PaperProps={{
          style: {
            width: '400px',
            maxWidth: '90vw',
            height: '500px',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        <DialogTitle style={{ padding: '16px', borderBottom: '1px solid rgba(0, 0, 0, 0.12)' }}>
          New Conversation
        </DialogTitle>
        <DialogContent style={{ 
          padding: '16px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <TextField
            autoFocus
            fullWidth
            autoComplete="off"
            label="Search customers"
            value={searchValue}
            onChange={(e) => handleSearchCustomer(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            variant="outlined"
            placeholder="Type to search..."
            style={{ marginBottom: '16px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <List style={{
            flex: 1,
            overflow: 'auto',
            backgroundColor: '#fafafa',
            borderRadius: '4px',
            padding: 0,
            margin: 0
          }}>
            {searchResults.map((result, index) => (
              <ListItem
                key={result.objectID || index}
                button
                selected={index === selectedSearchResult}
                onClick={result.action}
                style={{
                  padding: '12px',
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              >
                <ListItemAvatar>
                  <Avatar style={{ 
                    backgroundColor: index === selectedSearchResult ? '#1976d2' : '#9e9e9e',
                    width: 40,
                    height: 40
                  }}>
                    {result.avatar}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={result.label}
                  primaryTypographyProps={{
                    style: { 
                      fontWeight: index === selectedSearchResult ? 500 : 400,
                      fontSize: '1rem'
                    }
                  }}
                />
              </ListItem>
            ))}
            {searchValue && searchResults.length === 0 && (
              <ListItem style={{ padding: '24px 16px' }}>
                <ListItemText
                  primary="No results found"
                  style={{ textAlign: 'center', color: 'rgba(0, 0, 0, 0.6)' }}
                />
              </ListItem>
            )}
          </List>
        </DialogContent>
        <DialogActions style={{ 
          padding: '16px', 
          borderTop: '1px solid rgba(0, 0, 0, 0.12)',
          marginTop: 'auto'
        }}>
          <Button onClick={() => setNewConversationOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Grid container style={{ height: '100%', margin: 0, width: '100%' }}>
          {/* Message List Panel */}
          {(!isMobile || !selectedThread) && (
            <Grid item xs={12} md={4} style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              padding: 0
            }}>
              <Paper 
                elevation={0}
                style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 0,
                  borderRight: '1px solid rgba(0, 0, 0, 0.12)'
                }}
              >
                <div style={{ padding: '16px', backgroundColor: '#f5f5f5', borderBottom: '1px solid rgba(0, 0, 0, 0.12)', display: 'flex', gap: '8px' }}>
                  <TextField
                    size="small"
                    fullWidth
                    variant="outlined"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => setNewConversationOpen(true)}
                    
                  />
                </div>
                <List style={{ 
                  flex: 1, 
                  overflow: 'auto',
                  padding: 0
                }}>
                  {filteredThreads.map((thread) => (
                    <ListItem 
                      key={thread.id}
                      button 
                      sx={{ 
                        bgcolor: selectedThread?.id === thread.id ? '#e3f2fd' : 
                                thread.hasUnread ? '#f3f3f3' : 'transparent',
                        borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
                        '&:hover': {
                          bgcolor: selectedThread?.id === thread.id ? '#e3f2fd' : '#f5f5f5'
                        }
                      }}
                      onClick={() => setSelectedThread(thread)}
                    >
                      <ListItemAvatar>
                        <Avatar style={{ 
                          backgroundColor: selectedThread?.id === thread.id ? '#1976d2' : 
                                         thread.hasUnread ? '#42a5f5' : '#9e9e9e' 
                        }}>
                          {thread.contact?.name?.[0]?.toUpperCase() || '#'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ 
                              fontWeight: thread.hasUnread ? 500 : 400 
                            }}>
                              {thread.contact?.name || thread.phoneNumber}
                            </span>
                            {thread.hasUnread && (
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                backgroundColor: '#1976d2'
                              }} />
                            )}
                          </div>
                        }
                        secondary={
                          <React.Fragment>
                            <Typography 
                              component="span" 
                              variant="body2" 
                              style={{ 
                                display: 'block',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontWeight: thread.hasUnread ? 500 : 400
                              }}
                            >
                              {/* {thread.lastMessageDirection === 'outbound' ? '→ ' : '← '} */}
                              {thread.lastMessageBody || 'No messages yet'}
                            </Typography>
                            {(() => {
                              try {
                                if (thread.lastMessageDate?.toDate) {
                                  return moment(thread.lastMessageDate.toDate()).fromNow();
                                } else if (thread.lastMessageDate) {
                                  return moment(thread.lastMessageDate).fromNow();
                                }
                                return 'Invalid date';
                              } catch (err) {
                                return 'Invalid date';
                              }
                            })()}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          )}

          {/* Thread View Panel */}
          {(!isMobile || selectedThread) && (
            <Grid item xs={12} md={8} style={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              padding: 0
            }}>
              <Paper 
                elevation={0}
                style={{ 
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 0,
                  backgroundColor: '#fff'
                }}
              >
                {selectedThread ? (
                  <div style={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                  }}>
                    {/* Thread Header */}
                    <div style={{ 
                      padding: '16px',
                      backgroundColor: '#f5f5f5',
                      borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px'
                    }}>
                      {isMobile && (
                        <IconButton onClick={() => setSelectedThread(null)} edge="start" size="small">
                          <ArrowBackIcon />
                        </IconButton>
                      )}
                      <div style={{ flex: 1 }}>
                        <Typography variant="h6" style={{ margin: 0, fontSize: '1.1rem' }}>
                          {selectedThread.contact?.name || 'Unknown Contact'}
                        </Typography>
                        <Typography variant="subtitle2" color="textSecondary">
                          {selectedThread.phoneNumber}
                        </Typography>
                      </div>
                    </div>
                    
                    {/* Messages Container */}
                    <div style={{ 
                      height: 'calc(100vh - 120px - 56px - 64px)',
                      overflow: 'auto',
                    }}>
                      {/* Messages Content */}
                      <div style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                        backgroundColor: '#fafafa'
                      }}>
                        {loadingMessages ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                            <CircularProgress size={24} />
                          </div>
                        ) : (
                          messages.map(message => renderMessage(message))
                        )}
                      </div>
                    </div>

                    {/* Message Input */}
                    <div style={{ 
                      padding: '12px 16px',
                      borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                      backgroundColor: '#fff'
                    }}>
                      {selectedImages.length > 0 && (
                        <div style={{ 
                          display: 'flex', 
                          gap: '8px', 
                          overflowX: 'auto',
                          padding: '8px 0'
                        }}>
                          {selectedImages.map((image, index) => (
                            <div 
                              key={index} 
                              style={{ 
                                position: 'relative',
                                width: '64px',
                                height: '64px'
                              }}
                            >
                              <img
                                src={image}
                                alt={`Selected ${index + 1}`}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  borderRadius: '4px'
                                }}
                              />
                              <IconButton
                                size="small"
                                style={{
                                  position: 'absolute',
                                  top: -8,
                                  right: -8,
                                  backgroundColor: '#fff',
                                  padding: '2px'
                                }}
                                onClick={() => handleRemoveImage(index)}
                              >
                                <CloseIcon style={{ fontSize: '16px' }} />
                              </IconButton>
                            </div>
                          ))}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <TextField
                          size="small"
                          fullWidth
                          variant="outlined"
                          placeholder="Type a message..."
                          autoComplete="off"
                          multiline
                          maxRows={4}
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          style={{ display: 'none' }}
                          ref={fileInputRef}
                          onChange={handleImageSelect}
                        />
                        <IconButton
                          color="primary"
                          size="small"
                          onClick={() => fileInputRef.current.click()}
                        >
                          <ImageIcon />
                        </IconButton>
                        <IconButton 
                          color="primary" 
                          onClick={handleSendMessage}
                          disabled={!newMessage.trim() && selectedImages.length === 0}
                          size="small"
                        >
                          <SendIcon />
                        </IconButton>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    flex: 1, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#fafafa'
                  }}>
                    <Typography variant="body1" color="textSecondary">
                      Select a conversation to view messages
                    </Typography>
                  </div>
                )}
              </Paper>
            </Grid>
          )}
        </Grid>
      </div>
    </div>
  );
}
