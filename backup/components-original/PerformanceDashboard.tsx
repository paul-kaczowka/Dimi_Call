import React, { useState } from 'react';
import { useWebVitals, WebVitalMetric } from '../hooks/useWebVitals';
import { Theme } from '../types';
import { Button } from './Common';

interface PerformanceDashboardProps {
  theme: Theme;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ theme }) => {
  const { metrics, performanceSummary, getReport, getMetricsByType, getMetricsByRating } = useWebVitals();
  const [selectedMetricType, setSelectedMetricType] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const cardBg = theme === Theme.Dark ? 'bg-oled-card' : 'bg-light-card';
  const textColor = theme === Theme.Dark ? 'text-oled-text' : 'text-light-text';
  const textDimColor = theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim';
  const borderColor = theme === Theme.Dark ? 'border-oled-border' : 'border-light-border';
  const inputBg = theme === Theme.Dark ? 'bg-oled-interactive' : 'bg-light-interactive';

  const getRatingColor = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return 'text-green-500 bg-green-500/10';
      case 'needs-improvement':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'poor':
        return 'text-red-500 bg-red-500/10';
      default:
        return textDimColor;
    }
  };

  const getRatingIcon = (rating: 'good' | 'needs-improvement' | 'poor') => {
    switch (rating) {
      case 'good':
        return '✅';
      case 'needs-improvement':
        return '⚠️';
      case 'poor':
        return '❌';
      default:
        return '❓';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    if (name.includes('custom-')) {
      return `${value.toFixed(1)}ms`;
    }
    return `${Math.round(value)}ms`;
  };

  const getMetricDescription = (name: string) => {
    const descriptions: Record<string, string> = {
      'LCP': 'Largest Contentful Paint - Temps de chargement du plus gros élément',
      'FID': 'First Input Delay - Délai de première interaction',
      'CLS': 'Cumulative Layout Shift - Stabilité visuelle de la page',
      'FCP': 'First Contentful Paint - Temps du premier contenu affiché',
      'TTFB': 'Time to First Byte - Temps de réponse du serveur',
    };
    
    if (name.startsWith('custom-')) {
      return `Action personnalisée: ${name.replace('custom-', '')}`;
    }
    
    return descriptions[name] || name;
  };

  const exportReport = () => {
    const report = getReport();
    const dataStr = JSON.stringify(report, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const uniqueMetricTypes = [...new Set(metrics.map(m => m.name))];

  return (
    <div className={`p-4 rounded-xl ${cardBg} ${textColor} border ${borderColor} space-y-4`}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">📊</div>
          <div>
            <h3 className="text-lg font-semibold">Performance Dashboard</h3>
            <p className={`text-sm ${textDimColor}`}>
              Métriques Web Vitals en temps réel
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
          >
            {showDetails ? '👁️‍🗨️ Masquer' : '👁️ Détails'}
          </Button>
          <Button
            onClick={exportReport}
            variant="secondary"
            size="sm"
            disabled={metrics.length === 0}
          >
            📥 Exporter
          </Button>
        </div>
      </div>

      {/* Résumé des performances */}
      <div className={`p-3 rounded-lg ${inputBg} border ${borderColor}`}>
        <h4 className="text-sm font-medium mb-3">Résumé des performances</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{performanceSummary.good}</div>
            <div className={`text-xs ${textDimColor}`}>Bonnes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-500">{performanceSummary.needsImprovement}</div>
            <div className={`text-xs ${textDimColor}`}>À améliorer</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{performanceSummary.poor}</div>
            <div className={`text-xs ${textDimColor}`}>Mauvaises</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{performanceSummary.totalMetrics}</div>
            <div className={`text-xs ${textDimColor}`}>Total</div>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      {Object.entries(performanceSummary.averageValues).length > 0 && (
        <div className={`p-3 rounded-lg ${inputBg} border ${borderColor}`}>
          <h4 className="text-sm font-medium mb-3">Valeurs moyennes</h4>
          <div className="space-y-2">
            {Object.entries(performanceSummary.averageValues).map(([metricType, avgValue]) => {
              const latestMetric = metrics.filter(m => m.name === metricType).slice(-1)[0];
              const rating = latestMetric?.rating || 'good';
              
              return (
                <div key={metricType} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{getRatingIcon(rating)}</span>
                    <span className="text-sm font-medium">{metricType}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm px-2 py-1 rounded ${getRatingColor(rating)}`}>
                      {formatValue(metricType, avgValue)}
                    </span>
                    <Button
                      onClick={() => setSelectedMetricType(selectedMetricType === metricType ? null : metricType)}
                      variant="ghost"
                      size="sm"
                      className="!p-1"
                    >
                      {selectedMetricType === metricType ? '🔽' : '▶️'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Détails de la métrique sélectionnée */}
      {selectedMetricType && (
        <div className={`p-3 rounded-lg ${inputBg} border ${borderColor}`}>
          <h4 className="text-sm font-medium mb-2">Détails - {selectedMetricType}</h4>
          <p className={`text-xs ${textDimColor} mb-3`}>
            {getMetricDescription(selectedMetricType)}
          </p>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {getMetricsByType(selectedMetricType).slice(-5).map((metric, index) => (
              <div key={`${metric.timestamp}-${index}`} className="flex items-center justify-between text-xs">
                <span className={textDimColor}>
                  {new Date(metric.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded ${getRatingColor(metric.rating)}`}>
                    {formatValue(metric.name, metric.value)}
                  </span>
                  <span>{getRatingIcon(metric.rating)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Liste détaillée des métriques */}
      {showDetails && metrics.length > 0 && (
        <div className={`p-3 rounded-lg ${inputBg} border ${borderColor}`}>
          <h4 className="text-sm font-medium mb-3">Historique complet</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {metrics.slice(-10).reverse().map((metric, index) => (
              <div key={`${metric.timestamp}-${index}`} className={`p-2 rounded border ${borderColor} bg-opacity-50`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span>{getRatingIcon(metric.rating)}</span>
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getRatingColor(metric.rating)}`}>
                    {formatValue(metric.name, metric.value)}
                  </span>
                </div>
                <div className={`text-xs ${textDimColor} flex items-center justify-between`}>
                  <span>{new Date(metric.timestamp).toLocaleString()}</span>
                  {metric.connectionType && (
                    <span>📶 {metric.connectionType}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Message si aucune métrique */}
      {metrics.length === 0 && (
        <div className={`p-6 text-center ${inputBg} rounded-lg border ${borderColor}`}>
          <div className="text-4xl mb-2">⏱️</div>
          <h4 className="text-sm font-medium mb-1">Collecte des métriques en cours...</h4>
          <p className={`text-xs ${textDimColor}`}>
            Les métriques Web Vitals apparaîtront ici au fur et à mesure de votre utilisation de l'application.
          </p>
        </div>
      )}

      {/* Conseils d'optimisation */}
      {performanceSummary.poor > 0 && (
        <div className={`p-3 rounded-lg border-2 border-red-500/20 bg-red-500/5`}>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-500">⚠️</span>
            <h4 className="text-sm font-medium text-red-500">Optimisations recommandées</h4>
          </div>
          <ul className={`text-xs ${textDimColor} space-y-1 list-disc list-inside`}>
            <li>Vérifiez la taille des images et utilisez des formats modernes (WebP, AVIF)</li>
            <li>Minimisez les changements de layout pendant le chargement</li>
            <li>Optimisez les scripts JavaScript lourds</li>
            <li>Utilisez la mise en cache pour améliorer les temps de réponse</li>
          </ul>
        </div>
      )}
    </div>
  );
}; 