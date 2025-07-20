import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

interface RequestDocument {
  _id: string;
  timestamp: string;
  query: string;
  response: {
    original_query: string;
    query_id: string;
    total_processing_time: number;
    hypotheses: Array<{
      id: string;
      title: string;
      description: string;
      rank?: number;
      novelty_score?: number;
      feasibility_score?: number;
      confidence_score?: number;
      final_score?: number;
      reasoning?: string;
      experimental_plan?: any;
      resource_requirements?: any;
      risk_factors?: string[];
      success_metrics?: string[];
      criterion_scores?: Record<string, number>;
    }>;
    processing_steps: Array<{
      step_name: string;
      status: string;
      duration_seconds: number;
      agent_outputs: Array<{
        agent_name: string;
        metadata?: {
          model?: string;
        };
      }>;
    }>;
    recommendations: string[];
  };
  created_at: string;
}

// Global variables for connection pooling
let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

const uri = process.env.MONGODB_URI;
const database = process.env.DATABASE;
const collectionName = process.env.REQUESTS_COLLECTION;

if (!uri || !database || !collectionName) {
  throw new Error('Missing MongoDB configuration. Please check your environment variables.');
}

// Create a new client and connect to MongoDB
async function getClient(): Promise<MongoClient> {
  if (client && client.topology && client.topology.isConnected()) {
    return client;
  }

  if (clientPromise) {
    return clientPromise;
  }

  clientPromise = MongoClient.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    family: 4
  });

  try {
    client = await clientPromise;
    console.log('Connected to MongoDB');
    return client;
  } catch (error) {
    clientPromise = null;
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

// Get database instance
async function getDB(): Promise<Db> {
  const mongoClient = await getClient();
  return mongoClient.db(database);
}

// Get collection instance
async function getCollection(): Promise<Collection<RequestDocument>> {
  const db = await getDB();
  return db.collection<RequestDocument>(collectionName);
}

export async function getAllRequests(): Promise<RequestDocument[]> {
  try {
    const collection = await getCollection();
    const requests = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    return requests;
  } catch (error) {
    console.error('Failed to fetch requests:', error);
    throw error;
  }
}

export async function getRequestById(id: string): Promise<RequestDocument | null> {
  try {
    const collection = await getCollection();
    
    // Try to find using the id as string first
    let request = await collection.findOne({ _id: id });
    
    // If not found and the id looks like an ObjectId, try with ObjectId
    if (!request && ObjectId.isValid(id)) {
      request = await collection.findOne({ _id: new ObjectId(id) });
    }
    
    return request;
  } catch (error) {
    console.error('Failed to fetch request by ID:', error);
    throw error;
  }
}

export async function getRequestsByQuery(queryText: string): Promise<RequestDocument[]> {
  try {
    const collection = await getCollection();
    const requests = await collection
      .find({
        $or: [
          { query: { $regex: queryText, $options: 'i' } },
          { 'response.original_query': { $regex: queryText, $options: 'i' } }
        ]
      })
      .sort({ created_at: -1 })
      .toArray();
    
    return requests;
  } catch (error) {
    console.error('Failed to search requests:', error);
    throw error;
  }
}

export async function getRequestStats(): Promise<{
  totalRequests: number;
  totalHypotheses: number;
  avgProcessingTime: number;
  avgConfidence: number;
}> {
  try {
    const requests = await getAllRequests();
    
    const totalRequests = requests.length;
    const totalHypotheses = requests.reduce((sum, req) => sum + (req.response?.hypotheses?.length || 0), 0);
    const avgProcessingTime = totalRequests > 0 
      ? requests.reduce((sum, req) => sum + (req.response?.total_processing_time || 0), 0) / totalRequests 
      : 0;
    
    let totalConfidence = 0;
    let confidenceCount = 0;
    
    requests.forEach(req => {
      req.response?.hypotheses?.forEach(hyp => {
        if (hyp.confidence_score !== undefined) {
          totalConfidence += hyp.confidence_score;
          confidenceCount++;
        }
      });
    });
    
    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    return {
      totalRequests,
      totalHypotheses,
      avgProcessingTime,
      avgConfidence
    };
  } catch (error) {
    console.error('Failed to get request stats:', error);
    throw error;
  }
}

export async function deleteRequest(id: string): Promise<boolean> {
  try {
    const collection = await getCollection();
    
    // Try to delete using the id as both string and ObjectId
    let result = await collection.deleteOne({ _id: id });
    
    // If no document was deleted and the id looks like an ObjectId, try with ObjectId
    if (result.deletedCount === 0 && ObjectId.isValid(id)) {
      result = await collection.deleteOne({ _id: new ObjectId(id) });
    }
    
    console.log(`Delete attempt for ID ${id}: ${result.deletedCount} documents deleted`);
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Failed to delete request:', error);
    throw error;
  }
}

export type { RequestDocument };