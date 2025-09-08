
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CameraIcon, UploadIcon } from './Icons';
import { playSound } from '../constants';

interface PhotoCaptureProps {
  onPhotoTaken: (imageData: { data: string; type: string }) => void;
}

const PhotoCapture: React.FC<PhotoCaptureProps> = ({ onPhotoTaken }) => {
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // This effect handles the camera stream lifecycle based on the isCameraOn state
    if (isCameraOn) {
      let stream: MediaStream | null = null;
      const videoElement = videoRef.current;

      const enableStream = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoElement) {
            videoElement.srcObject = stream;
            videoElement.play().catch(e => console.error("Error playing video stream:", e));
          }
        } catch (error) {
          console.error("Error accessing camera:", error);
          alert("Could not access the camera. Please ensure you have given permission.");
          setIsCameraOn(false); // Reset state if permission is denied or fails
        }
      };
      
      enableStream();

      // Cleanup function to stop the stream when isCameraOn becomes false
      return () => {
        stream?.getTracks().forEach(track => track.stop());
        if (videoElement) {
          videoElement.srcObject = null;
        }
      };
    }
  }, [isCameraOn]);

  const startCamera = useCallback(() => {
    playSound('click');
    // Trigger the useEffect by updating the state
    setIsCameraOn(true);
    setImage(null);
  }, []);

  const stopCamera = useCallback(() => {
    // Trigger the useEffect's cleanup by updating the state
    setIsCameraOn(false);
  }, []);

  const takePicture = useCallback(() => {
    playSound('click');
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL('image/jpeg');
        setImage(data);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      stopCamera();
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (image) {
      playSound('navigate');
      const [header, data] = image.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
      onPhotoTaken({ data, type: mimeType });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 w-full max-w-2xl mx-auto">
      <div className="w-full aspect-video bg-black/50 rounded-lg overflow-hidden flex items-center justify-center mb-6 border-2 border-white/20">
        {image ? (
          <img src={image} alt="Preview" className="w-full h-full object-contain" />
        ) : isCameraOn ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="text-center text-gray-300">
            <p>Upload an image or use your camera</p>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-6">
        <button onClick={startCamera} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/20 transition-colors">
          <CameraIcon className="w-6 h-6" /> Use Camera
        </button>
        <label onClick={() => playSound('click')} className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white font-semibold hover:bg-white/20 transition-colors cursor-pointer">
          <UploadIcon className="w-6 h-6" /> Upload Photo
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </label>
      </div>

      {isCameraOn && (
        <button onClick={takePicture} className="w-full px-6 py-3 mb-6 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors">
          Take Picture
        </button>
      )}

      <button onClick={handleNext} disabled={!image} className="w-full px-6 py-4 bg-gradient-to-r from-teal-400 to-blue-500 text-white text-lg font-bold rounded-lg shadow-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
        Next
      </button>
    </div>
  );
};

export default PhotoCapture;