import React from 'react';
import { createRoot } from 'react-dom/client';
import './v16.css';
import BackgroundMusic from './components/BackgroundMusic';
import ProductShell from './product/ProductShell';
// Entry for product.html: the product pages without the 3D homepage (see vite.config.js and vercel.json).
createRoot(document.getElementById('root')).render(<BackgroundMusic><ProductShell /></BackgroundMusic>);
