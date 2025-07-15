import React from 'react';
import Typography from '@mui/material/Typography';
import 'react-tabs/style/react-tabs.css';
import Button from '@mui/material/Button';


import { StateManager } from '../../utilities/stateManager.js'

import JSZip from 'jszip';
import ContentCopyIcon from '@mui/material/Icon/Icon';

export default function Marketing(props) {
  const { car = {} } = props;

  const image_keys = ["thumbnail", "vin_image", "odometer_image", "stamping_images", "ext_images", "interior_images", "engine_images", "under_images"];

  const downloadAllImages = async () => {
    StateManager.setAlertAndOpen("Preparing images for download...", "info");
    const zip = new JSZip();
    const imagePromises = [];
    let totalImages = 0;

    // First, handle thumbnail if it exists
    if (car.thumbnail) {
      const promise = fetch(car.thumbnail)
        .then(response => response.blob())
        .then(blob => {
          zip.file(`0_thumbnail.jpg`, blob);
        });
      imagePromises.push(promise);
      totalImages++;
    }

    // Then handle the rest of the images
    image_keys
      .filter(key => key !== "thumbnail") // Skip thumbnail as it's already processed
      .forEach(key => {
        let images = car[key];
        if (!images) return;
        
        if (!Array.isArray(images)) {
          images = [images];
        }

        images.forEach((imageUrl, index) => {
          if (totalImages >= 20) return; // Still maintain 20 image limit
          if (!imageUrl) return;
          
          const promise = fetch(imageUrl)
            .then(response => response.blob())
            .then(blob => {
              zip.file(`${key}_${index}.jpg`, blob);
            });
          imagePromises.push(promise);
          totalImages++;
        });
      });

    try {
      // Wait for all images to be downloaded and added to zip
      await Promise.all(imagePromises);
      
      // Generate and download the zip file
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(content);
      link.download = `${car.stock || 'car'}_images.zip`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      
      StateManager.setAlertAndOpen("Download complete!", "success");
    } catch (error) {
      console.error('Error creating zip file:', error);
      StateManager.setAlertAndOpen("Error downloading images", "error");
    }
  };

  const downloadVideo = async () => {
    if (!car.driving_video) {
      StateManager.setAlertAndOpen("No driving video available", "error");
      return;
    }

    try {
      const response = await fetch(car.driving_video);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${car.stock || 'car'}_driving_video.mp4`;
      link.click();
      window.URL.revokeObjectURL(link.href);
      StateManager.setAlertAndOpen("Video download complete!", "success");
    } catch (error) {
      console.error('Error downloading video:', error);
      StateManager.setAlertAndOpen("Error downloading video", "error");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    StateManager.setAlertAndOpen("Copied to clipboard!", "success");
  };

  return (
    <div style={{paddingBottom: 15}}>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <Button variant="contained" color="primary" onClick={downloadAllImages}>
          Download First 20 Images
        </Button>
        <Button variant="contained" color="primary" onClick={downloadVideo}>
          Download Driving Video
        </Button>
      </div>

      <div style={{ backgroundColor: 'white', padding: '17px', marginBottom: '20px' }}>
        <Typography variant="h6">Car Details</Typography>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Typography>Year: {car.year || 'N/A'}</Typography>
          <Typography>Make: {car.make || 'N/A'}</Typography>
          <Button 
            variant="outlined" 
            startIcon={<ContentCopyIcon />}
            onClick={() => copyToClipboard(car.model || 'N/A')}>
            Copy Model: {car.model || 'N/A'}
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ContentCopyIcon />}
            onClick={() => copyToClipboard(car.trim || 'N/A')}>
            Copy Trim: {car.trim || 'N/A'}
          </Button>
          <Button 
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => copyToClipboard(car.mileage?.toString() || 'N/A')}>
            Copy Mileage: {car.miles || 'N/A'}
          </Button>
          <Button 
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => copyToClipboard(car.price?.toString() || 'N/A')}>
            Copy Price: ${car.price?.toLocaleString() || 'N/A'}
          </Button>
          <Typography>Exterior Color: {car['color'] || 'N/A'}</Typography>
          <Typography>Interior Color: {car['interior-color'] || 'N/A'}</Typography>
          <Typography>Transmission: {car.transmission || 'N/A'}</Typography>
          <Button 
            variant="contained"
            color="primary"
            startIcon={<ContentCopyIcon />}
            onClick={() => copyToClipboard(car.writeup || 'N/A')}>
            Copy Description
          </Button>
        </div>
      </div>
    </div>
  );
}