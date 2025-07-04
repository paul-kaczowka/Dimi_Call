import { useState, useEffect, useCallback } from 'react';

// Types simplifiés pour éviter les erreurs de dépendances
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

// Service Web Vitals simplifié
class SimpleWebVitalsService {
  private metrics: WebVitalMetric[] = [];
  private sessionId: string;
  private listeners: Array<(metric: WebVitalMetric) => void> = [];

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeWebVitals();
  }

  private initializeWebVitals() {
    // Simuler la collecte de métriques Web Vitals
    // En production, vous utiliseriez le package 'web-vitals'
    
    // Simuler LCP (Largest Contentful Paint)
    setTimeout(() => {
      this.handleMetric({
        name: 'LCP',
        value: 1200 + Math.random() * 2000,
        delta: 0,
        id: 'lcp-1',
        entries: []
      });
    }, 1000);

    // Simuler FID (First Input Delay)
    setTimeout(() => {
      this.handleMetric({
        name: 'FID',
        value: 50 + Math.random() * 200,
        delta: 0,
        id: 'fid-1',
        entries: []
      });
    }, 2000);

    // Simuler CLS (Cumulative Layout Shift)
    setTimeout(() => {
      this.handleMetric({
        name: 'CLS',
        value: Math.random() * 0.3,
        delta: 0,
        id: 'cls-1',
        entries: []
      });
    }, 3000);
  }

  private handleMetric(metric: any) {
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

  private getConnectionType(): string | undefined {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || connection?.type;
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

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

  getMetrics(): WebVitalMetric[] {
    return [...this.metrics];
  }

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

  async measureCustomAction<T>(name: string, action: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    
    try {
      const result = await action();
      const endTime = performance.now();
      const duration = endTime - startTime;

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

      return { result, duration };
    } catch (error) {
      throw error;
    }
  }

  getMetricsByType(type: string): WebVitalMetric[] {
    return this.metrics.filter(metric => metric.name === type);
  }

  getMetricsByRating(rating: 'good' | 'needs-improvement' | 'poor'): WebVitalMetric[] {
    return this.metrics.filter(metric => metric.rating === rating);
  }

  getPerformanceSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      good: this.getMetricsByRating('good').length,
      needsImprovement: this.getMetricsByRating('needs-improvement').length,
      poor: this.getMetricsByRating('poor').length,
      averageValues: {} as Record<string, number>,
    };

    const metricTypes = [...new Set(this.metrics.map(m => m.name))];
    metricTypes.forEach(type => {
      const typeMetrics = this.getMetricsByType(type);
      if (typeMetrics.length > 0) {
        summary.averageValues[type] = typeMetrics.reduce((sum, m) => sum + m.value, 0) / typeMetrics.length;
      }
    });

    return summary;
  }
}

// Instance singleton
const webVitalsService = new SimpleWebVitalsService();

export const useWebVitals = () => {
  const [metrics, setMetrics] = useState<WebVitalMetric[]>([]);
  const [performanceSummary, setPerformanceSummary] = useState(webVitalsService.getPerformanceSummary());

  useEffect(() => {
    const unsubscribe = webVitalsService.onMetric((metric) => {
      setMetrics(webVitalsService.getMetrics());
      setPerformanceSummary(webVitalsService.getPerformanceSummary());
    });

    // Initialiser avec les métriques existantes
    setMetrics(webVitalsService.getMetrics());

    return unsubscribe;
  }, []);

  const measureAction = useCallback(async <T>(name: string, action: () => T | Promise<T>) => {
    return await webVitalsService.measureCustomAction(name, action);
  }, []);

  const getReport = useCallback(() => {
    return webVitalsService.getPerformanceReport();
  }, []);

  const getMetricsByType = useCallback((type: string) => {
    return webVitalsService.getMetricsByType(type);
  }, []);

  const getMetricsByRating = useCallback((rating: 'good' | 'needs-improvement' | 'poor') => {
    return webVitalsService.getMetricsByRating(rating);
  }, []);

  return {
    metrics,
    performanceSummary,
    measureAction,
    getReport,
    getMetricsByType,
    getMetricsByRating,
  };
}; 