// import React, { useState, useEffect, useRef } from 'react';
// import './../styles/game.css';
// import videoFile from '../assets/video.mp4';
// import dogImage from '../assets/dog.png';
// import catImage from '../assets/cat.png';
// import tigerImage from '../assets/tiger.png';
// import zebraImage from '../assets/zebra.png';
// import monkeyImage from '../assets/monkey.png';
// import horseImage from '../assets/horse.png';
// import useClipEmotionDetection from './EmotionDetection/clipEmotionDetection';

// const Game = () => {
//   const [gameStarted, setGameStarted] = useState(false);
//   const [gameCompleted, setGameCompleted] = useState(false);
//   const [wordIndex, setWordIndex] = useState(0);
//   const [shuffledWords, setShuffledWords] = useState([]);
//   const [currentWord, setCurrentWord] = useState(null);
//   const [letters, setLetters] = useState([]);
//   const [dropZones, setDropZones] = useState([]);
//   const [score, setScore] = useState(0);
//   const [feedback, setFeedback] = useState(null);

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const emotionDisplayRef = useRef(null);

//   // Use CLIP-based emotion detection hook
//   const { emotion, analyzeEmotion } = useClipEmotionDetection(videoRef);

//   const words = [
//     { correct: 'dog', jumbled: 'gdo', image: dogImage },
//     { correct: 'cat', jumbled: 'tac', image: catImage },
//     { correct: 'tiger', jumbled: 'ietgr', image: tigerImage },
//     { correct: 'zebra', jumbled: 'abezr', image: zebraImage },
//     { correct: 'monkey', jumbled: 'mkyoen', image: monkeyImage },
//     { correct: 'horse', jumbled: 'soehr', image: horseImage },
//   ];

//   const emotionColors = {
//     happy: 'rgba(255, 215, 0, 0.5)',
//     sad: 'rgba(135, 206, 235, 0.5)',
//     angry: 'rgba(255, 69, 0, 0.5)',
//     surprise: 'rgba(152, 251, 152, 0.5)',
//     fear: 'rgba(221, 160, 221, 0.5)',
//     disgust: 'rgba(176, 196, 222, 0.5)',
//     neutral: 'rgba(245, 245, 245, 0.5)',
//   };

//   useEffect(() => {
//     setShuffledWords([...words].sort(() => Math.random() - 0.5));
//   }, []);

//   useEffect(() => {
//     if (shuffledWords.length > 0) {
//       const word = shuffledWords[wordIndex];
//       setCurrentWord(word);
//       setLetters(word.jumbled.split(''));
//       setDropZones(Array(word.correct.length).fill(null));
//     }
//   }, [wordIndex, shuffledWords]);

//   const handleDragStart = (e, letter) => {
//     e.dataTransfer.setData('text/plain', letter);
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//   };

//   const handleDrop = async (e, index) => {
//     e.preventDefault();
//     const letter = e.dataTransfer.getData('text/plain');
//     const newDropZones = [...dropZones];
//     newDropZones[index] = letter;
//     setDropZones(newDropZones);

//     if (newDropZones.every((zone) => zone !== null)) {
//       const arrangedWord = newDropZones.join('');
//       if (arrangedWord === currentWord.correct) {
//         setFeedback('Correct!');
//         const newScore = score + 1;
//         setScore(newScore);

//         // Trigger emotion detection here (optional)
//         await analyzeEmotion();

//         if (newScore >= words.length) {
//           setGameCompleted(true);
//         } else {
//           setTimeout(() => {
//             setWordIndex((prevIndex) => prevIndex + 1);
//             setFeedback(null);
//           }, 1000);
//         }
//       } else {
//         setFeedback('Try Again!');
//         setTimeout(() => {
//           setDropZones(Array(currentWord.correct.length).fill(null));
//           setFeedback(null);
//         }, 1000);
//       }
//     }
//   };

//   return (
//     <div className="game-container">
//       {/* Background Video */}
//       <video autoPlay loop muted playsInline className="background-video">
//         <source src={videoFile} type="video/mp4" />
//         Your browser does not support the video tag.
//       </video>

//       {/* Emotion Overlay */}
//       {emotion && (
//         <div
//           style={{
//             position: 'absolute',
//             top: 0,
//             left: 0,
//             width: '100%',
//             height: '100%',
//             backgroundColor: emotionColors[emotion.toLowerCase()],
//             zIndex: 0,
//             transition: 'background-color 0.5s ease',
//           }}
//         />
//       )}

//       {/* Hidden Webcam Feed */}
//       <video
//         ref={videoRef}
//         style={{ display: 'none' }}
//         autoPlay
//         playsInline
//         muted
//         width="640"
//         height="480"
//       />

//       {/* Game Content */}
//       <div className="content">
//         {!gameStarted ? (
//           <>
//             <h1>Welcome to the Game</h1>
//             <button onClick={() => setGameStarted(true)} className="start-button">
//               Start Game
//             </button>
//           </>
//         ) : !gameCompleted ? (
//           <div className="game-content">
//             <h1>What is this animal?</h1>
//             <div className="animal-container">
//               {currentWord && <img src={currentWord.image} alt="Animal" className="animal-image" />}
//             </div>

//             <div className="letters-container">
//               {letters.map((letter, index) => (
//                 <div
//                   key={index}
//                   draggable
//                   onDragStart={(e) => handleDragStart(e, letter)}
//                   className="draggable-letter"
//                 >
//                   {letter}
//                 </div>
//               ))}
//             </div>

//             <div className="dropzones-container">
//               {dropZones.map((zone, index) => (
//                 <div
//                   key={index}
//                   onDragOver={handleDragOver}
//                   onDrop={(e) => handleDrop(e, index)}
//                   className={`dropzone ${zone ? 'filled' : ''}`}
//                 >
//                   {zone || '_'}
//                 </div>
//               ))}
//             </div>

//             {feedback && (
//               <p className={`feedback ${feedback === 'Correct!' ? 'correct' : 'wrong'}`}>
//                 {feedback}
//               </p>
//             )}
//             <p className="score">Score: {score}</p>
//           </div>
//         ) : (
//           <div className="game-content">
//             <h2>Congratulations! You Won!</h2>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Game;
