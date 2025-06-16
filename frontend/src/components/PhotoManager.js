import React, { useState, useRef } from 'react';

const PhotoManager = ({ photos = [], onPhotosChange, maxPhotos = 8 }) => {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (files) => {
    if (files.length + photos.length > maxPhotos) {
      alert(`Maximum ${maxPhotos} photos allowed`);
      return;
    }

    setIsUploading(true);
    const newPhotos = [];

    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert(`File ${file.name} is too large. Maximum size is 5MB.`);
        continue;
      }

      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`);
        continue;
      }

      try {
        const compressedBase64 = await compressImage(file);
        newPhotos.push({
          id: Date.now() + Math.random(),
          base64: compressedBase64,
          name: file.name,
          size: file.size,
          isMain: photos.length === 0 && newPhotos.length === 0
        });
      } catch (error) {
        console.error('Error processing image:', error);
        alert(`Error processing ${file.name}`);
      }
    }

    const updatedPhotos = [...photos, ...newPhotos];
    onPhotosChange(updatedPhotos);
    setIsUploading(false);
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 800px width/height)
        const maxSize = 800;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
        resolve(compressedBase64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null) return;
    
    const newPhotos = [...photos];
    const draggedPhoto = newPhotos[draggedIndex];
    
    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    
    onPhotosChange(newPhotos);
    setDraggedIndex(null);
  };

  const removePhoto = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    // If we removed the main photo, make the first remaining photo the main one
    if (photos[index]?.isMain && newPhotos.length > 0) {
      newPhotos[0].isMain = true;
    }
    onPhotosChange(newPhotos);
  };

  const setMainPhoto = (index) => {
    const newPhotos = photos.map((photo, i) => ({
      ...photo,
      isMain: i === index
    }));
    onPhotosChange(newPhotos);
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
    e.target.value = ''; // Reset input
  };

  const handleDropZone = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
        <span className="text-sm text-gray-500">
          {photos.length}/{maxPhotos} photos
        </span>
      </div>

      {/* Upload Zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDropZone}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInputChange}
          ref={fileInputRef}
          className="hidden"
        />
        
        {isUploading ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
            <p className="text-sm text-gray-600">Processing images...</p>
          </div>
        ) : (
          <div>
            <div className="text-4xl mb-2">📸</div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Click to upload
            </button>
            <p className="text-sm text-gray-500 mt-1">
              or drag and drop images here
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Max {maxPhotos} photos, 5MB each. Images will be compressed automatically.
            </p>
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div
              key={photo.id || index}
              className="relative group"
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
            >
              <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                <img
                  src={`data:image/jpeg;base64,${photo.base64}`}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Main Photo Badge */}
                {photo.isMain && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                    Main
                  </div>
                )}
                
                {/* Photo Index */}
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                  {index + 1}
                </div>
                
                {/* Actions Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    {!photo.isMain && (
                      <button
                        type="button"
                        onClick={() => setMainPhoto(index)}
                        className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                        title="Set as main photo"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
                      title="Remove photo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Photo Info */}
              <div className="mt-1 text-xs text-gray-500 truncate">
                {photo.name || `Photo ${index + 1}`}
              </div>
            </div>
          ))}
          
          {/* Add More Button */}
          {photos.length < maxPhotos && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 transition-colors flex flex-col items-center justify-center text-gray-400 hover:text-gray-500"
            >
              <div className="text-2xl mb-1">+</div>
              <div className="text-xs">Add Photo</div>
            </button>
          )}
        </div>
      )}

      {/* Photo Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-800 mb-2">📷 Photo Tips</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• First photo will be your main listing image</li>
          <li>• Use natural lighting for best results</li>
          <li>• Include close-ups of any flaws or details</li>
          <li>• Show different angles and styling options</li>
          <li>• Drag photos to reorder them</li>
        </ul>
      </div>
    </div>
  );
};

export default PhotoManager;