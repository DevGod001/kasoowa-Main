// File: src/components/shared/BarcodeGenerator.jsx

import React, { useEffect, useRef } from 'react';
import { Camera } from 'lucide-react';

const BarcodeGenerator = ({ value, onGenerated }) => {
  const barcodeRef = useRef(null);

  useEffect(() => {
    const generateBarcode = async () => {
      try {
        // We'll use SVG to create a QR-like barcode
        const svgWidth = 200;
        const svgHeight = 100;
        
        const svg = `
          <svg 
            viewBox="0 0 ${svgWidth} ${svgHeight}"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect width="100%" height="100%" fill="white"/>
            <text
              x="50%"
              y="95%"
              text-anchor="middle"
              font-family="monospace"
              font-size="12"
            >${value}</text>
            ${generateBarcodeLines(value, svgWidth, svgHeight)}
          </svg>
        `;

        if (barcodeRef.current) {
          barcodeRef.current.innerHTML = svg;
        }

        if (onGenerated) {
          onGenerated(svg);
        }
      } catch (error) {
        console.error('Error generating barcode:', error);
      }
    };

    if (value) {
      generateBarcode();
    }
  }, [value, onGenerated]);

  // Helper function to generate barcode lines
  const generateBarcodeLines = (value, width, height) => {
    const lines = [];
    const chars = value.toString().split('');
    const lineWidth = 2;
    const spacing = 1;
    const startX = 20;
    const startY = 10;
    const lineHeight = height * 0.6;

    chars.forEach((char, index) => {
      const x = startX + (index * (lineWidth + spacing) * 2);
      const code = char.charCodeAt(0);
      
      // Create varying height lines based on character code
      const height = (lineHeight * (code % 3 + 1)) / 3;
      const y = startY + (lineHeight - height) / 2;

      lines.push(`
        <rect
          x="${x}"
          y="${y}"
          width="${lineWidth}"
          height="${height}"
          fill="black"
        />
      `);
    });

    return lines.join('');
  };

  return (
    <div className="flex flex-col items-center">
      <div 
        ref={barcodeRef}
        className="w-full max-w-[200px] h-[100px] bg-white border border-gray-200 rounded-lg p-2"
      />
      <button 
        onClick={() => window.print()} 
        className="mt-4 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-300"
      >
        <Camera size={18} />
        Print Barcode
      </button>
    </div>
  );
};

export default BarcodeGenerator;