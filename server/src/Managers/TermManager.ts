import { Database } from "sqlite";
import { ObjectHandler } from "../ObjectHandler";
import { DatabaseSerializableFactory } from "../Serializer/DatabaseSerializableFactory";
import { Term } from "../Models/Term";
import { Course } from "../Models/Course";
import { DatabaseWriter } from "../Serializer/DatabaseWriter";
import { MethodFailedException } from "../Exceptions/MethodFailedException";
import { IllegalArgumentException } from "../Exceptions/IllegalArgumentException";
import { IManager } from "./IManager";

/**
 * Manages Term operations and writes them persistently.
 */
export class TermManager implements IManager {
  protected db: Database;
  protected oh: ObjectHandler;
  private factory: DatabaseSerializableFactory;

  constructor(db: Database, oh: ObjectHandler) {
    this.db = db;
    this.oh = oh;
    this.factory = new DatabaseSerializableFactory(db);
  }

  /**
   * Creates a new term if it does not already exist.
   * @returns Newly created or existing term
   */
  async createTerm(termName: string, displayName?: string): Promise<Term> {
    let term: Term | null = null;

    try {
      const existingRow = await this.db.get(
        "SELECT * FROM terms WHERE terms.termName = ?",
        [termName]
      );

      if (existingRow) {
        term = await this.oh.getTerm(existingRow.id, this.db);
        if (!term) {
          throw new MethodFailedException(
            "Existing term could not be loaded."
          );
        }
        return term;
      } else {
        // Create new Term entity
        term = (await this.factory.create("Term")) as Term;
        if (!term) {
          throw new MethodFailedException("Term creation failed.");
        }

        term.setTermName(termName);
        term.setDisplayName(displayName || termName);

        // Write Root-Object Term
        const writer = new DatabaseWriter(this.db);
        await writer.writeRoot(term);

        return term;
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a term by ID and its associated courses.
   */
  async readTerm(id: number): Promise<Term> {
    const term = await this.oh.getTerm(id, this.db);
    if (!term) throw new IllegalArgumentException("TermID not found.");

    const courses = await this.getCoursesForTerm(term);
    for (const course of courses) {
      if (course !== null) {
        term.addCourse(course);
      }
    }
    return term;
  }

  /**
   * Fetches all terms from the database.
   */
  async getAllTerms(): Promise<Term[]> {
    const termRows = await this.db.all("SELECT * FROM terms");
    let allTerms: Term[] = [];
    for (const row of termRows) {
      const term = await this.oh.getTerm(row.id, this.db);
      if (term !== null) {
        allTerms.push(term);
      }
    }
    return allTerms;
  }

  /**
   * Adds a new course to an existing term.
   */
  async addCourseToTerm(
    termId: string | number,
    courseName: string
  ): Promise<Course> {
    const id = parseInt(termId as string);
    if (isNaN(id)) {
      throw new IllegalArgumentException("Term ID must be an integer");
    }

    if (!courseName || typeof courseName !== "string") {
      throw new IllegalArgumentException(
        "Course name is required and must be a string"
      );
    }

    try {
      const term = await this.readTerm(id);
      if (!term) {
        throw new MethodFailedException("Existing term could not be loaded.");
      }

      // Insert course directly with termId (required field)
      const result = await this.db.run(
        "INSERT INTO courses (courseName, termId) VALUES (?, ?)",
        [courseName, id]
      );

      if (!result || !result.lastID) {
        throw new MethodFailedException("Course creation failed.");
      }

      // Load the newly created course
      const course = await this.oh.getCourse(result.lastID, this.db);
      if (!course) {
        throw new MethodFailedException("Failed to load newly created course.");
      }

      return course;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves all courses associated with a given term.
   */
  async getCoursesForTerm(term: Term): Promise<Course[]> {
    const courseRows = await this.db.all(
      `SELECT * FROM courses WHERE termId = ?`,
      term.getId()
    );
    let courses: Course[] = [];
    for (const row of courseRows) {
      const course = await this.oh.getCourse(row.id, this.db);
      if (course !== null) {
        course.setTerm(term);
        courses.push(course);
      }
    }
    return courses;
  }

  /**
   * Deletes a term from the database.
   * @throws IllegalArgumentException if term has courses
   */
  async deleteTerm(termId: number): Promise<boolean> {
    try {
      // Check if term exists
      const term = await this.db.get(
        "SELECT id FROM terms WHERE id = ?",
        [termId]
      );

      if (!term) {
        return false;
      }

      // Check if term has courses
      const courses = await this.db.all(
        "SELECT id FROM courses WHERE termId = ?",
        [termId]
      );

      if (courses && courses.length > 0) {
        throw new IllegalArgumentException(
          "Cannot delete term with existing courses. Please delete all courses first."
        );
      }

      // Delete the term
      await this.db.run("DELETE FROM terms WHERE id = ?", [termId]);

      return true;
    } catch (error) {
      throw error;
    }
  }
}
