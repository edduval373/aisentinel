// Initialize versioning data with sample version and features
import { db } from './server/db.ts';
import { versionReleases, versionFeatures, versionDeployments } from './shared/schema.ts';

async function initVersioningData() {
  console.log('Initializing versioning data...');
  
  try {
    // Check if any versions exist
    const existingVersions = await db.select().from(versionReleases);
    
    if (existingVersions.length === 0) {
      console.log('No versions found, creating initial release...');
      
      // Create version 1.0.0
      const [version1] = await db.insert(versionReleases).values({
        majorVersion: 1,
        minorVersion: 0,
        patchVersion: 0,
        title: "AI Sentinel Launch",
        description: "First stable release with comprehensive enterprise AI governance",
        isStable: true,
        isCurrentVersion: true,
        releaseDate: new Date('2025-01-15'),
        developerId: "admin",
        releaseNotes: "Complete AI governance platform with multi-provider support and enterprise security"
      }).returning();
      
      console.log('Created version 1.0.0:', version1);
      
      // Add features for version 1.0.0
      const v1Features = [
        {
          versionId: version1.id,
          title: "Multi-Provider AI Integration",
          description: "Support for OpenAI, Anthropic, Google, Perplexity, and Cohere AI models with unified interface",
          category: "integration",
          importance: "high"
        },
        {
          versionId: version1.id,
          title: "Role-Based Access Control",
          description: "Hierarchical permission system with company-specific roles and granular access controls",
          category: "security", 
          importance: "high"
        },
        {
          versionId: version1.id,
          title: "Advanced Content Filtering",
          description: "Real-time content security scanning with PII detection and policy enforcement",
          category: "security",
          importance: "high"
        },
        {
          versionId: version1.id,
          title: "Model Fusion Technology",
          description: "Combine multiple AI models for enhanced response quality and accuracy",
          category: "ai",
          importance: "medium"
        },
        {
          versionId: version1.id,
          title: "Enterprise Dashboard",
          description: "Comprehensive admin interface with analytics, user management, and system configuration",
          category: "ui",
          importance: "medium"
        }
      ];
      
      for (const feature of v1Features) {
        await db.insert(versionFeatures).values(feature);
      }
      
      console.log(`Added ${v1Features.length} features for version 1.0.0`);
      
      // Create version 1.1.0
      const [version11] = await db.insert(versionReleases).values({
        majorVersion: 1,
        minorVersion: 1,
        patchVersion: 0,
        title: "Enhanced UI & Performance",
        description: "Improved user interface with optimized layout and performance enhancements",
        isStable: false,
        isCurrentVersion: false,
        releaseDate: new Date('2025-07-31'),
        developerId: "admin",
        releaseNotes: "Button layout optimization, versioning system, and performance improvements"
      }).returning();
      
      console.log('Created version 1.1.0:', version11);
      
      // Add features for version 1.1.0
      const v11Features = [
        {
          versionId: version11.id,
          title: "Optimized Button Layout",
          description: "Improved landing page with side-by-side button arrangement for better space utilization",
          category: "ui",
          importance: "medium"
        },
        {
          versionId: version11.id,
          title: "Comprehensive Versioning System",
          description: "Full version tracking with release management, feature documentation, and deployment history",
          category: "enhancement",
          importance: "high"
        },
        {
          versionId: version11.id,
          title: "Version Information Display",
          description: "Real-time version information display on landing page footer with release details",
          category: "ui",
          importance: "low"
        }
      ];
      
      for (const feature of v11Features) {
        await db.insert(versionFeatures).values(feature);
      }
      
      console.log(`Added ${v11Features.length} features for version 1.1.0`);
      
      // Create deployment records
      await db.insert(versionDeployments).values([
        {
          versionId: version1.id,
          environment: "production",
          deployedAt: new Date('2025-01-15'),
          deployedBy: "admin",
          status: "active",
          buildNumber: "1",
          deploymentNotes: "Initial production deployment"
        },
        {
          versionId: version11.id,
          environment: "development",
          deployedAt: new Date(),
          deployedBy: "admin", 
          status: "active",
          buildNumber: "2",
          deploymentNotes: "Development testing with UI optimizations"
        }
      ]);
      
      console.log('Created deployment records');
      
    } else {
      console.log(`Found ${existingVersions.length} existing versions, skipping initialization`);
    }
    
    console.log('Versioning data initialization complete!');
    
  } catch (error) {
    console.error('Error initializing versioning data:', error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initVersioningData().then(() => process.exit(0));
}

export { initVersioningData };