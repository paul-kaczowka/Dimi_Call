import { getCLS, getFID, getFCP, getLCP, getTTFB, Metric } from 'web-vitals';

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
}

export interface PerformanceReport {
  sessionId: string;
  metrics: WebVitalMetric[];
  deviceInfo: {
    userAgent: string;
    viewport: { width: number; height: number };
    connectionType?: string;
    deviceMemory?: number;
    hardwareConcurrency?: number;
  };
  timestamp: number;
}

class WebVitalsService {
  private metrics: WebVitalMetric[] = [];
  private sessionId: string;
  private listeners: Array<(metric: WebVitalMetric) => void> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeWebVitals();
  }

  // Initialiser la collecte des Web Vitals
  private initializeWebVitals() {
    // Cumulative Layout Shift
    getCLS(this.handleMetric.bind(this));
    
    // First Input Delay
    getFID(this.handleMetric.bind(this));
    
    // First Contentful Paint
    getFCP(this.handleMetric.bind(this));
    
    // Largest Contentful Paint
    getLCP(this.handleMetric.bind(this));
    
    // Time to First Byte
    getTTFB(this.handleMetric.bind(this));
  }

  // Traiter une métrique reçue
  private handleMetric(metric: Metric) {
    const webVitalMetric: WebVitalMetric = {
      name: metric.name,
      value: metric.value,
      rating: this.getRating(metric.name, metric.value),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
    };

    this.metrics.push(webVitalMetric);
    this.notifyListeners(webVitalMetric);

    console.log(`Web Vital - ${metric.name}:`, {
      value: metric.value,
      rating: webVitalMetric.rating,
      timestamp: new Date(webVitalMetric.timestamp).toISOString(),
    });
  }

  // Déterminer le rating d'une métrique
  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = {
      CLS: { good: 0.1, poor: 0.25 },
      FID: { good: 100, poor: 300 },
      FCP: { good: 1800, poor: 3000 },
      LCP: { good: 2500, poor: 4000 },
      TTFB: { good: 800, poor: 1800 },
    };

    const threshold = thresholds[name as keyof typeof thresholds];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  // Obtenir le type de connexion
  private getConnectionType(): string | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || connection?.type;
  }

  // Générer un ID de session unique
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Écouter les nouvelles métriques
  onMetric(listener: (metric: WebVitalMetric) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(metric: WebVitalMetric) {
    this.listeners.forEach(listener => listener(metric));
  }

  // Obtenir toutes les métriques collectées
  getMetrics(): WebVitalMetric[] {
    return [...this.metrics];
  }

  // Obtenir un rapport de performance complet
  getPerformanceReport(): PerformanceReport {
    return {
      sessionId: this.sessionId,
      metrics: this.getMetrics(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        connectionType: this.getConnectionType(),
        deviceMemory: (navigator as any).deviceMemory,
        hardwareConcurrency: navigator.hardwareConcurrency,
      },
      timestamp: Date.now(),
    };
  }

  // Envoyer les métriques vers un service externe (Supabase, Analytics, etc.)
  async sendMetrics(endpoint?: string): Promise<boolean> {
    try {
      const report = this.getPerformanceReport();
      
      if (endpoint) {
        // Envoyer vers un endpoint personnalisé
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(report),
        });
        
        return response.ok;
      } else {
        // Envoyer vers Supabase (si configuré)
        // Vous pouvez intégrer ici avec supabaseService
        console.log('Rapport de performance:', report);
        return true;
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des métriques:', error);
      return false;
    }
  }

  // Mesurer une action personnalisée
  measureCustomAction<T>(name: string, action: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      
      try {
        const result = await action();
        const endTime = performance.now();
        const duration = endTime - startTime;

        // Créer une métrique personnalisée
        const customMetric: WebVitalMetric = {
          name: `custom-${name}`,
          value: duration,
          rating: duration < 100 ? 'good' : duration < 500 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connectionType: this.getConnectionType(),
        };

        this.metrics.push(customMetric);
        this.notifyListeners(customMetric);

        resolve({ result, duration });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Mesurer le temps de rendu d'un composant React
  measureComponentRender(componentName: string, renderFunction: () => void): number {
    const startTime = performance.now();
    renderFunction();
    const endTime = performance.now();
    const duration = endTime - startTime;

    const renderMetric: WebVitalMetric = {
      name: `component-render-${componentName}`,
      value: duration,
      rating: duration < 16 ? 'good' : duration < 50 ? 'needs-improvement' : 'poor', // 16ms = 60fps
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
    };

    this.metrics.push(renderMetric);
    this.notifyListeners(renderMetric);

    return duration;
  }

  // Obtenir les métriques par type
  getMetricsByType(type: string): WebVitalMetric[] {
    return this.metrics.filter(metric => metric.name === type);
  }

  // Obtenir les métriques avec un rating spécifique
  getMetricsByRating(rating: 'good' | 'needs-improvement' | 'poor'): WebVitalMetric[] {
    return this.metrics.filter(metric => metric.rating === rating);
  }

  // Obtenir un résumé des performances
  getPerformanceSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      good: this.getMetricsByRating('good').length,
      needsImprovement: this.getMetricsByRating('needs-improvement').length,
      poor: this.getMetricsByRating('poor').length,
      averageValues: {} as Record<string, number>,
    };

    // Calculer les valeurs moyennes par type de métrique
    const metricTypes = [...new Set(this.metrics.map(m => m.name))];
    metricTypes.forEach(type => {
      const typeMetrics = this.getMetricsByType(type);
      if (typeMetrics.length > 0) {
        summary.averageValues[type] = typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length;
      }
    });

    return summary;
  }

  // Nettoyer les métriques anciennes (garder seulement les N dernières)
  cleanupOldMetrics(maxMetrics: number = 100) {
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
  }
}

// Instance singleton
export const webVitalsService = new WebVitalsService(); 