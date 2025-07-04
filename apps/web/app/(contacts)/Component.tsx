"use client"

import {
  Label,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts"

// Définition de chartData rétablie ici
const chartData = [
  { browser: "safari", visitors: 200, fill: "url(#multicolorGradient)" },
]

export function Component() {
  const MAX_VISITORS = 400

  return (
    <div style={{ width: "100%", height: "250px", maxWidth: "250px", margin: "auto" }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={chartData} // Maintenant chartData est défini
          startAngle={0}
          endAngle={360}
          innerRadius="70%"
          outerRadius="90%"
          barSize={20}
        >
          <defs>
            <linearGradient id="multicolorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C6FF" /> 
              <stop offset="25%" stopColor="#5F27CD" /> 
              <stop offset="50%" stopColor="#FF007A" /> 
              <stop offset="75%" stopColor="#FF8C00" /> 
              <stop offset="100%" stopColor="#F9F871" />
            </linearGradient>
          </defs>
          <PolarAngleAxis
            type="number"
            domain={[0, MAX_VISITORS]}
            angleAxisId={0}
            tick={false}
            axisLine={false}
          />
          <PolarGrid
            gridType="circle"
            radialLines={false}
            stroke="none"
            polarRadius={[parseInt("70%"), parseInt("90%")]}
            className="first:fill-muted last:fill-background"
          />
          <RadialBar
            dataKey="visitors"
            angleAxisId={0}
            background
            cornerRadius={10}
          />
          <PolarRadiusAxis
            tick={false}
            axisLine={false}
            angle={90}
          >
            <Label
              content={({ viewBox }) => {
                if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                  return (
                    <text
                      x={viewBox.cx}
                      y={viewBox.cy}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#FFF"
                    >
                      <tspan
                        x={viewBox.cx}
                        y={viewBox.cy}
                        style={{ fontSize: '24px', fontWeight: 'bold' }}
                      >
                        {`${((chartData[0].visitors / MAX_VISITORS) * 100).toFixed(0)}%`}
                      </tspan>
                    </text>
                  )
                }
              }}
            />
          </PolarRadiusAxis>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  )
} 