import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { storage, comparePasswords } from "./storage";
import { User, LoginUser, loginUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "insurance-agent-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      {
        usernameField: "email",
        passwordField: "password",
        passReqToCallback: true,
      },
      async (req, email, password, done) => {
        try {
          const result = loginUserSchema.safeParse({
            email,
            password,
            workId: req.body.workId,
          });
          
          if (!result.success) {
            return done(null, false, { message: "Invalid credentials format" });
          }
          
          const user = await storage.getUserByEmail(email);
          
          if (!user || user.workId !== req.body.workId) {
            return done(null, false, { message: "User not found or incorrect work ID" });
          }
          
          if (!user.isActive) {
            return done(null, false, { message: "User account has been deactivated" });
          }
          
          const isPasswordValid = await comparePasswords(password, user.password);
          
          if (!isPasswordValid) {
            return done(null, false, { message: "Incorrect password" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error, user: User, info: { message: string }) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.status(200).json({
          id: user.id,
          workId: user.workId,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          isActive: user.isActive,
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = req.user as User;
    
    res.status(200).json({
      id: user.id,
      workId: user.workId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
    });
  });
}
