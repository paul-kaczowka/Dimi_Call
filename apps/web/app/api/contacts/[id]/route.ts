import { NextResponse } from 'next/server';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * Route API pour récupérer un contact par son ID
 * Cette route fait simplement un proxy vers l'API FastAPI backend
 */
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = params;
  
  if (!id) {
    return NextResponse.json(
      { error: "ID de contact manquant" },
      { status: 400 }
    );
  }

  try {
    // Utiliser l'API backend pour récupérer le contact
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/contacts/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Si la réponse n'est pas OK, retourner l'erreur
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        detail: `Erreur lors de la récupération du contact: ${response.status} ${response.statusText}`
      }));
      
      return NextResponse.json(
        { error: errorData.detail || "Erreur lors de la récupération du contact" }, 
        { status: response.status }
      );
    }

    // Renvoyer les données reçues de l'API FastAPI
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[API Route] Erreur lors de la récupération du contact:', error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du contact" }, 
      { status: 500 }
    );
  }
} 