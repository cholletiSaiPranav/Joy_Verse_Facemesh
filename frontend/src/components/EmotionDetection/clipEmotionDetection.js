import { useState } from "react";

const useClipEmotionDetection = (videoRef, previousActions = "neutral,question1") => {
  const [emotion, setEmotion] = useState(null);
  const [emotionProbs, setEmotionProbs] = useState(null);
  const [action, setAction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retries, setRetries] = useState(0);

  const captureFrames = async () => {
    if (!videoRef.current) {
      console.error("Video reference is not available");
      return [];
    }

    // Check if video is ready and playing
    if (videoRef.current.readyState < 2) {
      console.warn("Video not ready yet, waiting...");
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Check again
      if (videoRef.current.readyState < 2) {
        console.error("Video still not ready after waiting");
        return [];
      }
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    const frames = [];

    try {
      // Add a unique timestamp to each frame capture for debugging
      const timestamp = new Date().getTime();
      
      for (let i = 0; i < 4; i++) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        // Make sure we have dimensions
        if (canvas.width === 0 || canvas.height === 0) {
          console.warn("Canvas dimensions are zero, using defaults");
          canvas.width = 640;
          canvas.height = 480;
        }
        
        // Clear the canvas before drawing
        context.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw with a slight delay between captures to get different expressions
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        
        // Add a small visual identifier to ensure frames are unique (invisible in practice)
        context.fillStyle = "rgba(0,0,0,0.01)";
        context.fillRect(i, i, 2, 2);
        context.fillText(`${timestamp}_${i}`, 5, 5);

        // Convert to blob with good quality
        const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
        
        if (blob) {
          console.log(`Captured frame ${i+1}/4 (${blob.size} bytes)`);
          frames.push(blob);
        } else {
          console.warn(`Failed to create blob for frame ${i+1}`);
        }

        // Wait longer between captures to ensure different expressions
        await new Promise(res => setTimeout(res, 300));
      }
      
      console.log(`Successfully captured ${frames.length} frames`);
    } catch (err) {
      console.error("Error capturing frames:", err);
    }

    return frames;
  };

  const sendToServer = async (frames) => {
    if (!frames.length) {
      throw new Error("No frames captured");
    }
    
    console.log(`Sending ${frames.length} frames to server with previous actions: ${previousActions}`);
    
    const formData = new FormData();
    frames.forEach((frame, index) => {
      formData.append(`frame${index}`, frame, `frame${index}.jpg`);
    });
    formData.append("previous_actions", previousActions);

    // Add timeout to fetch
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout
    
    try {
      const response = await fetch("http://localhost:5000/analyze-frames", {
        method: "POST",
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error (${response.status}): ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error("Request timed out");
      }
      throw error;
    }
  };

  const analyzeEmotion = async () => {
    setError(null);
    
    // Don't start a new analysis if one is already in progress
    if (loading) {
      console.log("Emotion analysis already in progress, skipping");
      return;
    }
    
    try {
      setLoading(true);
      console.log("Starting emotion analysis");
      
      const frames = await captureFrames();
      
      if (!frames.length) {
        throw new Error("Failed to capture frames");
      }
      
      console.log(`Captured ${frames.length} frames`);
      const data = await sendToServer(frames);
      
      console.log("Server response:", data);
      setEmotion(data.emotion);
      setEmotionProbs(data.emotion_probs);
      setAction(data.action);
      setRetries(0); // Reset retry counter on success
    } catch (error) {
      console.error("Emotion detection failed:", error);
      setError(error.message);
      
      // Implement retry logic with backoff
      if (retries < 3) {
        const retryDelay = Math.pow(2, retries) * 1000; // Exponential backoff
        console.log(`Retrying in ${retryDelay}ms (attempt ${retries + 1}/3)`);
        setTimeout(() => {
          setRetries(prev => prev + 1);
          analyzeEmotion();
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    emotion,
    emotionProbs,
    action,
    loading,
    error,
    analyzeEmotion,
  };
};

export default useClipEmotionDetection;
