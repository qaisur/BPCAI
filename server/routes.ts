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
        isActive: s.isActive,
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

      if (!surgeon.isActive) {
        return res.status(403).json({ message: "Your account has been deactivated. Please contact the administrator." });
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

  app.patch("/api/admin/surgeons/:id/toggle-active", requireAuth, async (req: Request, res: Response) => {
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
        return res.status(403).json({ message: "Cannot deactivate admin account" });
      }

      const updated = await storage.toggleSurgeonActive(targetId, !target.isActive);
      res.json({
        id: updated.id,
        username: updated.username,
        fullName: updated.fullName,
        isAdmin: updated.isAdmin,
        isActive: updated.isActive,
        message: updated.isActive ? "Account activated" : "Account deactivated",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/follow-ups", requireAuth, async (req: Request, res: Response) => {
    try {
      const { date } = req.query;
      if (!date || typeof date !== "string") {
        return res.status(400).json({ message: "Date parameter required (YYYY-MM-DD)" });
      }
      const followUps = await storage.getFollowUpsByDate(date);
      res.json(followUps);
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

          const margin = 40;
          const tableWidth = doc.page.width - margin * 2;
          const rowHeight = 16;
          const headerRowHeight = 20;
          const fontSize = 7;
          const headerFontSize = 7.5;
          const maxVisitsPerPage = 6;

          function drawTable(
            title: string,
            labelColumns: { header: string; width: number }[],
            rows: { labels: string[]; values: (string | number | null | undefined)[][] }[],
            visits: typeof visitsWithData,
            startIdx: number,
            count: number
          ) {
            const labelWidth = labelColumns.reduce((s, c) => s + c.width, 0);
            const dataColWidth = (tableWidth - labelWidth) / count;
            const slicedVisits = visits.slice(startIdx, startIdx + count);

            if (doc.y > doc.page.height - 100) doc.addPage();

            doc.fontSize(11).fillColor(secondaryColor).text(title, margin);
            doc.moveDown(0.3);

            let startY = doc.y;
            let y = startY;

            function drawCellBorders(x: number, cy: number, w: number, h: number) {
              doc.rect(x, cy, w, h).strokeColor("#D1D5DB").lineWidth(0.5).stroke();
            }

            function drawHeaderRow(labels: string[], bgColor: string) {
              if (y > doc.page.height - 40) { doc.addPage(); y = margin; startY = y; }
              doc.rect(margin, y, tableWidth, headerRowHeight).fillColor(bgColor).fill();
              let x = margin;
              for (let c = 0; c < labelColumns.length; c++) {
                drawCellBorders(x, y, labelColumns[c].width, headerRowHeight);
                doc.fontSize(headerFontSize).fillColor("#1A1A2E")
                  .text(labels[c] || "", x + 3, y + 4, { width: labelColumns[c].width - 6, height: headerRowHeight });
                x += labelColumns[c].width;
              }
              for (let v = 0; v < count; v++) {
                drawCellBorders(x, y, dataColWidth, headerRowHeight);
                const val = v < labels.length - labelColumns.length
                  ? String(labels[labelColumns.length + v] ?? "")
                  : "";
                doc.fontSize(headerFontSize).fillColor("#1A1A2E")
                  .text(val, x + 2, y + 4, { width: dataColWidth - 4, height: headerRowHeight, align: "center" });
                x += dataColWidth;
              }
              y += headerRowHeight;
            }

            const dateLabels: string[] = [...labelColumns.map(c => c.header)];
            for (const v of slicedVisits) dateLabels.push(formatPdfDate(v.visitDate));
            doc.rect(margin, y, tableWidth, headerRowHeight).fillColor("#C41E3A").fill();
            let hx = margin;
            for (let c = 0; c < labelColumns.length; c++) {
              drawCellBorders(hx, y, labelColumns[c].width, headerRowHeight);
              doc.fontSize(headerFontSize).fillColor("#FFFFFF")
                .text(dateLabels[c] || "", hx + 3, y + 5, { width: labelColumns[c].width - 6, height: headerRowHeight });
              hx += labelColumns[c].width;
            }
            for (let v = 0; v < count; v++) {
              drawCellBorders(hx, y, dataColWidth, headerRowHeight);
              doc.fontSize(headerFontSize).fillColor("#FFFFFF")
                .text(dateLabels[labelColumns.length + v] || "", hx + 2, y + 5, { width: dataColWidth - 4, height: headerRowHeight, align: "center" });
              hx += dataColWidth;
            }
            y += headerRowHeight;

            for (let r = 0; r < rows.length; r++) {
              if (y > doc.page.height - 40) { doc.addPage(); y = margin; }
              const row = rows[r];
              const bgColor = r % 2 === 0 ? "#FFFFFF" : "#F9FAFB";
              doc.rect(margin, y, tableWidth, rowHeight).fillColor(bgColor).fill();

              let rx = margin;
              for (let c = 0; c < labelColumns.length; c++) {
                drawCellBorders(rx, y, labelColumns[c].width, rowHeight);
                const isBold = c === 0 && (r === 0 || rows[r].labels[0] !== rows[r - 1]?.labels[0]);
                doc.fontSize(fontSize).fillColor("#374151")
                  .font(isBold ? "Helvetica-Bold" : "Helvetica")
                  .text(row.labels[c] || "", rx + 3, y + 4, { width: labelColumns[c].width - 6, height: rowHeight });
              rx += labelColumns[c].width;
              }

              for (let v = 0; v < count; v++) {
                drawCellBorders(rx, y, dataColWidth, rowHeight);
                const val = v < row.values.length ? row.values[v] : null;
                doc.fontSize(fontSize).fillColor("#1A1A2E").font("Helvetica")
                  .text(val != null ? String(val) : "", rx + 2, y + 4, { width: dataColWidth - 4, height: rowHeight, align: "center" });
                rx += dataColWidth;
              }
              y += rowHeight;
            }

            doc.y = y;
            doc.moveDown(0.5);
          }

          for (let chunk = 0; chunk < visitsWithData.length; chunk += maxVisitsPerPage) {
            const count = Math.min(maxVisitsPerPage, visitsWithData.length - chunk);
            const sliced = visitsWithData.slice(chunk, chunk + count);

            const metaRows: { labels: string[]; values: (string | null)[][] }[] = [
              { labels: ["", "Age of Patient"], values: sliced.map(v => [calcAge(patient.dateOfBirth, v.visitDate)]) },
              { labels: ["", "Surgeon"], values: sliced.map(v => [v.surgeonName]) },
              { labels: ["", "Visit Type"], values: sliced.map(v => [v.visitType]) },
              { labels: ["", "Intervention/Note"], values: sliced.map(v => [v.intervention || ""]) },
            ];

            const hscRows: { labels: string[]; values: (string | number | null)[][] }[] = [
              ...metaRows,
              { labels: ["Shoulder", "Abduction"], values: sliced.map(v => [v.hscAmsScore?.shoulderAbduction ?? null]) },
              { labels: ["", "Adduction"], values: sliced.map(v => [v.hscAmsScore?.shoulderAdduction ?? null]) },
              { labels: ["", "F Flexion"], values: sliced.map(v => [v.hscAmsScore?.shoulderFFlexion ?? null]) },
              { labels: ["", "ER"], values: sliced.map(v => [v.hscAmsScore?.shoulderER ?? null]) },
              { labels: ["", "IR"], values: sliced.map(v => [v.hscAmsScore?.shoulderIR ?? null]) },
              { labels: ["Elbow", "Flexion"], values: sliced.map(v => [v.hscAmsScore?.elbowFlexion ?? null]) },
              { labels: ["", "Extension"], values: sliced.map(v => [v.hscAmsScore?.elbowExtension ?? null]) },
              { labels: ["Forearm", "Supination"], values: sliced.map(v => [v.hscAmsScore?.forearmSupination ?? null]) },
              { labels: ["", "Pronation"], values: sliced.map(v => [v.hscAmsScore?.forearmPronation ?? null]) },
              { labels: ["Wrist", "Flexion"], values: sliced.map(v => [v.hscAmsScore?.wristFlexion ?? null]) },
              { labels: ["", "Extension"], values: sliced.map(v => [v.hscAmsScore?.wristExtension ?? null]) },
              { labels: ["Finger", "Flexion"], values: sliced.map(v => [v.hscAmsScore?.fingerFlexion ?? null]) },
              { labels: ["", "Extension"], values: sliced.map(v => [v.hscAmsScore?.fingerExtension ?? null]) },
              { labels: ["Thumb", "Flexion"], values: sliced.map(v => [v.hscAmsScore?.thumbFlexion ?? null]) },
              { labels: ["", "Extension"], values: sliced.map(v => [v.hscAmsScore?.thumbExtension ?? null]) },
              { labels: ["Total Score", ""], values: sliced.map(v => [v.hscAmsScore?.totalScore ?? null]) },
              { labels: ["Sensation", ""], values: sliced.map(v => [v.hscAmsScore?.sensation ?? null]) },
              { labels: ["Advise", ""], values: sliced.map(v => [v.hscAmsScore?.advise ?? null]) },
              { labels: ["Remarks", ""], values: sliced.map(v => [v.hscAmsScore?.remarks ?? null]) },
            ];

            const hasAnyHsc = sliced.some(v => v.hscAmsScore);
            if (hasAnyHsc) {
              drawTable(
                "HSC AMS Score",
                [{ header: "", width: 60 }, { header: "", width: 80 }],
                hscRows.map(r => ({ labels: r.labels, values: r.values.map(v => v[0]) as any[] })),
                visitsWithData,
                chunk,
                count
              );
            }

            const malletRows: { labels: string[]; values: (string | number | null)[][] }[] = [
              ...metaRows,
              { labels: ["Global Abduction", ""], values: sliced.map(v => [v.malletScore?.globalAbduction ?? null]) },
              { labels: ["Global Ext. Rotation", ""], values: sliced.map(v => [v.malletScore?.globalExternalRotation ?? null]) },
              { labels: ["Hand to Neck", ""], values: sliced.map(v => [v.malletScore?.handToNeck ?? null]) },
              { labels: ["Hand to Spine", ""], values: sliced.map(v => [v.malletScore?.handToSpine ?? null]) },
              { labels: ["Hand to Mouth", ""], values: sliced.map(v => [v.malletScore?.handToMouth ?? null]) },
              { labels: ["Hand to Midline", ""], values: sliced.map(v => [v.malletScore?.handToMidline ?? null]) },
              { labels: ["Aggregate Score", ""], values: sliced.map(v => {
                if (!v.malletScore) return [null];
                const m = v.malletScore;
                const total = (m.globalAbduction || 0) + (m.globalExternalRotation || 0) +
                  (m.handToNeck || 0) + (m.handToSpine || 0) +
                  (m.handToMouth || 0) + (m.handToMidline || 0);
                return [`${total}/30`];
              })},
            ];

            const hasAnyMallet = sliced.some(v => v.malletScore);
            if (hasAnyMallet) {
              drawTable(
                "Mallet Score",
                [{ header: "", width: 140 }],
                malletRows.map(r => ({ labels: [r.labels[0] || r.labels[1] || ""], values: r.values.map(v => v[0]) as any[] })),
                visitsWithData,
                chunk,
                count
              );
            }

            const clinicalRows: { labels: string[]; values: (string | number | null)[][] }[] = [
              ...metaRows,
              { labels: ["Shoulder Subluxation", ""], values: sliced.map(v => [v.clinicalExam?.shoulderSubluxation ?? null]) },
              { labels: ["Passive ER", ""], values: sliced.map(v => [v.clinicalExam?.passiveER ?? null]) },
              { labels: ["Active ER", ""], values: sliced.map(v => [v.clinicalExam?.activeER ?? null]) },
              { labels: ["Putti Sign", ""], values: sliced.map(v => [v.clinicalExam?.puttiSign ?? null]) },
              { labels: ["Elbow FFD", ""], values: sliced.map(v => [v.clinicalExam?.elbowFFD ?? null]) },
              { labels: ["Forearm Supination", ""], values: sliced.map(v => [v.clinicalExam?.forearmSupination ?? null]) },
              { labels: ["Forearm Pronation", ""], values: sliced.map(v => [v.clinicalExam?.forearmPronation ?? null]) },
              { labels: ["Degree of Trumpeting", ""], values: sliced.map(v => [v.clinicalExam?.degreeOfTrumpeting ?? null]) },
              { labels: ["Degree A ABD.", ""], values: sliced.map(v => [v.clinicalExam?.degreeAAbd ?? null]) },
              { labels: ["ABD with PediWRAP", ""], values: sliced.map(v => [v.clinicalExam?.abdWithPediWrap ?? null]) },
              { labels: ["SAS", ""], values: sliced.map(v => [v.clinicalExam?.sas ?? null]) },
              { labels: ["DAC", ""], values: sliced.map(v => [v.clinicalExam?.dac ?? null]) },
              { labels: ["AIRD", ""], values: sliced.map(v => [v.clinicalExam?.aird ?? null]) },
              { labels: ["Wrist DF", ""], values: sliced.map(v => [v.clinicalExam?.wristDF ?? null]) },
              { labels: ["Thumb Abduction", ""], values: sliced.map(v => [v.clinicalExam?.thumbAbduction ?? null]) },
              { labels: ["IR in Abduction", ""], values: sliced.map(v => [v.clinicalExam?.irInAbduction ?? null]) },
              { labels: ["Triceps Strength", ""], values: sliced.map(v => [v.clinicalExam?.tricepsStrength ?? null]) },
              { labels: ["Grip", ""], values: sliced.map(v => [v.clinicalExam?.grip ?? null]) },
              { labels: ["Release", ""], values: sliced.map(v => [v.clinicalExam?.release ?? null]) },
            ];

            const hasAnyClinical = sliced.some(v => v.clinicalExam);
            if (hasAnyClinical) {
              drawTable(
                "Clinical Examination",
                [{ header: "", width: 140 }],
                clinicalRows.map(r => ({ labels: [r.labels[0] || r.labels[1] || ""], values: r.values.map(v => v[0]) as any[] })),
                visitsWithData,
                chunk,
                count
              );
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
