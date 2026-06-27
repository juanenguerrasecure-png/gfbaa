/**
 * Compresses an image file or Data URL on the client side using HTMLCanvasElement.
 * This keeps the file size small (around 30KB - 80KB) while maintaining good quality
 * for luxury storefront item display.
 * 
 * @param {File|Blob|string} imageInput - The File, Blob, or Data URL to compress
 * @param {object} options - Options for compression
 * @param {number} options.maxWidth - Maximum width of the output image (default: 800)
 * @param {number} options.maxHeight - Maximum height of the output image (default: 800)
 * @param {number} options.quality - Quality of JPEG compression between 0 and 1 (default: 0.75)
 * @returns {Promise<string>} A promise resolving to the compressed JPEG Data URL
 */
export function compressImage(imageInput, options = {}) {
  const { maxWidth = 800, maxHeight = 800, quality = 0.75 } = options;

  return new Promise((resolve, reject) => {
    // Helper to process the loaded Image object
    const processImage = (img) => {
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      // Create a canvas
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get 2D context from canvas'));
        return;
      }

      // Draw image onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Get compressed JPEG data URL
      try {
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      } catch (err) {
        reject(err);
      }
    };

    if (imageInput instanceof File || imageInput instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => processImage(img);
        img.onerror = () => reject(new Error('Failed to load image file'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(imageInput);
    } else if (typeof imageInput === 'string' && imageInput.startsWith('data:')) {
      const img = new Image();
      img.onload = () => processImage(img);
      img.onerror = () => reject(new Error('Failed to load data URL image'));
      img.src = imageInput;
    } else {
      reject(new Error('Invalid image input type. Expected File, Blob, or Data URL.'));
    }
  });
}
