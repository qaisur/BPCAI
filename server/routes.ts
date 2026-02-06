import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
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

  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
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

      req.session.surgeonId = surgeon.id;
      res.json({
        id: surgeon.id,
        username: surgeon.username,
        fullName: surgeon.fullName,
      });
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
    });
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

  const httpServer = createServer(app);
  return httpServer;
}
