import { NextResponse } from 'next/server';

/**
 * API route pour vérifier le statut d'un appel téléphonique via le backend
 * Sert de proxy vers l'API FastAPI
 */
export async function GET() {
  console.log('[API Route] START | GET /api/call/status - Requête vers http://localhost:8000/call/status');
  
  try {
    const startTime = performance.now();
    const response = await fetch('http://localhost:8000/call/status', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Utiliser un timeout court pour une meilleure réactivité
      signal: AbortSignal.timeout(1500) // 1.5 secondes max
    });

    if (!response.ok) {
      console.error(`[API Route] ERROR | GET /api/call/status - Erreur HTTP: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Erreur HTTP ${response.status}: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const endTime = performance.now();
    const clientProcessingTime = Math.round(endTime - startTime);
    
    // Ajouter des logs détaillés pour le débogage
    const telephonyActive = data.telephony_registry_active === true;
    const telecomActive = data.telecom_dump_active === true;
    
    console.log(`[API Route] INFO | TelephonyRegistry: ${telephonyActive ? 'ACTIF' : 'INACTIF'}, mCallState=${data.mCallState}`);
    console.log(`[API Route] INFO | TelecomDump: ${telecomActive ? 'ACTIF' : 'INACTIF'}, calls=${data.telecom_dump_calls?.length || 0}`);
    
    if (data.detection_method) {
      console.log(`[API Route] INFO | Méthode finale: ${data.detection_method}`);
    }
    
    if (data.detection_conflict) {
      console.warn(`[API Route] WARN | Conflit détecté: ${data.detection_method}`);
    }
    
    // Ajouter des informations de performance
    if (data.detection_time_ms) {
      console.log(`[API Route] PERF | Temps de détection backend: ${data.detection_time_ms}ms, client: ${clientProcessingTime}ms, total: ${data.detection_time_ms + clientProcessingTime}ms`);
    }

    // Déterminer le statut final de l'appel pour le log
    const callStatusText = data.call_in_progress ? "APPEL EN COURS" : "PAS D'APPEL";
    console.log(`[API Route] END | GET /api/call/status - Résultat: ${callStatusText}`);
    
    // Ajouter le temps de traitement client à la réponse
    const enrichedData = {
      ...data,
      client_processing_time_ms: clientProcessingTime,
      total_detection_time_ms: (data.detection_time_ms || 0) + clientProcessingTime
    };
    
    return NextResponse.json(enrichedData);
  } catch (error) {
    console.error('[API Route] ERROR | GET /api/call/status - Exception non gérée:', error);
    // Si c'est une erreur de timeout, ajouter un message plus clair
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Timeout de la requête API après 1.5 secondes.' },
        { status: 504 }
      );
    }
    return NextResponse.json(
      { error: `Erreur interne: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 