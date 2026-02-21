import { Request, Response, NextFunction } from "express";
import { Database } from "sqlite";
import jwt from "jsonwebtoken";
import { ObjectHandler } from "../ObjectHandler";
import { UserRoleEnum } from "../Utils/UserRole";

const secret = process.env.JWT_SECRET || "your_jwt_secret";

/**
 * Middleware to check if user is an admin.
 * Verifies that authenticated user has admin privileges.
 *
 * @param db Database instance
 * @returns Express middleware function
 */
export function checkAdmin(db: Database) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    try {
      const decoded = jwt.verify(token, secret) as { id: string; email: string };
      const oh = new ObjectHandler();
      const user = await oh.getUser(Number(decoded.id), db);

      if (!user) {
        res.status(404).json({ success: false, message: "User not found" });
        return;
      }

      // Check if user is admin
      if (user.getRoleEnum() !== UserRoleEnum.ADMIN) {
        res.status(403).json({ success: false, message: "Forbidden: Admin access required" });
        return;
      }
    } catch {
      res.status(401).json({ success: false, message: "Invalid token" });
      return;
    }

    next();
  };
}
