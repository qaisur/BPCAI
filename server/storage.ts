import {
  surgeons,
  patients,
  visits,
  hscAmsScores,
  malletScores,
  clinicalExams,
  type Surgeon,
  type InsertSurgeon,
  type Patient,
  type InsertPatient,
  type Visit,
  type InsertVisit,
  type HscAmsScore,
  type InsertHscAmsScore,
  type MalletScore,
  type InsertMalletScore,
  type ClinicalExam,
  type InsertClinicalExam,
} from "@shared/schema";
import { db } from "./db";
import { eq, or, ilike, desc, asc, sql } from "drizzle-orm";

export interface IStorage {
  getSurgeon(id: number): Promise<Surgeon | undefined>;
  getSurgeonByUsername(username: string): Promise<Surgeon | undefined>;
  createSurgeon(surgeon: InsertSurgeon): Promise<Surgeon>;
  getAllSurgeons(): Promise<Surgeon[]>;
  deleteSurgeon(id: number): Promise<void>;

  getNextPatientId(): Promise<string>;
  getPatient(id: number): Promise<Patient | undefined>;
  getPatientByPatientId(patientId: string): Promise<Patient | undefined>;
  searchPatients(query: string): Promise<Patient[]>;
  getAllPatients(): Promise<Patient[]>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: number, patient: Partial<InsertPatient>): Promise<Patient>;

  getVisit(id: number): Promise<Visit | undefined>;
  getVisitsByPatient(patientId: number): Promise<Visit[]>;
  createVisit(visit: InsertVisit): Promise<Visit>;

  getHscAmsScoresByPatient(patientId: number): Promise<HscAmsScore[]>;
  getHscAmsScoreByVisit(visitId: number): Promise<HscAmsScore | undefined>;
  createHscAmsScore(score: InsertHscAmsScore): Promise<HscAmsScore>;

  getMalletScoresByPatient(patientId: number): Promise<MalletScore[]>;
  getMalletScoreByVisit(visitId: number): Promise<MalletScore | undefined>;
  createMalletScore(score: InsertMalletScore): Promise<MalletScore>;

  getClinicalExamsByPatient(patientId: number): Promise<ClinicalExam[]>;
  getClinicalExamByVisit(visitId: number): Promise<ClinicalExam | undefined>;
  createClinicalExam(exam: InsertClinicalExam): Promise<ClinicalExam>;
}

export class DatabaseStorage implements IStorage {
  async getSurgeon(id: number): Promise<Surgeon | undefined> {
    const [surgeon] = await db
      .select()
      .from(surgeons)
      .where(eq(surgeons.id, id));
    return surgeon || undefined;
  }

  async getSurgeonByUsername(username: string): Promise<Surgeon | undefined> {
    const [surgeon] = await db
      .select()
      .from(surgeons)
      .where(eq(surgeons.username, username));
    return surgeon || undefined;
  }

  async createSurgeon(insertSurgeon: InsertSurgeon): Promise<Surgeon> {
    const [surgeon] = await db
      .insert(surgeons)
      .values(insertSurgeon)
      .returning();
    return surgeon;
  }

  async getAllSurgeons(): Promise<Surgeon[]> {
    return db.select().from(surgeons);
  }

  async deleteSurgeon(id: number): Promise<void> {
    await db.delete(surgeons).where(eq(surgeons.id, id));
  }

  async getNextPatientId(): Promise<string> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(patients);
    const count = Number(result[0]?.count || 0);
    const nextNum = count + 1;
    return `BPC-${String(nextNum).padStart(6, "0")}`;
  }

  async getPatient(id: number): Promise<Patient | undefined> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.id, id));
    return patient || undefined;
  }

  async getPatientByPatientId(patientId: string): Promise<Patient | undefined> {
    const [patient] = await db
      .select()
      .from(patients)
      .where(eq(patients.patientId, patientId));
    return patient || undefined;
  }

  async searchPatients(query: string): Promise<Patient[]> {
    return db
      .select()
      .from(patients)
      .where(
        or(
          ilike(patients.childName, `%${query}%`),
          ilike(patients.patientId, `%${query}%`)
        )
      )
      .orderBy(desc(patients.createdAt));
  }

  async getAllPatients(): Promise<Patient[]> {
    return db.select().from(patients).orderBy(desc(patients.createdAt));
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const [created] = await db.insert(patients).values(patient).returning();
    return created;
  }

  async updatePatient(
    id: number,
    patient: Partial<InsertPatient>
  ): Promise<Patient> {
    const [updated] = await db
      .update(patients)
      .set(patient)
      .where(eq(patients.id, id))
      .returning();
    return updated;
  }

  async getVisit(id: number): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit || undefined;
  }

  async getVisitsByPatient(patientId: number): Promise<Visit[]> {
    return db
      .select()
      .from(visits)
      .where(eq(visits.patientId, patientId))
      .orderBy(asc(visits.visitDate));
  }

  async createVisit(visit: InsertVisit): Promise<Visit> {
    const [created] = await db.insert(visits).values(visit).returning();
    return created;
  }

  async getHscAmsScoresByPatient(patientId: number): Promise<HscAmsScore[]> {
    return db
      .select()
      .from(hscAmsScores)
      .where(eq(hscAmsScores.patientId, patientId));
  }

  async getHscAmsScoreByVisit(
    visitId: number
  ): Promise<HscAmsScore | undefined> {
    const [score] = await db
      .select()
      .from(hscAmsScores)
      .where(eq(hscAmsScores.visitId, visitId));
    return score || undefined;
  }

  async createHscAmsScore(score: InsertHscAmsScore): Promise<HscAmsScore> {
    const [created] = await db
      .insert(hscAmsScores)
      .values(score)
      .returning();
    return created;
  }

  async getMalletScoresByPatient(patientId: number): Promise<MalletScore[]> {
    return db
      .select()
      .from(malletScores)
      .where(eq(malletScores.patientId, patientId));
  }

  async getMalletScoreByVisit(
    visitId: number
  ): Promise<MalletScore | undefined> {
    const [score] = await db
      .select()
      .from(malletScores)
      .where(eq(malletScores.visitId, visitId));
    return score || undefined;
  }

  async createMalletScore(score: InsertMalletScore): Promise<MalletScore> {
    const [created] = await db
      .insert(malletScores)
      .values(score)
      .returning();
    return created;
  }

  async getClinicalExamsByPatient(patientId: number): Promise<ClinicalExam[]> {
    return db
      .select()
      .from(clinicalExams)
      .where(eq(clinicalExams.patientId, patientId));
  }

  async getClinicalExamByVisit(
    visitId: number
  ): Promise<ClinicalExam | undefined> {
    const [exam] = await db
      .select()
      .from(clinicalExams)
      .where(eq(clinicalExams.visitId, visitId));
    return exam || undefined;
  }

  async createClinicalExam(exam: InsertClinicalExam): Promise<ClinicalExam> {
    const [created] = await db
      .insert(clinicalExams)
      .values(exam)
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
