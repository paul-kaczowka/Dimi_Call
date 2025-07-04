"use client"

import * as React from 'react';
import dynamic from 'next/dynamic';

// Charger dynamiquement les composants Recharts nécessaires
const DynamicRadialBarChart = dynamic(() => import('recharts').then(mod => mod.RadialBarChart), { ssr: false });
const DynamicPolarAngleAxis = dynamic(() => import('recharts').then(mod => mod.PolarAngleAxis), { ssr: false });
const DynamicPolarGrid = dynamic(() => import('recharts').then(mod => mod.PolarGrid), { ssr: false });
const DynamicRadialBar = dynamic(() => import('recharts').then(mod => mod.RadialBar), { ssr: false });
const DynamicPolarRadiusAxis = dynamic(() => import('recharts').then(mod => mod.PolarRadiusAxis), { ssr: false });
const DynamicLabel = dynamic(() => import('recharts').then(mod => mod.Label), { ssr: false });

import { ChartConfig, ChartContainer } from "@/components/ui/chart"

interface StatusProgressChartProps {
  percentage: number;
  size?: "sm" | "md" | "lg"; // sm pour petit (ruban), md/lg pour plus grand si utilisé ailleurs
  showLabel?: boolean;
}

// Définition du dégradé (peut être partagée ou redéfinie si nécessaire)
const multicolorGradientId = "statusProgressMulticolorGradient"; // ID unique pour ce dégradé

export function StatusProgressChart({ percentage, size = "sm", showLabel = true }: StatusProgressChartProps) {
  // S'assurer que le pourcentage est entre 0 et 100
  const safePercentage = Math.max(0, Math.min(100, percentage));
  
  // Données pour le graphique
  const chartData = [
    { value: safePercentage, fill: `url(#${multicolorGradientId})` }
  ];

  const chartConfig = {
    value: {
      label: "Complété",
    }
  } satisfies ChartConfig;

  // Configurations de taille selon la variante
  const dimensions = {
    sm: {
      height: 40,            // Hauteur de l'encadré
      innerRadiusRatio: 0.5, // Ajusté pour nouvelle barSize et taille de texte (0.65 -> 0.5)
      outerRadiusRatio: 1.0, // Maximise le rayon externe (inchangé)
      barSize: 10,          // Augmenté pour proéminence visuelle (7 -> 10)
      textSize: "text-[10px]", 
      valueSize: "text-xs"   // Réduit pour meilleur ajustement dans le trou ("text-sm" -> "text-xs")
    },
    md: {
      height: 120,
      innerRadiusRatio: 0.65,
      outerRadiusRatio: 0.85,
      barSize: 10,
      textSize: "text-sm",
      valueSize: "text-2xl"
    },
    lg: {
      height: 200,
      innerRadiusRatio: 0.7,
      outerRadiusRatio: 0.9,
      barSize: 15,
      textSize: "text-base",
      valueSize: "text-4xl"
    },
  };

  const config = dimensions[size];
  // Calcul des rayons en pixels pour RadialBarChart pour plus de précision si besoin
  // Ou conserver en pourcentage pour Recharts. Recharts gère bien les % pour inner/outerRadius.
  const innerRadiusValue = `${config.innerRadiusRatio * 100}%`;
  const outerRadiusValue = `${config.outerRadiusRatio * 100}%`;

  return (
    <div className="flex items-center justify-center">
      <ChartContainer
        config={chartConfig}
        className="aspect-square w-full h-full"
        style={{ height: config.height }}
      >
        <DynamicRadialBarChart
          data={chartData}
          startAngle={90}
          endAngle={-270}
          innerRadius={innerRadiusValue} 
          outerRadius={outerRadiusValue}
          barSize={config.barSize} // barSize est bien une prop de RadialBarChart
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <defs>
            <linearGradient id={multicolorGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00C6FF" /> 
              <stop offset="25%" stopColor="#5F27CD" /> 
              <stop offset="50%" stopColor="#FF007A" /> 
              <stop offset="75%" stopColor="#FF8C00" /> 
              <stop offset="100%" stopColor="#F9F871" />
            </linearGradient>
          </defs>
          <DynamicPolarAngleAxis 
            type="number" 
            domain={[0, 100]}
            angleAxisId={0} 
            tick={false} 
            axisLine={false} 
          />
          <DynamicPolarGrid
            gridType="circle"
            radialLines={false}
            // Laisser Recharts gérer le polarRadius de PolarGrid ou le calculer précisément
            // Si innerRadius et outerRadius de RadialBarChart sont définis, PolarGrid s'ajuste souvent bien.
            // stroke="none" // Optionnel: si ChartContainer gère déjà la couleur de fond de la grille
          />
          <DynamicRadialBar 
            dataKey="value" 
            angleAxisId={0}
            background={{ fill: "hsl(var(--muted))" }}
            cornerRadius={10} 
            // barSize est hérité de RadialBarChart ou peut être défini par donnée
          />
          {showLabel && (
            <DynamicPolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
              <DynamicLabel
                content={({ viewBox }: any) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className={`fill-foreground font-bold ${config.valueSize}`}
                        >
                          {Math.round(safePercentage)}%
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </DynamicPolarRadiusAxis>
          )}
        </DynamicRadialBarChart>
      </ChartContainer>
    </div>
  )
} 