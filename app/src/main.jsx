import React from 'react';
import { createRoot } from 'react-dom/client';
import './v16.css';
import App from './App';
import BackgroundMusic from './components/BackgroundMusic';
createRoot(document.getElementById('root')).render(<BackgroundMusic><App /></BackgroundMusic>);
