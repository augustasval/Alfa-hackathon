import { useMemo, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface Point {
  x: number;
  y: number;
}

interface MathGraphProps {
  type: "parabola" | "line" | "points";
  parameters?: {
    a?: number;
    b?: number;
    c?: number;
    discriminant?: number;
    roots?: number[];
    label?: string;
  };
  width?: number;
  height?: number;
  interactive?: boolean;
}

export const MathGraph = ({ 
  type, 
  parameters = {}, 
  width = 500, 
  height = 350,
  interactive = false 
}: MathGraphProps) => {
  const [interactiveA, setInteractiveA] = useState(parameters.a || 1);
  const [interactiveB, setInteractiveB] = useState(parameters.b || 0);
  const [interactiveC, setInteractiveC] = useState(parameters.c || 0);

  const a = interactive ? interactiveA : (parameters.a || 1);
  const b = interactive ? interactiveB : (parameters.b || 0);
  const c = interactive ? interactiveC : (parameters.c || 0);
  
  const padding = 40;
  const graphWidth = width - 2 * padding;
  const graphHeight = height - 2 * padding;
  
  // Calculate discriminant and roots dynamically for interactive mode
  const discriminant = interactive ? b * b - 4 * a * c : parameters.discriminant;
  const roots = useMemo(() => {
    if (interactive && discriminant !== undefined) {
      if (discriminant > 0) {
        const sqrtDisc = Math.sqrt(discriminant);
        return [(-b + sqrtDisc) / (2 * a), (-b - sqrtDisc) / (2 * a)];
      } else if (discriminant === 0) {
        return [-b / (2 * a)];
      }
      return [];
    }
    return parameters.roots || [];
  }, [interactive, discriminant, a, b, parameters.roots]);
  
  // Calculate scale and range
  const xRange = 10;
  const yRange = 10;
  const xScale = graphWidth / (2 * xRange);
  const yScale = graphHeight / (2 * yRange);
  
  // Convert math coordinates to SVG coordinates
  const toSVGX = (x: number) => padding + (x + xRange) * xScale;
  const toSVGY = (y: number) => padding + (yRange - y) * yScale;
  
  // Generate parabola points
  const parabolaPoints = useMemo(() => {
    if (type !== "parabola") return [];
    const points: Point[] = [];
    for (let x = -xRange; x <= xRange; x += 0.1) {
      const y = a * x * x + b * x + c;
      if (Math.abs(y) <= yRange) {
        points.push({ x, y });
      }
    }
    return points;
  }, [type, a, b, c, xRange, yRange]);
  
  const pathData = parabolaPoints.map((point, i) => 
    `${i === 0 ? 'M' : 'L'} ${toSVGX(point.x)} ${toSVGY(point.y)}`
  ).join(' ');
  
  // Determine parabola color based on discriminant
  const getParabolaColor = () => {
    if (discriminant === undefined) return "#8b5cf6";
    if (discriminant > 0) return "#10b981"; // green - 2 solutions
    if (discriminant === 0) return "#f59e0b"; // orange - 1 solution
    return "#ef4444"; // red - no real solutions
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-background border border-border">
        <div className="w-full overflow-hidden">
          <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="mx-auto" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width={xScale} height={yScale} patternUnits="userSpaceOnUse">
            <path d={`M ${xScale} 0 L 0 0 0 ${yScale}`} fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.1" />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />
        
        {/* Axes */}
        <line 
          x1={toSVGX(-xRange)} 
          y1={toSVGY(0)} 
          x2={toSVGX(xRange)} 
          y2={toSVGY(0)} 
          stroke="currentColor" 
          strokeWidth="2" 
          opacity="0.3"
        />
        <line 
          x1={toSVGX(0)} 
          y1={toSVGY(-yRange)} 
          x2={toSVGX(0)} 
          y2={toSVGY(yRange)} 
          stroke="currentColor" 
          strokeWidth="2" 
          opacity="0.3"
        />
        
        {/* Axis labels */}
        <text x={toSVGX(xRange) - 10} y={toSVGY(0) - 10} fontSize="14" fill="currentColor">x</text>
        <text x={toSVGX(0) + 10} y={toSVGY(yRange) + 5} fontSize="14" fill="currentColor">y</text>
        
        {/* X-axis tick marks */}
        {Array.from({ length: 21 }, (_, i) => i - 10).filter(x => x !== 0).map(x => (
          <g key={`x-${x}`}>
            <line
              x1={toSVGX(x)}
              y1={toSVGY(0) - 5}
              x2={toSVGX(x)}
              y2={toSVGY(0) + 5}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            {x % 2 === 0 && (
              <text x={toSVGX(x)} y={toSVGY(0) + 20} fontSize="10" fill="currentColor" textAnchor="middle">
                {x}
              </text>
            )}
          </g>
        ))}
        
        {/* Y-axis tick marks */}
        {Array.from({ length: 21 }, (_, i) => i - 10).filter(y => y !== 0).map(y => (
          <g key={`y-${y}`}>
            <line
              x1={toSVGX(0) - 5}
              y1={toSVGY(y)}
              x2={toSVGX(0) + 5}
              y2={toSVGY(y)}
              stroke="currentColor"
              strokeWidth="1"
              opacity="0.3"
            />
            {y % 2 === 0 && (
              <text x={toSVGX(0) - 15} y={toSVGY(y) + 5} fontSize="10" fill="currentColor" textAnchor="end">
                {y}
              </text>
            )}
          </g>
        ))}
        
        {/* Draw parabola */}
        {type === "parabola" && pathData && (
          <path 
            d={pathData} 
            fill="none" 
            stroke={getParabolaColor()} 
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        
        {/* Draw roots/intersections */}
        {roots.map((root, i) => (
          <g key={`root-${i}`}>
            <circle 
              cx={toSVGX(root)} 
              cy={toSVGY(0)} 
              r="6" 
              fill={getParabolaColor()}
              stroke="white"
              strokeWidth="2"
            />
            <text 
              x={toSVGX(root)} 
              y={toSVGY(0) - 15} 
              fontSize="12" 
              fill="currentColor" 
              textAnchor="middle"
              fontWeight="bold"
            >
              x = {root.toFixed(2)}
            </text>
          </g>
        ))}
        </svg>
        </div>
        
        {/* Legend */}
        {discriminant !== undefined && (
          <div className="mt-4 text-sm text-center space-y-1">
            <p className="font-semibold">
              {interactive ? `${a}x² + ${b}x + ${c} = 0` : parameters.label}
            </p>
            <p className="font-semibold">
              Discriminant Δ = {discriminant > 0 ? discriminant.toFixed(2) : discriminant}
            </p>
            <p className="text-muted-foreground">
              {discriminant > 0 && "Δ > 0: Two real solutions (parabola crosses x-axis twice)"}
              {discriminant === 0 && "Δ = 0: One real solution (parabola touches x-axis once)"}
              {discriminant < 0 && "Δ < 0: No real solutions (parabola doesn't touch x-axis)"}
            </p>
          </div>
        )}
      </Card>

      {/* Interactive Controls */}
      {interactive && (
        <Card className="p-4 space-y-4 bg-secondary/20">
          <h3 className="font-semibold text-sm">Adjust Parameters</h3>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm flex items-center justify-between mb-2">
                <span>Coefficient a (x²):</span>
                <span className="font-mono font-semibold">{interactiveA.toFixed(1)}</span>
              </label>
              <Slider
                value={[interactiveA]}
                onValueChange={([val]) => setInteractiveA(val)}
                min={-5}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm flex items-center justify-between mb-2">
                <span>Coefficient b (x):</span>
                <span className="font-mono font-semibold">{interactiveB.toFixed(1)}</span>
              </label>
              <Slider
                value={[interactiveB]}
                onValueChange={([val]) => setInteractiveB(val)}
                min={-10}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm flex items-center justify-between mb-2">
                <span>Constant c:</span>
                <span className="font-mono font-semibold">{interactiveC.toFixed(1)}</span>
              </label>
              <Slider
                value={[interactiveC]}
                onValueChange={([val]) => setInteractiveC(val)}
                min={-10}
                max={10}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
