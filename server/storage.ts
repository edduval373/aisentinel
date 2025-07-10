import {
  users,
  companies,
  companyEmployees,
  aiModels,
  activityTypes,
  userActivities,
  chatSessions,
  chatMessages,
  type User,
  type UpsertUser,
  type Company,
  type InsertCompany,
  type CompanyEmployee,
  type InsertCompanyEmployee,
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
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(sessionId: number, companyId: number): Promise<ChatMessage[]>;
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

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  async getChatMessages(sessionId: number, companyId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(and(eq(chatMessages.sessionId, sessionId), eq(chatMessages.companyId, companyId)))
      .orderBy(chatMessages.timestamp);
  }
}

export const storage = new DatabaseStorage();
