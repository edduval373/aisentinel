// Initialize versioning tables and sample data
import { db } from "./server/db.js";
import { versionReleases, versionFeatures, versionDeployments } from "./shared/schema.js";

async function initializeVersioning() {
  try {
    console.log("Initializing versioning system...");
    
    // Create the first version release
    const firstRelease = await db.insert(versionReleases).values({
      majorVersion: 1,
      minorVersion: 0,
      patchVersion: 0,
      title: "Initial Release - AI Sentinel Launch",
      description: "First stable release of AI Sentinel with comprehensive enterprise AI governance capabilities",
      isStable: true,
      isCurrentVersion: true,
      releaseDate: new Date('2025-01-15'),
      developerId: "admin",
      releaseNotes: "Complete AI governance platform with multi-provider support, role-based access control, and comprehensive security features"
    }).returning();
    
    console.log("Created first release:", firstRelease[0]);
    
    // Add some features for the first release
    const features = [
      {
        versionId: firstRelease[0].id,
        title: "Multi-Provider AI Integration",
        description: "Support for OpenAI, Anthropic, Google, Perplexity, and Cohere AI models",
        category: "integration",
        importance: "high"
      },
      {
        versionId: firstRelease[0].id,
        title: "Role-Based Access Control",
        description: "Hierarchical permission system with company-specific roles",
        category: "security",
        importance: "high"
      },
      {
        versionId: firstRelease[0].id,
        title: "Content Security & Filtering",
        description: "Advanced content filtering and security monitoring",
        category: "security",
        importance: "high"
      },
      {
        versionId: firstRelease[0].id,
        title: "Model Fusion Technology",
        description: "Combine multiple AI models for enhanced responses",
        category: "ai",
        importance: "medium"
      }
    ];
    
    for (const feature of features) {
      await db.insert(versionFeatures).values(feature);
    }
    
    console.log("Added features for version 1.0.0");
    
    // Create deployment record
    await db.insert(versionDeployments).values({
      versionId: firstRelease[0].id,
      environment: "production",
      deployedAt: new Date(),
      deployedBy: "system",
      status: "active",
      buildNumber: "1",
      deploymentNotes: "Initial production deployment"
    });
    
    console.log("Versioning system initialized successfully!");
    
  } catch (error) {
    console.error("Error initializing versioning:", error);
  }
}

initializeVersioning();