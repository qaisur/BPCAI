import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  date,
  jsonb,
  serial,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const surgeons = pgTable("surgeons", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surgeonsRelations = relations(surgeons, ({ many }) => ({
  visits: many(visits),
}));

export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  patientId: text("patient_id").notNull().unique(),
  childName: text("child_name").notNull(),
  dateOfBirth: date("date_of_birth").notNull(),
  gender: text("gender").notNull(),
  fatherName: text("father_name"),
  motherName: text("mother_name"),
  contactNumber: text("contact_number"),
  address: text("address"),

  gestationalAge: text("gestational_age"),
  numberOfDelivery: text("number_of_delivery"),
  presentationOfChild: text("presentation_of_child"),
  gestationalDiabetes: text("gestational_diabetes"),
  typeOfDelivery: text("type_of_delivery"),
  modeOfDelivery: text("mode_of_delivery"),
  birthWeight: text("birth_weight"),
  birthWeightOfSiblings: text("birth_weight_of_siblings"),
  shoulderDystocia: text("shoulder_dystocia"),
  difficultDelivery: text("difficult_delivery"),

  siblingAffection: text("sibling_affection"),
  associatedFeaturesAtBirth: text("associated_features_at_birth"),
  involvement: text("involvement"),
  associatedFeatures: text("associated_features"),
  associatedFeaturesNote: text("associated_features_note"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  createdBy: integer("created_by").references(() => surgeons.id),
});

export const patientsRelations = relations(patients, ({ many, one }) => ({
  visits: many(visits),
  createdBySurgeon: one(surgeons, {
    fields: [patients.createdBy],
    references: [surgeons.id],
  }),
}));

export const visits = pgTable("visits", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),
  surgeonId: integer("surgeon_id")
    .notNull()
    .references(() => surgeons.id),
  visitDate: date("visit_date").notNull(),
  visitType: text("visit_type").notNull(),
  intervention: text("intervention"),
  nextFollowUpDate: date("next_follow_up_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const visitsRelations = relations(visits, ({ one, many }) => ({
  patient: one(patients, {
    fields: [visits.patientId],
    references: [patients.id],
  }),
  surgeon: one(surgeons, {
    fields: [visits.surgeonId],
    references: [surgeons.id],
  }),
  hscAmsScores: many(hscAmsScores),
  malletScores: many(malletScores),
  clinicalExams: many(clinicalExams),
}));

export const hscAmsScores = pgTable("hsc_ams_scores", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id")
    .notNull()
    .references(() => visits.id),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),

  shoulderAbduction: integer("shoulder_abduction"),
  shoulderAdduction: integer("shoulder_adduction"),
  shoulderFFlexion: integer("shoulder_f_flexion"),
  shoulderER: integer("shoulder_er"),
  shoulderIR: integer("shoulder_ir"),

  elbowFlexion: integer("elbow_flexion"),
  elbowExtension: integer("elbow_extension"),

  forearmSupination: integer("forearm_supination"),
  forearmPronation: integer("forearm_pronation"),

  wristFlexion: integer("wrist_flexion"),
  wristExtension: integer("wrist_extension"),

  fingerFlexion: integer("finger_flexion"),
  fingerExtension: integer("finger_extension"),

  thumbFlexion: integer("thumb_flexion"),
  thumbExtension: integer("thumb_extension"),

  totalScore: integer("total_score"),
  sensation: text("sensation"),
  advise: text("advise"),
  remarks: text("remarks"),
});

export const hscAmsScoresRelations = relations(hscAmsScores, ({ one }) => ({
  visit: one(visits, {
    fields: [hscAmsScores.visitId],
    references: [visits.id],
  }),
  patient: one(patients, {
    fields: [hscAmsScores.patientId],
    references: [patients.id],
  }),
}));

export const malletScores = pgTable("mallet_scores", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id")
    .notNull()
    .references(() => visits.id),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),

  globalAbduction: integer("global_abduction"),
  globalExternalRotation: integer("global_external_rotation"),
  handToNeck: integer("hand_to_neck"),
  handToSpine: integer("hand_to_spine"),
  handToMouth: integer("hand_to_mouth"),
  handToMidline: integer("hand_to_midline"),
  aggregateScore: integer("aggregate_score"),

  ga: text("ga"),
  ger: text("ger"),
  htn: text("htn"),
  hts: text("hts"),
  htm: text("htm"),
  ir: text("ir"),
  ams: text("ams"),
});

export const malletScoresRelations = relations(malletScores, ({ one }) => ({
  visit: one(visits, {
    fields: [malletScores.visitId],
    references: [visits.id],
  }),
  patient: one(patients, {
    fields: [malletScores.patientId],
    references: [patients.id],
  }),
}));

export const clinicalExams = pgTable("clinical_exams", {
  id: serial("id").primaryKey(),
  visitId: integer("visit_id")
    .notNull()
    .references(() => visits.id),
  patientId: integer("patient_id")
    .notNull()
    .references(() => patients.id),

  shoulderSubluxation: text("shoulder_subluxation"),
  passiveER: text("passive_er"),
  activeER: text("active_er"),
  puttiSign: text("putti_sign"),
  elbowFFD: text("elbow_ffd"),
  forearmSupination: text("forearm_supination"),
  forearmPronation: text("forearm_pronation"),
  degreeOfTrumpeting: text("degree_of_trumpeting"),
  degreeAAbd: text("degree_a_abd"),
  abdWithPediWrap: text("abd_with_pedi_wrap"),
  sas: text("sas"),
  dac: text("dac"),
  aird: text("aird"),
  wristDF: text("wrist_df"),
  thumbAbduction: text("thumb_abduction"),
  irInAbduction: text("ir_in_abduction"),
  tricepsStrength: text("triceps_strength"),
  grip: text("grip"),
  release: text("release"),
});

export const clinicalExamsRelations = relations(clinicalExams, ({ one }) => ({
  visit: one(visits, {
    fields: [clinicalExams.visitId],
    references: [visits.id],
  }),
  patient: one(patients, {
    fields: [clinicalExams.patientId],
    references: [patients.id],
  }),
}));

export const insertSurgeonSchema = createInsertSchema(surgeons).pick({
  username: true,
  password: true,
  fullName: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
});

export const insertVisitSchema = createInsertSchema(visits).omit({
  id: true,
  createdAt: true,
});

export const insertHscAmsScoreSchema = createInsertSchema(hscAmsScores).omit({
  id: true,
});

export const insertMalletScoreSchema = createInsertSchema(malletScores).omit({
  id: true,
});

export const insertClinicalExamSchema = createInsertSchema(clinicalExams).omit({
  id: true,
});

export type Surgeon = typeof surgeons.$inferSelect;
export type InsertSurgeon = z.infer<typeof insertSurgeonSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type HscAmsScore = typeof hscAmsScores.$inferSelect;
export type InsertHscAmsScore = z.infer<typeof insertHscAmsScoreSchema>;
export type MalletScore = typeof malletScores.$inferSelect;
export type InsertMalletScore = z.infer<typeof insertMalletScoreSchema>;
export type ClinicalExam = typeof clinicalExams.$inferSelect;
export type InsertClinicalExam = z.infer<typeof insertClinicalExamSchema>;
