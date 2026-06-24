import { useState, useRef } from 'react';
import { uploadImageDirectly } from '@/src/lib/imageCompressor';
import { MAX_AD_IMAGES } from '@/src/constants/limits';

export function useAdImageUpload(showError: (msg: string) => void) {
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const pendingFilesRef = useRef<{ [key: string]: File }>({});

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const maxSizeBytes = 5 * 1024 * 1024;

  const validateFiles = (files: File[]): File[] => {
    const valid: File[] = [];
    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        showError(`Fajl "${file.name}" nije u dozvoljenom formatu. Podržani formati su JPEG, PNG i WEBP.`);
        continue;
      }
      if (file.size > maxSizeBytes) {
        showError(`Fajl "${file.name}" je prevelik. Maksimalna dozvoljena veličina je 5MB.`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: any,
    getValues: any,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = validateFiles(files);
    if (!validFiles.length) return;

    const currentImages = getValues('images') || [];
    if (currentImages.length + validFiles.length > MAX_AD_IMAGES) {
      showError(`Maksimalno možete otpremiti ${MAX_AD_IMAGES} slika po oglasu.`);
      return;
    }

    const newUrls = validFiles.map(file => {
      const url = URL.createObjectURL(file);
      pendingFilesRef.current[url] = file;
      return url;
    });
    setValue('images', [...currentImages, ...newUrls]);
  };

  const removeImage = (index: number, setValue: any, getValues: any) => {
    const currentImages = getValues('images') || [];
    const imageToRemove = currentImages[index];

    if (typeof imageToRemove === 'string' && imageToRemove.startsWith('blob:')) {
      delete pendingFilesRef.current[imageToRemove];
      URL.revokeObjectURL(imageToRemove);
    }

    setValue('images', currentImages.filter((_: string | File, i: number) => i !== index));
  };

  const handlePortfolioUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setValue: any,
    getValues: any,
  ) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const validFiles = validateFiles(files);
    if (!validFiles.length) return;

    const newUrls = validFiles.map(file => {
      const url = URL.createObjectURL(file);
      pendingFilesRef.current[url] = file;
      return url;
    });
    const currentPortfolio = getValues('companyPortfolioImages') || [];
    setValue('companyPortfolioImages', [...currentPortfolio, ...newUrls]);
  };

  const removePortfolioImage = (index: number, setValue: any, getValues: any) => {
    const currentPortfolio = getValues('companyPortfolioImages') || [];
    const imageToRemove = currentPortfolio[index];

    if (typeof imageToRemove === 'string' && imageToRemove.startsWith('blob:')) {
      delete pendingFilesRef.current[imageToRemove];
      URL.revokeObjectURL(imageToRemove);
    }

    setValue('companyPortfolioImages', currentPortfolio.filter((_: string | File, i: number) => i !== index));
  };

  const uploadPendingImages = async (images: (string | File)[]): Promise<string[]> => {
    const finalImages: string[] = [];
    for (const img of images) {
      if (typeof img === 'string' && img.startsWith('blob:')) {
        const file = pendingFilesRef.current[img];
        if (file) {
          const uploadedUrl = await uploadImageDirectly(file);
          finalImages.push(uploadedUrl);
        }
      } else if (typeof img === 'string') {
        finalImages.push(img);
      }
    }
    return finalImages;
  };

  return {
    isUploadingImages,
    setIsUploadingImages,
    pendingFilesRef,
    handleImageUpload,
    removeImage,
    handlePortfolioUpload,
    removePortfolioImage,
    uploadPendingImages,
  };
}
