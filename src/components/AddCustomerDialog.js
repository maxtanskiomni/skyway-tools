import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { StateManager } from '../utilities/stateManager';
import RequestManager from '../utilities/requestManager';
import algolia from '../utilities/algolia';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Box,
  Alert,
  IconButton
} from '@mui/material';
import { 
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PhotoCamera as PhotoCameraIcon
} from '@mui/icons-material';
import history from '../utilities/history';

export default function AddCustomerDialog({ open, onClose }) {
  const [frontImage, setFrontImage] = React.useState(null);
  const [backImage, setBackImage] = React.useState(null);
  const [frontPreview, setFrontPreview] = React.useState('');
  const [backPreview, setBackPreview] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (!open) {
      setFrontImage(null);
      setBackImage(null);
      setFrontPreview('');
      setBackPreview('');
      setLoading(false);
      setError('');
    }
  }, [open]);

  // Validate and set image helper
  const validateAndSetImage = (file, type) => {
    if (!file.type.startsWith('image/')) {
      StateManager.setAlertAndOpen('Please select an image file', 'error');
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      StateManager.setAlertAndOpen('Image file size must be less than 10MB', 'error');
      return false;
    }
    if (type === 'front') {
      setFrontImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setFrontPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setBackImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setBackPreview(e.target.result);
      reader.readAsDataURL(file);
    }
    return true;
  };

  const handleImageUpload = (event, type) => {
    const file = event.target.files[0];
    if (!file) return;
    validateAndSetImage(file, type);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event, type) => {
    event.preventDefault();
    event.stopPropagation();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      validateAndSetImage(file, type);
    }
  };

  const removeImage = (type) => {
    if (type === 'front') {
      setFrontImage(null);
      setFrontPreview('');
    } else {
      setBackImage(null);
      setBackPreview('');
    }
  };

  const handleCreateCustomer = async () => {
    if (!frontImage) {
      setError('Driver license front image is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create base64 images
      const frontImagePayload = await getBase64WithMeta(frontImage);
      let backImagePayload = null;
    
      if (backImage) {
        backImagePayload = await getBase64WithMeta(backImage);
      }

      const payload = {
        frontImage: frontImagePayload,
        ...(backImagePayload && { backImage: backImagePayload })
      };

      const response = await RequestManager.post({
        function: 'makeCustomerFromDL',
        variables: payload,
      });

      // Add to Algolia if customerId is present
      await algolia.createRecord("customers", { objectID: response.customerId, ...response });

      StateManager.setAlertAndOpen('Customer created successfully', 'success');
      onClose();
      
      // Navigate to the customer page
      history.push(`/customer/${response.customerId}`);
    } catch (error) {
      console.error('Error creating customer:', error);
      setError(error.message || 'Error creating customer from driver license');
    } finally {
      setLoading(false);
    }
  };

  const ImageUploadCard = ({ type, image, preview, onUpload, onRemove }) => (
    <Card
      sx={{ 
        border: '2px dashed #ccc', 
        borderColor: image ? 'primary.main' : '#ccc',
        cursor: 'pointer',
        position: 'relative',
        minHeight: 200,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, type)}
    >
      <input
        accept="image/*"
        style={{ display: 'none' }}
        id={`${type}-image-upload`}
        type="file"
        onChange={(e) => onUpload(e, type)}
        disabled={loading}
      />
      <label htmlFor={`${type}-image-upload`} style={{ width: '100%', height: '100%' }}>
        {preview ? (
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={preview}
              alt={`${type} license`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                maxHeight: 200
              }}
            />
            <IconButton
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onRemove(type);
              }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                }
              }}
              disabled={loading}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            p: 3,
            textAlign: 'center'
          }}>
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              {type === 'front' ? 'Driver License Front' : 'Driver License Back'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {type === 'front' ? 'Required' : 'Optional'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click to upload or drag and drop
            </Typography>
          </Box>
        )}
      </label>
    </Card>
  );

  return (
    <Dialog 
      open={open} 
      onClose={loading ? undefined : onClose} 
      maxWidth="md" 
      fullWidth
      disableEscapeKeyDown={loading}
    >
      <DialogTitle>
        {loading ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={24} />
            <Typography>Processing driver license...</Typography>
          </Box>
        ) : (
          'Create Customer from Driver License'
        )}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              Upload images of the driver license to automatically create a customer profile.
            </Typography>
          </Grid>

          {error && (
            <Grid item xs={12}>
              <Alert severity="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </Grid>
          )}

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Driver License Front *
            </Typography>
            <ImageUploadCard
              type="front"
              image={frontImage}
              preview={frontPreview}
              onUpload={handleImageUpload}
              onRemove={removeImage}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Driver License Back
            </Typography>
            <ImageUploadCard
              type="back"
              image={backImage}
              preview={backPreview}
              onUpload={handleImageUpload}
              onRemove={removeImage}
            />
          </Grid>

          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              * Front image is required. Back image is optional but recommended for better accuracy.
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleCreateCustomer} 
          variant="contained" 
          color="primary"
          disabled={loading || !frontImage}
          startIcon={loading ? <CircularProgress size={20} /> : <PhotoCameraIcon />}
        >
          {loading ? 'Processing...' : 'Create Customer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 


// Convert image files to base64
const getBase64WithMeta = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      // Extract the base64 string (remove data URL prefix)
      const base64String = reader.result.split(',')[1];
      resolve({
        data: base64String,
        filename: file.name
      });
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};