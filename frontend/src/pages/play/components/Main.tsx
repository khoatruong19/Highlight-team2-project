import { MouseEvent, useContext } from "react";
import { PaintContext } from "@/pages/play";
// Functions
import {
  drawRectangle,
  drawCircle,
  drawTriangle,
  drawFreeStyle,
  eraser,
  fillWithColor,
  pickColor,
  drawLine,
} from "@/pages/play/helpers";
import { rgbaToHex } from "@/common/lib/colors";
import BoxChatAnswer from "./BoxChatAnswer";
import { Point } from "../config/types";

// type Props = {}

export default function Main() {
  const variables = useContext(PaintContext);
  if (!variables) return null;
  const {
    canvasRef,
    ctx,
    snapshot,
    isDrawing,
    previousPoint,
    color,
    penStyle,
    isFill,
    brushSize,
    setSnapshot,
    setIsDrawing,
    setPreviousPoint,
    setColor,
  } = variables;

  // Handlers
  const getPointFromEvent = (
    e: MouseEvent<HTMLCanvasElement, globalThis.MouseEvent>
  ): Point => {
    const x = e.nativeEvent.offsetX;
    const y = e.nativeEvent.offsetY;
    return { x, y };
  };
  const handleStartDrawing = (point: Point) => {
    if (!ctx) return;
    const canvas = ctx.canvas;
    if (penStyle === "bucket") {
      fillWithColor(ctx, point, color);
      return;
    }
    setIsDrawing(true);
    setPreviousPoint(point);
    const hexColor = rgbaToHex(color.r, color.g, color.b, color.a);
    ctx.fillStyle = hexColor;
    ctx.strokeStyle = hexColor;
    ctx.lineWidth = brushSize;
    // Pick color
    if (penStyle === "picker") {
      // alert("picker");
      pickColor(ctx, point, setColor);
      return;
    }
    // Save previous state to prevent drag image
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    ctx.beginPath();
    // Make a dot
    (penStyle === "brush" || penStyle === "circle") &&
      drawFreeStyle(ctx, point, color);
    penStyle === "eraser" && eraser(ctx, point);
  };
  const handleDrawing = (currentPoint: Point) => {
    if (!ctx || !isDrawing) return;
    if (penStyle === "brush") {
      drawFreeStyle(ctx, currentPoint, color);
    }
    if (penStyle === "eraser") {
      eraser(ctx, currentPoint);
    }
    if (penStyle === "rectangle") {
      snapshot &&
        drawRectangle(ctx, snapshot, currentPoint, previousPoint, isFill);
    }
    if (penStyle === "circle") {
      snapshot &&
        drawCircle(ctx, snapshot, currentPoint, previousPoint, isFill);
    }
    if (penStyle === "triangle") {
      snapshot &&
        drawTriangle(ctx, snapshot, currentPoint, previousPoint, isFill);
    }
    if (penStyle === "line") {
      snapshot && drawLine(ctx, snapshot, currentPoint, previousPoint);
    }
  };
  const handleFinishDrawing = () => {
    if (!ctx) return;
    const canvas = ctx.canvas;
    setIsDrawing(false);
    // Save previous state to restore when resize
    setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
  };
  return (
    <div className="flex flex-col flex-1 h-full gap-6">
      <div className="relative flex-1 overflow-hidden rounded-md">
        <canvas
          ref={canvasRef}
          id="canvas"
          className="w-full h-full bg-white"
          onMouseDown={(e) => {
            const point = getPointFromEvent(e);
            handleStartDrawing(point);
          }}
          onMouseMove={(e) => {
            const point = getPointFromEvent(e);
            handleDrawing(point);
          }}
          onMouseUp={handleFinishDrawing}
          onMouseLeave={handleFinishDrawing}
        ></canvas>
      </div>
      <div className="bg-white rounded-md h-[245px]">
        <BoxChatAnswer />
      </div>
    </div>
  );
}