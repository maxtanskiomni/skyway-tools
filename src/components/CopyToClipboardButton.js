import React from "react";

const CopyToClipboardButton = ({ text, imageUrl }) => {
  const copyToClipboard = async () => {
    try {
      // Fetch the image from the URL and convert it to a blob
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob,
      });

      // Copy both text and image to the clipboard
      await navigator.clipboard.write([
        clipboardItem,
        new ClipboardItem({
          "text/plain": new Blob([text], { type: "text/plain" }),
        }),
      ]);

      alert("Text and image copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <button onClick={copyToClipboard}>
      Copy Text and Image to Clipboard
    </button>
  );
};

export default CopyToClipboardButton;
