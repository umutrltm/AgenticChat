import { PredictionServiceClient } from '@google-cloud/aiplatform';
import { helpers } from '@google-cloud/aiplatform';

const project = process.env.GOOGLE_CLOUD_PROJECT;
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const embeddingModel = process.env.EMBEDDING_MODEL || 'text-embedding-004';

const client = new PredictionServiceClient({
  apiEndpoint: `${location}-aiplatform.googleapis.com`,
});

/**
 * Generate embeddings for a list of texts
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function generateEmbeddings(texts) {
  if (!Array.isArray(texts)) {
    texts = [texts];
  }

  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${embeddingModel}`;

  const instances = texts.map(text => ({
    content: text,
    task_type: 'RETRIEVAL_DOCUMENT'
  }));

  const request = {
    endpoint,
    instances: instances.map(instance => helpers.toValue(instance)),
  };

  try {
    const [response] = await client.predict(request);
    
    const embeddings = response.predictions.map(prediction => {
      const predictionObj = helpers.fromValue(prediction);
      return predictionObj.embeddings.values;
    });

    return embeddings;
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
}

/**
 * Generate embedding for a single text (query)
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} Embedding vector
 */
export async function generateQueryEmbedding(text) {
  const endpoint = `projects/${project}/locations/${location}/publishers/google/models/${embeddingModel}`;

  const instance = {
    content: text,
    task_type: 'RETRIEVAL_QUERY'
  };

  const request = {
    endpoint,
    instances: [helpers.toValue(instance)],
  };

  try {
    const [response] = await client.predict(request);
    const predictionObj = helpers.fromValue(response.predictions[0]);
    return predictionObj.embeddings.values;
  } catch (error) {
    console.error('Error generating query embedding:', error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} a - First vector
 * @param {number[]} b - Second vector
 * @returns {number} Cosine similarity score
 */
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}
