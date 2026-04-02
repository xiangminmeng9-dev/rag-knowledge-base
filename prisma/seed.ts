import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const passwordHash = await hash(adminPassword, 12);
  const now = new Date();

  // Create default admin user
  await prisma.user.upsert({
    where: { username: adminUsername },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      updatedAt: now,
    },
    create: {
      id: crypto.randomUUID(),
      username: adminUsername,
      passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      updatedAt: now,
    },
  });

  console.log(`Default admin user "${adminUsername}" created/updated.`);

  // Create default embedding model (local - no API needed)
  await prisma.embeddingModel.upsert({
    where: { name: "local-embedding" },
    update: {
      provider: "local",
      modelId: "local-ngram-512",
      dimensions: 512,
      isDefault: true,
    },
    create: {
      id: crypto.randomUUID(),
      name: "local-embedding",
      provider: "local",
      modelId: "local-ngram-512",
      dimensions: 512,
      isDefault: true,
    },
  });

  // Create OpenAI embedding models
  await prisma.embeddingModel.upsert({
    where: { name: "text-embedding-3-small" },
    update: {
      provider: "OpenAI",
      modelId: "text-embedding-3-small",
      dimensions: 1536,
      isDefault: false,
    },
    create: {
      id: crypto.randomUUID(),
      name: "text-embedding-3-small",
      provider: "OpenAI",
      modelId: "text-embedding-3-small",
      dimensions: 1536,
      isDefault: false,
    },
  });

  await prisma.embeddingModel.upsert({
    where: { name: "text-embedding-3-large" },
    update: {
      provider: "OpenAI",
      modelId: "text-embedding-3-large",
      dimensions: 3072,
      isDefault: false,
    },
    create: {
      id: crypto.randomUUID(),
      name: "text-embedding-3-large",
      provider: "OpenAI",
      modelId: "text-embedding-3-large",
      dimensions: 3072,
      isDefault: false,
    },
  });

  // Set any other embedding models to non-default
  await prisma.embeddingModel.updateMany({
    where: { name: { not: "local-embedding" } },
    data: { isDefault: false },
  });

  console.log("Embedding models created/updated (local, text-embedding-3-small, text-embedding-3-large).");

  // Create DeepSeek LLM provider if API key is available
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    const existing = await prisma.lLMProvider.findFirst({
      where: { name: "DeepSeek" },
    });
    if (!existing) {
      // Deactivate any existing providers
      await prisma.lLMProvider.updateMany({
        data: { isActive: false },
      });
      await prisma.lLMProvider.create({
        data: {
          id: crypto.randomUUID(),
          name: "DeepSeek",
          apiBaseUrl: "https://api.deepseek.com/v1",
          apiKey: deepseekKey,
          modelId: "deepseek-chat",
          isActive: true,
        },
      });
      console.log("DeepSeek LLM provider created.");
    } else {
      // Update existing with new key
      await prisma.lLMProvider.update({
        where: { id: existing.id },
        data: {
          apiKey: deepseekKey,
          isActive: true,
        },
      });
      console.log("DeepSeek LLM provider updated.");
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
