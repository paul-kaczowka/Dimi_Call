"use client"

import React from 'react';
import dynamic from 'next/dynamic';

// Charger dynamiquement les composants Recharts nécessaires
const DynamicRadialBarChart = dynamic(() => import('recharts').then(mod => mod.RadialBarChart), { ssr: false });
const DynamicPolarGrid = dynamic(() => import('recharts').then(mod => mod.PolarGrid), { ssr: false });
const DynamicRadialBar = dynamic(() => import('recharts').then(mod => mod.RadialBar), { ssr: false });
const DynamicPolarRadiusAxis = dynamic(() => import('recharts').then(mod => mod.PolarRadiusAxis), { ssr: false });
const DynamicLabel = dynamic(() => import('recharts').then(mod => mod.Label), { ssr: false });

import { ChartConfig, ChartContainer } from "@/components/ui/chart" // Assurez-vous que ce chemin est correct

interface ScrollProgressRadialChartProps {
  scrollPercentage: number;
  size?: number; // Taille optionnelle pour le graphique
}

const chartConfig = {
  progress: {
    label: "Scroll %",
    color: "hsl(var(--chart-1))", // Couleur par défaut de Shadcn/ui pour les graphiques
  },
} satisfies ChartConfig

export const ScrollProgressRadialChart: React.FC<ScrollProgressRadialChartProps> = ({ 
  scrollPercentage,
  size = 70, // Taille par défaut plus petite
}) => {
  const displayPercentage = Math.max(0, Math.min(100, scrollPercentage));
  const chartData = [
    { name: "progress", value: displayPercentage, fill: chartConfig.progress.color },
  ]

  // L'angle de fin détermine la "complétude" du cercle.
  // Pour un pourcentage, nous voulons que la barre remplisse proportionnellement jusqu'à 360 degrés.
  // Ou nous pouvons utiliser la valeur directement si Recharts gère le domaine 0-100.
  // Ici, la barre représente `displayPercentage` sur une échelle de 0 à 100.
  // L'angle endAngle={360} ou proche pour un cercle complet.
  // Si nous voulons un look "ouvert" comme l'exemple, nous pouvons utiliser un endAngle plus petit,
  // mais la valeur doit toujours être le pourcentage.
  // L'exemple de l'utilisateur avait endAngle={250}. Gardons cela pour le style.
  // Le calcul de la valeur de la barre doit alors être proportionnel à cet angle.
  // Simplifions : la RadialBar affiche `value` sur une plage max de 100. L'angle est pour l'esthétique.

  return (
    <ChartContainer
      config={chartConfig}
      className={`mx-auto aspect-square`}
      style={{ height: `${size}px`, width: `${size}px` }}
    >
      <DynamicRadialBarChart
        data={chartData}
        startAngle={90} // Commence en haut
        endAngle={90 + (360 * (displayPercentage / 100))} // Dynamique pour remplir le cercle
        innerRadius={size * 0.35} // Rayon intérieur proportionnel à la taille
        outerRadius={size * 0.45} // Rayon extérieur proportionnel à la taille
        barSize={size * 0.1} // Épaisseur de la barre
        margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        <DynamicPolarGrid
          gridType="circle"
          radialLines={false}
          stroke="none"
          className="first:fill-muted last:fill-background" // Couleurs de fond du cercle
          polarRadius={[size * 0.30, size * 0.25]} // Rayons pour les cercles de fond
        />
        <DynamicRadialBar
          dataKey="value"
          background
          cornerRadius={size * 0.05}
          // className="fill-primary" // Utilise la couleur définie dans chartData
        />
        <DynamicPolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <DynamicLabel
            content={({ viewBox }: any) => { // Typage de viewBox en any pour simplicité ici
              if (viewBox && viewBox.cx != null && viewBox.cy != null) {
                return (
                  <text
                    x={viewBox.cx}
                    y={viewBox.cy}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground"
                    fontSize={size * 0.2} // Taille de la police proportionnelle
                  >
                    {`${Math.round(displayPercentage)}%`}
                  </text>
                )
              }
              return null;
            }}
          />
        </DynamicPolarRadiusAxis>
      </DynamicRadialBarChart>
    </ChartContainer>
  )
}

ScrollProgressRadialChart.displayName = "ScrollProgressRadialChart"; 