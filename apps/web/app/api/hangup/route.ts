import { NextResponse } from 'next/server';

/**
 * Route API pour raccrocher un appel téléphonique
 * Cette route fait simplement un proxy vers l'API FastAPI backend
 */
export async function POST(request: Request) {
  try {
    // Récupérer les données de la requête
    const requestData = await request.json();
    
    // Utiliser l'API backend pour raccrocher l'appel
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/adb/hangup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    // Si la réponse n'est pas OK, retourner l'erreur
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        detail: `Erreur lors du raccrochage de l'appel: ${response.status} ${response.statusText}`
      }));
      
      return NextResponse.json(
        { error: errorData.detail || "Erreur lors du raccrochage de l'appel" }, 
        { status: response.status }
      );
    }

    // Renvoyer les données reçues de l'API FastAPI
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Route] Erreur lors du raccrochage de l\'appel:', error);
    return NextResponse.json(
      { error: "Erreur lors du raccrochage de l'appel" }, 
      { status: 500 }
    );
  }
} 