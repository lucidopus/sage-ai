import { NextRequest, NextResponse } from 'next/server';
import { 
  getAllRequests, 
  getRequestById, 
  getRequestsByQuery, 
  getRequestStats,
  deleteRequest,
  RequestDocument 
} from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const id = searchParams.get('id');
    const limit = searchParams.get('limit');
    const stats = searchParams.get('stats');

    let result;

    if (stats === 'true') {
      // Return aggregated statistics
      result = await getRequestStats();
    } else if (id) {
      // Get specific request by ID
      result = await getRequestById(id);
      if (!result) {
        return NextResponse.json(
          { error: 'Request not found' },
          { status: 404 }
        );
      }
    } else if (search) {
      // Search requests by query text
      result = await getRequestsByQuery(search);
    } else {
      // Get all requests
      let requests = await getAllRequests();
      
      // Apply limit if specified
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          requests = requests.slice(0, limitNum);
        }
      }
      
      result = requests;
    }

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, search } = body;

    if (!query && !search) {
      return NextResponse.json(
        { error: 'Missing query or search parameter' },
        { status: 400 }
      );
    }

    let result;
    if (search) {
      result = await getRequestsByQuery(search);
    } else {
      result = await getAllRequests();
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    console.log('DELETE request received for ID:', id);

    if (!id) {
      return NextResponse.json(
        { error: 'Missing request ID' },
        { status: 400 }
      );
    }

    // First, let's check if the document exists
    const existingDoc = await getRequestById(id);
    console.log('Document exists check:', existingDoc ? 'Found' : 'Not found');

    const success = await deleteRequest(id);
    console.log('Delete operation result:', success);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Request not found or could not be deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Request deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to delete request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}