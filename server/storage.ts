import {
  users,
  companies,
  companyEmployees,
  companyRoles,
  aiModels,
  activityTypes,
  userActivities,
  chatSessions,
  chatMessages,
  contextDocuments,
  activityContextLinks,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type CompanyEmployee,
  type InsertCompanyEmployee,
  type CompanyRole,
  type InsertCompanyRole,
  type AiModel,
  type InsertAiModel,
  type ActivityType,
  type InsertActivityType,
  type UserActivity,
  type InsertUserActivity,
  type ChatSession,
  type InsertChatSession,
  type ChatMessage,
  type InsertChatMessage,
  type ContextDocument,
  type InsertContextDocument,
  type ActivityContextLink,
  type InsertActivityContextLink,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Company operations
  getCompanyByDomain(domain: string): Promise<Company | undefined>;
  getCompanies(): Promise<Company[]>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company>;
  deleteCompany(id: number): Promise<void>;
  getCompanyById(id: number): Promise<Company | undefined>;
  getCompanyEmployees(companyId: number): Promise<CompanyEmployee[]>;
  addCompanyEmployee(employee: InsertCompanyEmployee): Promise<CompanyEmployee>;
  isEmployeeAuthorized(email: string, companyId: number): Promise<boolean>;
  
  // Owner operations
  getCompanyOwners(companyId: number): Promise<User[]>;
  addCompanyOwner(companyId: number, userData: { firstName: string; lastName: string; email: string; department?: string }): Promise<User>;
  updateCompanyOwner(userId: string, userData: { firstName?: string; lastName?: string; email?: string; department?: string }): Promise<User>;
  removeCompanyOwner(userId: string, companyId: number): Promise<void>;
  
  // Company Role operations
  getCompanyRoles(companyId: number): Promise<CompanyRole[]>;
  createCompanyRole(role: InsertCompanyRole): Promise<CompanyRole>;
  updateCompanyRole(id: number, role: Partial<InsertCompanyRole>): Promise<CompanyRole>;
  deleteCompanyRole(id: number): Promise<void>;
  getUserRoleLevel(userId: string): Promise<number>;
  
  // AI Models operations
  getAiModels(companyId: number): Promise<AiModel[]>;
  getEnabledAiModels(companyId: number): Promise<AiModel[]>;
  createAiModel(model: InsertAiModel): Promise<AiModel>;
  updateAiModel(id: number, model: Partial<InsertAiModel>): Promise<AiModel>;
  
  // Activity Types operations
  getActivityTypes(companyId: number): Promise<ActivityType[]>;
  getEnabledActivityTypes(companyId: number): Promise<ActivityType[]>;
  createActivityType(activityType: InsertActivityType): Promise<ActivityType>;
  updateActivityType(id: number, activityType: Partial<InsertActivityType>): Promise<ActivityType>;
  
  // User Activities operations
  createUserActivity(activity: InsertUserActivity): Promise<UserActivity>;
  getUserActivities(companyId: number, userId?: string, limit?: number): Promise<UserActivity[]>;
  getActivityStats(companyId: number): Promise<{
    totalConversations: number;
    securityBlocks: number;
    activeUsers: number;
    policyViolations: number;
  }>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: number, companyId: number): Promise<ChatSession | undefined>;
  getUserChatSessions(userId: string, companyId: number): Promise<(ChatSession & { messageCount?: number; lastMessage?: string })[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: number, companyId: number): Promise<ChatMessage[]>;
  
  // Context Document operations
  getContextDocuments(companyId: number): Promise<ContextDocument[]>;
  getEnabledContextDocuments(companyId: number): Promise<ContextDocument[]>;
  createContextDocument(document: InsertContextDocument): Promise<ContextDocument>;
  updateContextDocument(id: number, document: Partial<InsertContextDocument>): Promise<ContextDocument>;
  deleteContextDocument(id: number): Promise<void>;
  
  // Activity Context Link operations
  getActivityContextLinks(activityTypeId: number): Promise<(ActivityContextLink & { document?: ContextDocument })[]>;
  createActivityContextLink(link: InsertActivityContextLink): Promise<ActivityContextLink>;
  deleteActivityContextLink(activityTypeId: number, documentId: number): Promise<void>;
  getContextForActivity(activityTypeId: number, companyId: number): Promise<ContextDocument[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations (IMPORTANT: mandatory for Replit Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // Check if this is the first user - make them super-user
    const userCount = await db.select({ count: count() }).from(users);
    const isFirstUser = userCount[0].count === 0;
    
    if (isFirstUser) {
      userData.role = 'super-user';
      userData.roleLevel = 100; // Super-user level
    } else {
      // Check if user's email domain matches a company and auto-assign
      if (userData.email) {
        const emailDomain = userData.email.split('@')[1];
        const company = await this.getCompanyByDomain(emailDomain);
        
        if (company && company.isActive) {
          // Check if user is authorized employee
          const isAuthorized = await this.isEmployeeAuthorized(userData.email, company.id);
          if (isAuthorized) {
            userData.companyId = company.id;
            userData.role = 'user';
            userData.roleLevel = 1; // Default user level
          }
        }
      }
    }

    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompanyByDomain(domain: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.domain, domain));
    return company;
  }

  async getCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(companies.name);
  }

  async createCompany(company: InsertCompany): Promise<Company> {
    const [newCompany] = await db
      .insert(companies)
      .values(company)
      .returning();
    return newCompany;
  }

  async updateCompany(id: number, company: Partial<InsertCompany>): Promise<Company> {
    const [updatedCompany] = await db
      .update(companies)
      .set({
        ...company,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, id))
      .returning();
    return updatedCompany;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
  }

  async getCompanyById(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyEmployees(companyId: number): Promise<CompanyEmployee[]> {
    return await db.select().from(companyEmployees).where(eq(companyEmployees.companyId, companyId));
  }

  async addCompanyEmployee(employee: InsertCompanyEmployee): Promise<CompanyEmployee> {
    const [created] = await db.insert(companyEmployees).values(employee).returning();
    return created;
  }

  async isEmployeeAuthorized(email: string, companyId: number): Promise<boolean> {
    const [employee] = await db
      .select()
      .from(companyEmployees)
      .where(and(
        eq(companyEmployees.email, email),
        eq(companyEmployees.companyId, companyId),
        eq(companyEmployees.isActive, true)
      ));
    return !!employee;
  }

  // Owner operations
  async getCompanyOwners(companyId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(
        eq(users.companyId, companyId),
        eq(users.role, 'owner')
      ))
      .orderBy(users.firstName, users.lastName);
  }

  async addCompanyOwner(companyId: number, userData: { firstName: string; lastName: string; email: string; department?: string }): Promise<User> {
    // Generate a temporary user ID (in real scenario, this would come from auth system)
    const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const [newOwner] = await db
      .insert(users)
      .values({
        id: tempUserId,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        department: userData.department,
        role: 'owner',
        roleLevel: 99, // Owner level
        companyId: companyId,
      })
      .returning();
    return newOwner;
  }

  async updateCompanyOwner(userId: string, userData: { firstName?: string; lastName?: string; email?: string; department?: string }): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async removeCompanyOwner(userId: string, companyId: number): Promise<void> {
    // Only allow deletion if there's more than one owner
    const owners = await this.getCompanyOwners(companyId);
    if (owners.length <= 1) {
      throw new Error("Cannot delete the last owner. At least one owner must remain.");
    }
    
    await db.delete(users).where(and(
      eq(users.id, userId),
      eq(users.companyId, companyId),
      eq(users.role, 'owner')
    ));
  }

  // Company Role operations
  async getCompanyRoles(companyId: number): Promise<CompanyRole[]> {
    return await db.select().from(companyRoles)
      .where(and(eq(companyRoles.companyId, companyId), eq(companyRoles.isActive, true)))
      .orderBy(companyRoles.level);
  }

  async createCompanyRole(role: InsertCompanyRole): Promise<CompanyRole> {
    const [created] = await db.insert(companyRoles).values(role).returning();
    return created;
  }

  async updateCompanyRole(id: number, role: Partial<InsertCompanyRole>): Promise<CompanyRole> {
    const [updated] = await db
      .update(companyRoles)
      .set(role)
      .where(eq(companyRoles.id, id))
      .returning();
    return updated;
  }

  async deleteCompanyRole(id: number): Promise<void> {
    await db.delete(companyRoles).where(eq(companyRoles.id, id));
  }

  async getUserRoleLevel(userId: string): Promise<number> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    return user?.roleLevel || 1;
  }

  // AI Models operations
  async getAiModels(companyId: number): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(eq(aiModels.companyId, companyId)).orderBy(aiModels.name);
  }

  async getEnabledAiModels(companyId: number): Promise<AiModel[]> {
    return await db.select().from(aiModels).where(and(eq(aiModels.companyId, companyId), eq(aiModels.isEnabled, true))).orderBy(aiModels.name);
  }

  async createAiModel(model: InsertAiModel): Promise<AiModel> {
    const [created] = await db.insert(aiModels).values(model).returning();
    return created;
  }

  async updateAiModel(id: number, model: Partial<InsertAiModel>): Promise<AiModel> {
    const [updated] = await db
      .update(aiModels)
      .set(model)
      .where(eq(aiModels.id, id))
      .returning();
    return updated;
  }

  // Activity Types operations
  async getActivityTypes(companyId: number): Promise<ActivityType[]> {
    return await db.select().from(activityTypes).where(eq(activityTypes.companyId, companyId)).orderBy(activityTypes.name);
  }

  async getEnabledActivityTypes(companyId: number): Promise<ActivityType[]> {
    return await db.select().from(activityTypes).where(and(eq(activityTypes.companyId, companyId), eq(activityTypes.isEnabled, true))).orderBy(activityTypes.name);
  }

  async createActivityType(activityType: InsertActivityType): Promise<ActivityType> {
    const [created] = await db.insert(activityTypes).values(activityType).returning();
    return created;
  }

  async updateActivityType(id: number, activityType: Partial<InsertActivityType>): Promise<ActivityType> {
    const [updated] = await db
      .update(activityTypes)
      .set(activityType)
      .where(eq(activityTypes.id, id))
      .returning();
    return updated;
  }

  // User Activities operations
  async createUserActivity(activity: InsertUserActivity): Promise<UserActivity> {
    const [created] = await db.insert(userActivities).values(activity).returning();
    return created;
  }

  async getUserActivities(companyId: number, userId?: string, limit: number = 50): Promise<UserActivity[]> {
    let whereCondition = eq(userActivities.companyId, companyId);
    
    if (userId) {
      whereCondition = and(whereCondition, eq(userActivities.userId, userId));
    }
    
    return await db.select().from(userActivities)
      .where(whereCondition)
      .orderBy(desc(userActivities.timestamp))
      .limit(limit);
  }

  async getActivityStats(companyId: number): Promise<{
    totalConversations: number;
    securityBlocks: number;
    activeUsers: number;
    policyViolations: number;
  }> {
    const [totalConversations] = await db
      .select({ count: count() })
      .from(userActivities)
      .where(eq(userActivities.companyId, companyId));

    const [securityBlocks] = await db
      .select({ count: count() })
      .from(userActivities)
      .where(and(eq(userActivities.companyId, companyId), eq(userActivities.status, 'blocked')));

    const [activeUsers] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${userActivities.userId})` })
      .from(userActivities)
      .where(and(
        eq(userActivities.companyId, companyId),
        sql`${userActivities.timestamp} >= NOW() - INTERVAL '24 hours'`
      ));

    const [policyViolations] = await db
      .select({ count: count() })
      .from(userActivities)
      .where(and(
        eq(userActivities.companyId, companyId),
        eq(userActivities.status, 'blocked'),
        sql`${userActivities.timestamp} >= NOW() - INTERVAL '7 days'`
      ));

    return {
      totalConversations: totalConversations.count,
      securityBlocks: securityBlocks.count,
      activeUsers: activeUsers.count,
      policyViolations: policyViolations.count,
    };
  }

  // Chat operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [created] = await db.insert(chatSessions).values(session).returning();
    return created;
  }

  async getChatSession(id: number, companyId: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(and(eq(chatSessions.id, id), eq(chatSessions.companyId, companyId)));
    return session;
  }

  async getUserChatSessions(userId: string, companyId: number): Promise<(ChatSession & { messageCount?: number; lastMessage?: string })[]> {
    const sessions = await db.select().from(chatSessions).where(
      and(eq(chatSessions.userId, userId), eq(chatSessions.companyId, companyId))
    ).orderBy(desc(chatSessions.createdAt)).limit(20);
    
    // Get message count and last message for each session
    const sessionsWithDetails = await Promise.all(sessions.map(async (session) => {
      const messages = await db.select().from(chatMessages).where(
        and(eq(chatMessages.sessionId, session.id), eq(chatMessages.companyId, companyId))
      ).orderBy(desc(chatMessages.timestamp));
      
      const messageCount = messages.length;
      const lastMessage = messages.length > 0 ? messages[0].message.substring(0, 50) + (messages[0].message.length > 50 ? '...' : '') : undefined;
      
      return {
        ...session,
        messageCount,
        lastMessage
      };
    }));
    
    return sessionsWithDetails;
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getChatMessages(sessionId: number, companyId: number): Promise<(ChatMessage & { aiModel?: AiModel })[]> {
    const messages = await db
      .select({
        id: chatMessages.id,
        companyId: chatMessages.companyId,
        sessionId: chatMessages.sessionId,
        userId: chatMessages.userId,
        aiModelId: chatMessages.aiModelId,
        activityTypeId: chatMessages.activityTypeId,
        message: chatMessages.message,
        response: chatMessages.response,
        status: chatMessages.status,
        securityFlags: chatMessages.securityFlags,
        timestamp: chatMessages.timestamp,
        aiModel: {
          id: aiModels.id,
          companyId: aiModels.companyId,
          name: aiModels.name,
          provider: aiModels.provider,
          modelId: aiModels.modelId,
          isEnabled: aiModels.isEnabled,
          createdAt: aiModels.createdAt,
        }
      })
      .from(chatMessages)
      .leftJoin(aiModels, eq(chatMessages.aiModelId, aiModels.id))
      .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.companyId, companyId)))
      .orderBy(chatMessages.timestamp);

    return messages.map(msg => ({
      ...msg,
      aiModel: msg.aiModel.id ? msg.aiModel : undefined
    }));
  }

  // Context Document operations
  async getContextDocuments(companyId: number): Promise<ContextDocument[]> {
    return await db.select().from(contextDocuments)
      .where(eq(contextDocuments.companyId, companyId))
      .orderBy(contextDocuments.name);
  }

  async getEnabledContextDocuments(companyId: number): Promise<ContextDocument[]> {
    return await db.select().from(contextDocuments)
      .where(and(eq(contextDocuments.companyId, companyId), eq(contextDocuments.isEnabled, true)))
      .orderBy(contextDocuments.name);
  }

  async createContextDocument(document: InsertContextDocument): Promise<ContextDocument> {
    const [created] = await db.insert(contextDocuments).values(document).returning();
    return created;
  }

  async updateContextDocument(id: number, document: Partial<InsertContextDocument>): Promise<ContextDocument> {
    const [updated] = await db
      .update(contextDocuments)
      .set({
        ...document,
        updatedAt: new Date(),
      })
      .where(eq(contextDocuments.id, id))
      .returning();
    return updated;
  }

  async deleteContextDocument(id: number): Promise<void> {
    // First delete all activity context links
    await db.delete(activityContextLinks).where(eq(activityContextLinks.documentId, id));
    // Then delete the document
    await db.delete(contextDocuments).where(eq(contextDocuments.id, id));
  }

  // Activity Context Link operations
  async getActivityContextLinks(activityTypeId: number): Promise<(ActivityContextLink & { document?: ContextDocument })[]> {
    const links = await db
      .select({
        id: activityContextLinks.id,
        activityTypeId: activityContextLinks.activityTypeId,
        documentId: activityContextLinks.documentId,
        usageType: activityContextLinks.usageType,
        createdAt: activityContextLinks.createdAt,
        document: contextDocuments,
      })
      .from(activityContextLinks)
      .leftJoin(contextDocuments, eq(activityContextLinks.documentId, contextDocuments.id))
      .where(eq(activityContextLinks.activityTypeId, activityTypeId));
    
    return links;
  }

  async createActivityContextLink(link: InsertActivityContextLink): Promise<ActivityContextLink> {
    const [created] = await db.insert(activityContextLinks).values(link).returning();
    return created;
  }

  async deleteActivityContextLink(activityTypeId: number, documentId: number): Promise<void> {
    await db.delete(activityContextLinks).where(
      and(
        eq(activityContextLinks.activityTypeId, activityTypeId),
        eq(activityContextLinks.documentId, documentId)
      )
    );
  }

  async getContextForActivity(activityTypeId: number, companyId: number): Promise<ContextDocument[]> {
    const documents = await db
      .select({
        id: contextDocuments.id,
        companyId: contextDocuments.companyId,
        name: contextDocuments.name,
        description: contextDocuments.description,
        category: contextDocuments.category,
        fileName: contextDocuments.fileName,
        fileSize: contextDocuments.fileSize,
        content: contextDocuments.content,
        priority: contextDocuments.priority,
        isEnabled: contextDocuments.isEnabled,
        createdAt: contextDocuments.createdAt,
        updatedAt: contextDocuments.updatedAt,
      })
      .from(contextDocuments)
      .innerJoin(activityContextLinks, eq(contextDocuments.id, activityContextLinks.documentId))
      .where(and(
        eq(activityContextLinks.activityTypeId, activityTypeId),
        eq(contextDocuments.companyId, companyId),
        eq(contextDocuments.isEnabled, true)
      ))
      .orderBy(contextDocuments.priority, contextDocuments.name);
    
    return documents;
  }
}

export const storage = new DatabaseStorage();
