import { ChromaClient } from "chromadb";

let client: ChromaClient | null = null;

function getClient(): ChromaClient {
  if (!client) {
    const chromaUrl = process.env.CHROMA_URL || "http://localhost:8000";
    const url = new URL(chromaUrl);
    client = new ChromaClient({
      host: url.hostname,
      port: parseInt(url.port || (url.protocol === "https:" ? "443" : "8000"), 10),
      ssl: url.protocol === "https:",
    });
  }
  return client;
}

export async function getOrCreateCollection(name: string) {
  const chromaClient = getClient();
  return chromaClient.getOrCreateCollection({ name });
}

export async function getCollection(name: string) {
  const chromaClient = getClient();
  return chromaClient.getCollection({ name });
}

export async function deleteCollection(name: string) {
  const chromaClient = getClient();
  return chromaClient.deleteCollection({ name });
}

export { getClient };
