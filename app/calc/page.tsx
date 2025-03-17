"use client";
import React, { useRef, useEffect, useState } from "react";
import { SWATCHES } from "@/lib/constants";
import { Group, ColorSwatch } from "@mantine/core";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Moveable from "react-moveable";

interface GenerateResult {
  expression: string;
  answer: string;
}

interface Response {
  assign: boolean;
  expr: string;
  result: string;
}

declare global {
  interface Window {
    MathJax: any;
  }
}

const CalculatorCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("rgb(255, 255, 255)");
  const [reset, setReset] = useState(false);
  const [result, setResult] = useState<GenerateResult>();
  const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
  const [latexPosition, setLatexPosition] = useState({ x: 8, y: 186 });
  const [dictOfVars, setDictOfVars] = useState({});
  const [target, setTarget] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setResult(undefined);
      setDictOfVars({});
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    if (latexExpression.length > 0 && window.MathJax) {
      setTimeout(() => {
        window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
      }, 0);
    }
  }, [latexExpression]);

  useEffect(() => {
    if (result) {
      renderLatexToCanvas(result.expression, result.answer);
    }
  }, [result]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.lineCap = "round";
        context.lineWidth = 3;
        context.strokeStyle = color;
      }
      canvas.style.background = "black";
    }

    // Handle window resize
    const handleResize = () => {
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    window.addEventListener("resize", handleResize);

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/config/TeX-MML-CHTML.js";
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.MathJax.Hub.Config({
        tex2jax: {
          inlineMath: [
            ["$", "$"],
            ["\\(", "\\)"],
          ],
        },
      });
    };
    return () => {
      window.removeEventListener("resize", handleResize);
      document.head.removeChild(script);
    };
  }, [color]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.beginPath();
        context.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        setIsDrawing(true);
      }
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.strokeStyle = color;
        context.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        context.stroke();
      }
    }
  };

  const sendData = async () => {
    const canvas = canvasRef.current;

    if (canvas) {
      const response = await axios({
        method: "post",
        url: "http://localhost:3000/api/genai",
        data: {
          image: canvas.toDataURL("img/png"),
          dictOfVars: dictOfVars,
        },
      });
      const resp = await response.data;

      console.log("Response", resp);

      resp.data.forEach((data: Response) => {
        if (data.assign === true) {
          setDictOfVars({
            ...dictOfVars,
            [data.expr]: data.result,
          });
        }
        console.log("result :" + result);
      });

      const context = canvas.getContext("2d");
      const imageData = context!.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );
      let minX = canvas.width,
        minY = canvas.height,
        maxX = 0,
        maxY = 0;

      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const i = (y * canvas.width + x) * 4;
          if (imageData.data[i + 3] > 0) {
            // If pixel is not transparent
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      setLatexPosition({ x: centerX, y: centerY });
      resp.data.forEach((data: Response) => {
        setTimeout(() => {
          setResult((prev) => ({
            ...prev,
            expression: data.expr,
            answer: data.result,
          }));
        }, 1000);
      });
      console.log("result :" + result);
    }
  };

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const renderLatexToCanvas = (expression: string, answer: string) => {
    //const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
    const latex = `${expression} = ${answer}`;
    setLatexExpression(prevLatex => [...prevLatex, latex]);

    // Clear the main canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={() => setReset(true)}
          className="z-20 bg-black text-white"
          variant="default"
          color="black"
        >
          Reset
        </Button>
        <Group
          className="z-20"
          style={{ padding: 10, backgroundColor: "#f0f0f0" }}
        >
          {SWATCHES.map((swatch) => (
            <ColorSwatch
              key={swatch}
              color={swatch}
              onClick={() => setColor(swatch)}
            />
          ))}
        </Group>
        <Button
          className="z-20 bg-black text-white"
          variant="default"
          color="white"
          onClick={sendData}
        >
          Run
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        id="canvas"
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />

{latexExpression &&
  latexExpression.map((latex, index) => (
    <div key={index}>
      {/* Draggable Element */}
      <div
        ref={setTarget}
        style={{
          position: "absolute",
          left: latexPosition.x,
          top: latexPosition.y,
          padding: "10px",
          background: "black",
          color: "white",
          borderRadius: "5px",
          boxShadow: "0px 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div className="latex-content">{latex}</div>
      </div>

      {/* Moveable Drag Control */}
      <Moveable
        target={target}
        draggable={true}
        onDrag={(e) => setLatexPosition({ x: e.left, y: e.top })}
      />
    </div>
  ))}

    </>
  );
};

export default CalculatorCanvas;
