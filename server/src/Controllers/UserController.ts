import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import { hashPassword } from "../Utils/hash";
import { DatabaseHelpers } from "../Models/DatabaseHelpers";
import { checkOwnership } from "../Middleware/checkOwnership";
import { IAppController } from "./IAppController";
import { IEmailService } from "../Services/IEmailService";

/**
 * Controller for handling user-related HTTP requests.
 * Manages user administration, status, and configuration (email, password, GitHub, URLs, roles).
 */
export class UserController implements IAppController {
  constructor(private db: Database, private emailService: IEmailService) {}

  /**
   * Initializes API routes for user management.
   * @param app Express application instance
   */
  init(app: Application): void {
    // User administration
    app.get("/getUsers", this.getUsers.bind(this));
    app.get("/user/status", this.getUsersByStatus.bind(this));
    app.post("/user/status", checkOwnership(this.db), this.updateUserStatus.bind(this));
    app.post("/user/status/all", this.updateAllConfirmedUsers.bind(this));

    // User configuration
    app.post("/user/mail", this.changeEmail.bind(this));
    app.post("/user/password/change", this.changePassword.bind(this));
    app.post("/user/githubUsername", this.setUserGitHubUsername.bind(this));
    app.get("/user/githubUsername", this.getUserGitHubUsername.bind(this));
    app.post("/user/project/url", this.setUserProjectURL.bind(this));
    app.get("/user/project/url", this.getUserProjectURL.bind(this));
    app.get("/user/role", this.getUserRole.bind(this));
    app.post("/user/role", this.updateUserRole.bind(this));
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const user = await this.db.all("SELECT * FROM users");
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error during retrieving user status:", error);
      res.status(500).json({ message: "Failed to retrieve user status", error });
    }
  }

  async getUsersByStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.query;

    try {
      const user = await this.db.all("SELECT * FROM users WHERE status = ?", [status]);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error during retrieving user status:", error);
      res.status(500).json({ message: "Failed to retrieve user status", error });
    }
  }

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    const { userEmail, status } = req.body;

    if (!userEmail || !status) {
      res.status(400).json({ message: "Please provide email and status" });
      return;
    }

    if (status == "suspended") {
      await this.sendSuspendedEmail(userEmail);
    } else if (status == "removed") {
      await this.sendRemovedEmail(userEmail);
    }

    try {
      await this.db.run("UPDATE users SET status = ? WHERE email = ?", [status, userEmail]);
      res.status(200).json({ message: "User status updated successfully" });
    } catch (error) {
      console.error("Error during updating user status:", error);
      res.status(500).json({ message: "Failed to update user status", error });
    }
  }

  async updateAllConfirmedUsers(req: Request, res: Response): Promise<void> {
    const { status } = req.body;

    if (!status) {
      res.status(400).json({ message: "Status is required" });
      return;
    }

    try {
      const result = await this.db.run(
        'UPDATE users SET status = ? WHERE status = "confirmed"',
        [status]
      );

      if (result.changes === 0) {
        res.status(404).json({ message: "No confirmed users found to update" });
        return;
      }

      res.status(200).json({ message: `All confirmed users have been updated to ${status}` });
    } catch (error) {
      console.error("Error updating confirmed users:", error);
      res.status(500).json({ message: "Failed to update confirmed users" });
    }
  }

  async changeEmail(req: Request, res: Response): Promise<void> {
    const { newEmail, oldEmail } = req.body;
    if (!newEmail) {
      res.status(400).json({ message: "Please fill in new email!" });
      return;
    } else if (!newEmail.includes("@")) {
      res.status(400).json({ message: "Invalid email address" });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, oldEmail);
      await this.db.run(`UPDATE users SET email = ? WHERE id = ?`, [newEmail, userId]);
      res.status(200).json({ message: "Email updated successfully" });
    } catch (error) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: "Failed to update email", error });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const { userEmail, password } = req.body;

    if (!password) {
      res.status(400).json({ message: "Please fill in new password!" });
      return;
    } else if (password.length < 8) {
      res.status(400).json({ message: "Password must be at least 8 characters long" });
      return;
    }

    const hashedPassword = await hashPassword(password);

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      await this.db.run(`UPDATE users SET password = ? WHERE id = ?`, [hashedPassword, userId]);
      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: "Failed to update password", error });
    }
  }

  async setUserProjectURL(req: Request, res: Response): Promise<void> {
    const { userEmail, URL, projectName } = req.body;

    if (!URL) {
      res.status(400).json({ message: "Please fill in URL!" });
      return;
    } else if (!URL.includes("git")) {
      res.status(400).json({ message: "Invalid URL" });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName);

      await this.db.run(
        `UPDATE user_projects SET url = ? WHERE userId = ? AND projectId = ?`,
        [URL, userId, projectId]
      );
      res.status(200).json({ message: "URL added successfully" });
    } catch (error) {
      console.error("Error adding URL:", error);
      res.status(500).json({ message: "Failed to add URL", error });
    }
  }

  async getUserProjectURL(req: Request, res: Response): Promise<void> {
    const { userEmail, projectName } = req.query;

    if (!userEmail || !projectName) {
      res.status(400).json({ message: "User Email and Project Name are mandatory!" });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail.toString());
      const projectId = await DatabaseHelpers.getProjectIdFromName(this.db, projectName.toString());
      const urlObj = await this.db.get(
        `SELECT url FROM user_projects WHERE userId = ? AND projectId = ?`,
        [userId, projectId]
      );
      const url = urlObj ? urlObj.url : null;
      res.status(200).json({ url });
    } catch (error) {
      console.error("Error fetching URL:", error);
      res.status(500).json({ message: "Failed to fetch URL", error });
    }
  }

  async setUserGitHubUsername(req: Request, res: Response): Promise<void> {
    const { userEmail, newGithubUsername } = req.body;

    if (!userEmail) {
      res.status(400).json({ message: "User email is required!" });
      return;
    }

    if (!newGithubUsername) {
      res.status(400).json({ message: "Please fill in GitHub username!" });
      return;
    }

    try {
      let userId;
      try {
        userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail);
      } catch (error) {
        if (error instanceof Error && error.message.includes("User not found")) {
          res.status(404).json({ message: "User not found" });
          return;
        }
        throw error;
      }

      await this.db.run(`UPDATE users SET githubUsername = ? WHERE id = ?`, [
        newGithubUsername,
        userId,
      ]);
      res.status(200).json({ message: "GitHub username added successfully" });
    } catch (error) {
      console.error("Error adding GitHub username:", error);
      res.status(500).json({ message: "Failed to add GitHub username", error });
    }
  }

  async getUserGitHubUsername(req: Request, res: Response): Promise<void> {
    const { userEmail } = req.query;

    if (!userEmail) {
      res.status(400).json({ message: "User Email is mandatory!" });
      return;
    }

    try {
      const userId = await DatabaseHelpers.getUserIdFromEmail(this.db, userEmail?.toString());
      const githubUsernameObj = await this.db.get(`SELECT githubUsername FROM users WHERE id = ?`, [
        userId,
      ]);
      const githubUsername = githubUsernameObj?.githubUsername || "";
      res.status(200).json({ githubUsername });
    } catch (error) {
      console.error("Error fetching GitHub username:", error);
      res.status(500).json({ message: "Failed to fetch GitHub username", error });
    }
  }

  async getUserRole(req: Request, res: Response): Promise<void> {
    const { userEmail } = req.query;

    try {
      const user = await this.db.get("SELECT userRole FROM users WHERE email = ?", [userEmail]);
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ message: "User not found" });
      }
    } catch (error) {
      console.error("Error during retrieving user role:", error);
      res.status(500).json({ message: "Failed to retrieve user role", error });
    }
  }

  async updateUserRole(req: Request, res: Response): Promise<void> {
    const { email, role } = req.body;

    if (!email || !role) {
      res.status(400).json({ message: "Please provide email and role" });
      return;
    }

    try {
      await this.db.run("UPDATE users SET userRole = ? WHERE email = ?", [role, email]);
      res.status(200).json({ message: "User role updated successfully" });
    } catch (error) {
      console.error("Error during updating user role:", error);
      res.status(500).json({ message: "Failed to update user role", error });
    }
  }

  private async sendSuspendedEmail(email: string): Promise<void> {
    await this.emailService.sendEmail(
      email,
      "Account Suspended",
      "Your account has been suspended. Please contact the administrator for more information."
    );
  }

  private async sendRemovedEmail(email: string): Promise<void> {
    await this.emailService.sendEmail(
      email,
      "Account Removed",
      "Your account has been removed. Please contact the administrator for more information."
    );
  }
}
