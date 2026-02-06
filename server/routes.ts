import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import PDFDocument from "pdfkit";
import { storage } from "./storage";
import { pool } from "./db";
import {
  insertSurgeonSchema,
  insertPatientSchema,
  insertVisitSchema,
  insertHscAmsScoreSchema,
  insertMalletScoreSchema,
  insertClinicalExamSchema,
} from "@shared/schema";

declare module "express-session" {
  interface SessionData {
    surgeonId: number;
  }
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session.surgeonId) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  const PgStore = connectPgSimple(session);

  app.use(
    session({
      store: new PgStore({
        pool: pool,
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "bpc-session-secret-dev",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: "none",
      },
    })
  );

  app.post("/api/admin/create-surgeon", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getSurgeon(req.session.surgeonId!);
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { username, password, fullName } = req.body;
      if (!username || !password || !fullName) {
        return res
          .status(400)
          .json({ message: "Username, password, and full name are required" });
      }

      const existing = await storage.getSurgeonByUsername(username);
      if (existing) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const surgeon = await storage.createSurgeon({
        username,
        password: hashedPassword,
        fullName,
      });

      res.json({
        id: surgeon.id,
        username: surgeon.username,
        fullName: surgeon.fullName,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/admin/surgeons", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getSurgeon(req.session.surgeonId!);
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }
      const allSurgeons = await storage.getAllSurgeons();
      res.json(allSurgeons.map(s => ({
        id: s.id,
        username: s.username,
        fullName: s.fullName,
        isAdmin: s.isAdmin,
        createdAt: s.createdAt,
      })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      const surgeon = await storage.getSurgeonByUsername(username);
      if (!surgeon) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, surgeon.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.surgeonId = surgeon.id;
      res.json({
        id: surgeon.id,
        username: surgeon.username,
        fullName: surgeon.fullName,
        isAdmin: surgeon.isAdmin,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    if (!req.session.surgeonId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const surgeon = await storage.getSurgeon(req.session.surgeonId);
    if (!surgeon) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({
      id: surgeon.id,
      username: surgeon.username,
      fullName: surgeon.fullName,
      isAdmin: surgeon.isAdmin,
    });
  });

  app.get("/api/patients/next-id", requireAuth, async (req: Request, res: Response) => {
    try {
      const nextId = await storage.getNextPatientId();
      res.json({ patientId: nextId });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get(
    "/api/patients",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { search } = req.query;
        let patientsList;
        if (search && typeof search === "string" && search.trim()) {
          patientsList = await storage.searchPatients(search.trim());
        } else {
          patientsList = await storage.getAllPatients();
        }
        res.json(patientsList);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/patients/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const patient = await storage.getPatient(id);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }
        res.json(patient);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/patients",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientData = {
          ...req.body,
          createdBy: req.session.surgeonId,
        };
        const patient = await storage.createPatient(patientData);
        res.json(patient);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.put(
    "/api/patients/:id",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(req.params.id);
        const patient = await storage.updatePatient(id, req.body);
        res.json(patient);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/patients/:patientId/visits",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = parseInt(req.params.patientId);
        const visitsList = await storage.getVisitsByPatient(patientId);
        const visitsWithSurgeon = await Promise.all(
          visitsList.map(async (visit) => {
            const surgeon = await storage.getSurgeon(visit.surgeonId);
            return {
              ...visit,
              surgeonName: surgeon?.fullName || "Unknown",
            };
          })
        );
        res.json(visitsWithSurgeon);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/patients/:patientId/visits",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = parseInt(req.params.patientId);
        const visitData = {
          ...req.body,
          patientId,
          surgeonId: req.session.surgeonId!,
        };
        const visit = await storage.createVisit(visitData);
        res.json(visit);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/visits/:visitId/hsc-ams",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const visitId = parseInt(req.params.visitId);
        const score = await storage.createHscAmsScore({
          ...req.body,
          visitId,
        });
        res.json(score);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/patients/:patientId/hsc-ams",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = parseInt(req.params.patientId);
        const scores = await storage.getHscAmsScoresByPatient(patientId);
        res.json(scores);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/visits/:visitId/mallet",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const visitId = parseInt(req.params.visitId);
        const score = await storage.createMalletScore({
          ...req.body,
          visitId,
        });
        res.json(score);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/patients/:patientId/mallet",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = parseInt(req.params.patientId);
        const scores = await storage.getMalletScoresByPatient(patientId);
        res.json(scores);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.post(
    "/api/visits/:visitId/clinical-exam",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const visitId = parseInt(req.params.visitId);
        const exam = await storage.createClinicalExam({
          ...req.body,
          visitId,
        });
        res.json(exam);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/patients/:patientId/clinical-exams",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = parseInt(req.params.patientId);
        const exams = await storage.getClinicalExamsByPatient(patientId);
        res.json(exams);
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.get(
    "/api/patients/:patientId/full-record",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = parseInt(req.params.patientId);
        const patient = await storage.getPatient(patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }

        const visitsList = await storage.getVisitsByPatient(patientId);
        const visitsWithData = await Promise.all(
          visitsList.map(async (visit) => {
            const surgeon = await storage.getSurgeon(visit.surgeonId);
            const hscAms = await storage.getHscAmsScoreByVisit(visit.id);
            const mallet = await storage.getMalletScoreByVisit(visit.id);
            const clinicalExam = await storage.getClinicalExamByVisit(visit.id);
            return {
              ...visit,
              surgeonName: surgeon?.fullName || "Unknown",
              hscAmsScore: hscAms || null,
              malletScore: mallet || null,
              clinicalExam: clinicalExam || null,
            };
          })
        );

        res.json({
          patient,
          visits: visitsWithData,
        });
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  app.delete("/api/admin/surgeons/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const admin = await storage.getSurgeon(req.session.surgeonId!);
      if (!admin || !admin.isAdmin) {
        return res.status(403).json({ message: "Admin access required" });
      }

      const targetId = parseInt(req.params.id);
      const target = await storage.getSurgeon(targetId);
      if (!target) {
        return res.status(404).json({ message: "Surgeon not found" });
      }
      if (target.isAdmin) {
        return res.status(403).json({ message: "Cannot delete admin account" });
      }

      await storage.deleteSurgeon(targetId);
      res.json({ message: "Surgeon account removed" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get(
    "/api/patients/:patientId/pdf",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const patientId = parseInt(req.params.patientId);
        const patient = await storage.getPatient(patientId);
        if (!patient) {
          return res.status(404).json({ message: "Patient not found" });
        }

        const visitsList = await storage.getVisitsByPatient(patientId);
        const visitsWithData = await Promise.all(
          visitsList.map(async (visit) => {
            const surgeon = await storage.getSurgeon(visit.surgeonId);
            const hscAms = await storage.getHscAmsScoreByVisit(visit.id);
            const mallet = await storage.getMalletScoreByVisit(visit.id);
            const clinicalExam = await storage.getClinicalExamByVisit(visit.id);
            return {
              ...visit,
              surgeonName: surgeon?.fullName || "Unknown",
              hscAmsScore: hscAms || null,
              malletScore: mallet || null,
              clinicalExam: clinicalExam || null,
            };
          })
        );

        const doc = new PDFDocument({ size: "A4", margin: 40 });
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${patient.patientId}-record.pdf"`
        );
        doc.pipe(res);

        const primaryColor = "#C41E3A";
        const secondaryColor = "#1B3A6B";
        const pageWidth = doc.page.width - 80;

        doc.fontSize(20).fillColor(primaryColor).text("Brachial Plexus Clinic", { align: "center" });
        doc.fontSize(10).fillColor(secondaryColor).text("Hope in Every Touch", { align: "center" });
        doc.moveDown(0.5);
        doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor("#E5E7EB").stroke();
        doc.moveDown(0.5);

        doc.fontSize(14).fillColor(secondaryColor).text("Patient Information");
        doc.moveDown(0.3);

        function addField(label: string, value: string | null | undefined) {
          if (!value) return;
          doc.fontSize(9).fillColor("#6B7280").text(label + ": ", { continued: true });
          doc.fillColor("#1A1A2E").text(String(value));
        }

        function formatPdfDate(d: string) {
          const date = new Date(d);
          return `${String(date.getDate()).padStart(2, "0")}-${String(date.getMonth() + 1).padStart(2, "0")}-${date.getFullYear()}`;
        }

        function calcAge(dob: string, atDate?: string) {
          const birth = new Date(dob);
          const ref = atDate ? new Date(atDate) : new Date();
          let y = ref.getFullYear() - birth.getFullYear();
          let m = ref.getMonth() - birth.getMonth();
          let d = ref.getDate() - birth.getDate();
          if (d < 0) { m--; d += 30; }
          if (m < 0) { y--; m += 12; }
          return `${y}Y ${m}M ${d}D`;
        }

        addField("Patient ID", patient.patientId);
        addField("Name", patient.childName);
        addField("Date of Birth", formatPdfDate(patient.dateOfBirth));
        addField("Gender", patient.gender);
        addField("Father", patient.fatherName);
        addField("Mother", patient.motherName);
        addField("Contact", patient.contactNumber);
        addField("Address", patient.address);
        doc.moveDown(0.3);

        doc.fontSize(11).fillColor(secondaryColor).text("Birth History");
        doc.moveDown(0.2);
        addField("Gestational Age", patient.gestationalAge ? `${patient.gestationalAge} weeks` : null);
        addField("No. of Delivery", patient.numberOfDelivery);
        addField("Presentation", patient.presentationOfChild);
        addField("Gestational Diabetes", patient.gestationalDiabetes);
        addField("Type of Delivery", patient.typeOfDelivery);
        addField("Mode of Delivery", patient.modeOfDelivery);
        addField("Birth Weight", patient.birthWeight ? `${patient.birthWeight} kg` : null);
        addField("Sibling Birth Weight", patient.birthWeightOfSiblings);
        addField("Shoulder Dystocia", patient.shoulderDystocia);
        addField("Difficult Delivery", patient.difficultDelivery);
        doc.moveDown(0.3);

        doc.fontSize(11).fillColor(secondaryColor).text("Family History & Associated Features");
        doc.moveDown(0.2);
        addField("Sibling Affection", patient.siblingAffection);
        addField("Associated Features at Birth", patient.associatedFeaturesAtBirth);
        addField("Involvement", patient.involvement);
        addField("Associated Features", patient.associatedFeatures);
        addField("Associated Features Note", patient.associatedFeaturesNote);

        if (visitsWithData.length > 0) {
          doc.moveDown(0.5);
          doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor("#E5E7EB").stroke();
          doc.moveDown(0.5);

          for (let i = 0; i < visitsWithData.length; i++) {
            const visit = visitsWithData[i];

            if (doc.y > doc.page.height - 200) {
              doc.addPage();
            }

            doc.fontSize(13).fillColor(primaryColor).text(
              `Visit ${i + 1}: ${formatPdfDate(visit.visitDate)}`,
            );
            doc.moveDown(0.2);
            addField("Visit Type", visit.visitType);
            addField("Age at Visit", calcAge(patient.dateOfBirth, visit.visitDate));
            addField("Surgeon", visit.surgeonName);
            addField("Intervention/Note", visit.intervention);
            doc.moveDown(0.3);

            if (visit.hscAmsScore) {
              const s = visit.hscAmsScore;
              doc.fontSize(11).fillColor(secondaryColor).text("HSC AMS Score");
              doc.moveDown(0.2);

              const hscRows = [
                ["Shoulder Abd.", s.shoulderAbduction, "Shoulder Add.", s.shoulderAdduction],
                ["Shoulder F.Flex.", s.shoulderFFlexion, "Shoulder ER", s.shoulderER],
                ["Shoulder IR", s.shoulderIR, "Elbow Flex.", s.elbowFlexion],
                ["Elbow Ext.", s.elbowExtension, "Forearm Sup.", s.forearmSupination],
                ["Forearm Pro.", s.forearmPronation, "Wrist Flex.", s.wristFlexion],
                ["Wrist Ext.", s.wristExtension, "Finger Flex.", s.fingerFlexion],
                ["Finger Ext.", s.fingerExtension, "Thumb Flex.", s.thumbFlexion],
                ["Thumb Ext.", s.thumbExtension, "Total Score", s.totalScore],
              ];

              for (const row of hscRows) {
                doc.fontSize(8).fillColor("#6B7280")
                  .text(`${row[0]}: `, 50, doc.y, { continued: true, width: 120 })
                  .fillColor("#1A1A2E").text(`${row[1] ?? "-"}`, { continued: true })
                  .fillColor("#6B7280").text(`     ${row[2]}: `, { continued: true })
                  .fillColor("#1A1A2E").text(`${row[3] ?? "-"}`);
              }

              addField("Sensation", s.sensation);
              addField("Advise", s.advise);
              addField("Remarks", s.remarks);
              doc.moveDown(0.3);
            }

            if (visit.malletScore) {
              const m = visit.malletScore;
              if (doc.y > doc.page.height - 150) doc.addPage();
              doc.fontSize(11).fillColor(secondaryColor).text("Mallet Score");
              doc.moveDown(0.2);

              const total =
                (m.globalAbduction || 0) + (m.globalExternalRotation || 0) +
                (m.handToNeck || 0) + (m.handToSpine || 0) +
                (m.handToMouth || 0) + (m.handToMidline || 0);

              addField("Global Abduction", m.globalAbduction != null ? String(m.globalAbduction) : null);
              addField("Global Ext. Rotation", m.globalExternalRotation != null ? String(m.globalExternalRotation) : null);
              addField("Hand to Neck", m.handToNeck != null ? String(m.handToNeck) : null);
              addField("Hand to Spine", m.handToSpine != null ? String(m.handToSpine) : null);
              addField("Hand to Mouth", m.handToMouth != null ? String(m.handToMouth) : null);
              addField("Hand to Midline", m.handToMidline != null ? String(m.handToMidline) : null);
              doc.fontSize(9).fillColor(primaryColor).text(`Aggregate Score: ${total}/30`);
              doc.moveDown(0.3);
            }

            if (visit.clinicalExam) {
              const e = visit.clinicalExam;
              if (doc.y > doc.page.height - 200) doc.addPage();
              doc.fontSize(11).fillColor(secondaryColor).text("Clinical Examination");
              doc.moveDown(0.2);

              addField("Shoulder Subluxation", e.shoulderSubluxation);
              addField("Passive ER", e.passiveER);
              addField("Active ER", e.activeER);
              addField("Putti Sign", e.puttiSign);
              addField("Elbow FFD", e.elbowFFD);
              addField("Forearm Supination", e.forearmSupination);
              addField("Forearm Pronation", e.forearmPronation);
              addField("Degree of Trumpeting", e.degreeOfTrumpeting);
              addField("Degree A ABD.", e.degreeAAbd);
              addField("ABD with PediWRAP", e.abdWithPediWrap);
              addField("SAS", e.sas);
              addField("DAC", e.dac);
              addField("AIRD", e.aird);
              addField("Wrist DF", e.wristDF);
              addField("Thumb Abduction", e.thumbAbduction);
              addField("IR in Abduction", e.irInAbduction);
              addField("Triceps Strength", e.tricepsStrength);
              addField("Grip", e.grip);
              addField("Release", e.release);
              doc.moveDown(0.3);
            }

            if (i < visitsWithData.length - 1) {
              doc.moveTo(40, doc.y).lineTo(doc.page.width - 40, doc.y).strokeColor("#E5E7EB").stroke();
              doc.moveDown(0.5);
            }
          }
        }

        doc.moveDown(1);
        doc.fontSize(7).fillColor("#9CA3AF").text(
          `Generated on ${new Date().toLocaleDateString()} | BPC Records`,
          { align: "center" }
        );

        doc.end();
      } catch (error: any) {
        res.status(500).json({ message: error.message });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
