// import { useEffect, useRef } from 'react';
// import * as mpFaceMesh from '@mediapipe/face_mesh';
// import { Camera } from '@mediapipe/camera_utils';

// const useEmotionDetection = (videoRef, canvasRef, emotionDisplayRef, isRunning, onEmotionsCollected) => {
//   const emotionQueue = useRef([]);
//   const isProcessing = useRef(false);

//   useEffect(() => {
//     if (!isRunning || !videoRef.current || !canvasRef.current) return;

//     const faceMesh = new mpFaceMesh.FaceMesh({
//       locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
//     });

//     faceMesh.setOptions({
//       maxNumFaces: 1,
//       refineLandmarks: false,
//       minDetectionConfidence: 0.5,
//       minTrackingConfidence: 0.5,
//     });

//     faceMesh.onResults(async (results) => {
//       const canvasCtx = canvasRef.current.getContext('2d');
//       canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

//       if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && !isProcessing.current) {
//         const landmarks = results.multiFaceLandmarks[0];
//         const flatLandmarks = landmarks.flatMap(pt => [pt.x, pt.y, pt.z]);

//         try {
//           isProcessing.current = true;
//           const response = await fetch('http://localhost:5000/detect_emotion', {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({ landmarks: flatLandmarks }),
//           });

//           const data = await response.json();
//           if (data.emotion) {
//             emotionDisplayRef.current.innerText = `Emotion: ${data.emotion}`;
//             emotionQueue.current.push(data.emotion);
//             if (emotionQueue.current.length >= 4) {
//               onEmotionsCollected([...emotionQueue.current]);
//               emotionQueue.current = [];
//             }
//           } else {
//             emotionDisplayRef.current.innerText = `Emotion: ${data.error || 'N/A'}`;
//             console.error('Server response:', data);
//           }
//         } catch (error) {
//           console.error('Emotion detection failed:', error);
//           emotionDisplayRef.current.innerText = 'Emotion: Error';
//         } finally {
//           isProcessing.current = false;
//         }
//       }
//     });

//     const camera = new Camera(videoRef.current, {
//       onFrame: async () => {
//         await faceMesh.send({ image: videoRef.current });
//       },
//       width: 640,
//       height: 480,
//     });

//     camera.start();

//     return () => {
//       camera.stop();
//     };
//   }, [isRunning, videoRef, canvasRef, emotionDisplayRef, onEmotionsCollected]);

//   return emotionQueue.current;
// };

// export default useEmotionDetection;
import { useEffect, useRef } from 'react';
import * as mpFaceMesh from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

const useEmotionDetection = (videoRef, canvasRef, emotionDisplayRef, isRunning, onEmotionsCollected) => {
  const emotionQueue = useRef([]);
  const isProcessing = useRef(false);

  useEffect(() => {
    if (!isRunning || !videoRef.current || !canvasRef.current) return;

    const faceMesh = new mpFaceMesh.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    faceMesh.onResults(async (results) => {
      const canvasCtx = canvasRef.current.getContext('2d');
      canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && !isProcessing.current) {
        const landmarks = results.multiFaceLandmarks[0];
        const flatLandmarks = landmarks.flatMap(pt => [pt.x, pt.y, pt.z]);

        try {
          isProcessing.current = true;
          const response = await fetch('http://localhost:3000/child/detect-emotion', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('child_token')}`, // Include JWT token
            },
            body: JSON.stringify({ landmarks: flatLandmarks }),
          });

          const data = await response.json();
          if (data.emotion) {
            emotionDisplayRef.current.innerText = `Emotion: ${data.emotion}`;
            emotionQueue.current.push(data.emotion);
            if (emotionQueue.current.length >= 4) {
              onEmotionsCollected([...emotionQueue.current]);
              emotionQueue.current = [];
            }
          } else {
            emotionDisplayRef.current.innerText = `Emotion: ${data.error || 'N/A'}`;
            console.error('Server response:', data);
          }
        } catch (error) {
          console.error('Emotion detection failed:', error);
          emotionDisplayRef.current.innerText = 'Emotion: Error';
        } finally {
          isProcessing.current = false;
        }
      }
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await faceMesh.send({ image: videoRef.current });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, [isRunning, videoRef, canvasRef, emotionDisplayRef, onEmotionsCollected]);

  return emotionQueue.current;
};

export default useEmotionDetection;