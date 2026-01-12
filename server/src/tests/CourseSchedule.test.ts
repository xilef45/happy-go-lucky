import { describe, it, expect } from "vitest";
import { ObjectHandler } from "../ObjectHandler";
import { CourseSchedule, SubmissionDate } from "../Models/CourseSchedule";
import { DatabaseSerializableFactory } from "../Serializer/DatabaseSerializableFactory";
import { DatabaseWriter } from "../Serializer/DatabaseWriter";
import { initializeDB } from "../databaseInitializer";

async function openInMem() {
    return await initializeDB(":memory:", false);
}

describe("CourseSchedule", () => {
    // stateless, can be shared
    const oh = new ObjectHandler();
    
    it("should be empty on startup", async () => {
        const db = await openInMem();
        expect(await oh.getCourseSchedule(0, db)).toBeNull();
    });
    
    it("should automatically create id on insertion", async () => {
        const db = await openInMem();
        const dbsf = new DatabaseSerializableFactory(db);

        const expected = await dbsf.create("CourseSchedule") as CourseSchedule;
        const submission1 = await dbsf.create("SubmissionDate") as SubmissionDate;
        
        expected.setStartDate(new Date(2022, 0, 1));
        expected.setEndDate(new Date(2022, 1, 1));
        submission1.setSubmissionDate(new Date(2022, 0, 1));
        expected.setSubmissionDates([submission1]);

        await (new DatabaseWriter(db)).writeRoot(expected);

        const actual = await oh.getCourseSchedule(1, db);
        expect(actual).toEqual(expected);
    });
    
    it("should not allow duplicate submission dates", async () => {
        const db = await openInMem();
        const dbsf = new DatabaseSerializableFactory(db);

        const expected = await dbsf.create("CourseSchedule") as CourseSchedule;
        const submission1 = await dbsf.create("SubmissionDate") as SubmissionDate;
        const submission2 = await dbsf.create("SubmissionDate") as SubmissionDate;

        expected.setStartDate(new Date(2022, 0, 1));
        expected.setEndDate(new Date(2022, 1, 1));
        submission1.setSubmissionDate(new Date(2022, 0, 1));
        submission2.setSubmissionDate(new Date(2022, 0, 1));
        expected.setSubmissionDates([submission1, submission2]);

        await expect((new DatabaseWriter(db)).writeRoot(expected)).rejects.toThrow();
    });
    
    it("should not allow submissions before schedule", async () => {
        const db = await openInMem();
        const dbsf = new DatabaseSerializableFactory(db);

        const expected = await dbsf.create("CourseSchedule") as CourseSchedule;
        const submission1 = await dbsf.create("SubmissionDate") as SubmissionDate;

        expected.setStartDate(new Date(2022, 0, 2));
        expected.setEndDate(new Date(2022, 0, 3));
        submission1.setSubmissionDate(new Date(2022, 0, 1));
        expected.setSubmissionDates([submission1]);

        await expect((new DatabaseWriter(db)).writeRoot(expected)).rejects.toThrow();
    });

    it("should not allow submissions after schedule", async () => {
        const db = await openInMem();
        const dbsf = new DatabaseSerializableFactory(db);

        const expected = await dbsf.create("CourseSchedule") as CourseSchedule;
        const submission1 = await dbsf.create("SubmissionDate") as SubmissionDate;

        expected.setStartDate(new Date(2022, 0, 1));
        expected.setEndDate(new Date(2022, 0, 2));
        submission1.setSubmissionDate(new Date(2022, 0, 3));
        expected.setSubmissionDates([submission1]);

        await expect((new DatabaseWriter(db)).writeRoot(expected)).rejects.toThrow();
    });
    
    it("should allow updating schedules", async () => {
        const db = await openInMem();
        const dbfs = new DatabaseSerializableFactory(db);

        const scheduleBefore = await dbfs.create("CourseSchedule") as CourseSchedule;
        const submission1 = await dbfs.create("SubmissionDate") as SubmissionDate;

        scheduleBefore.setStartDate(new Date(2022, 0, 1));
        scheduleBefore.setEndDate(new Date(2022, 1, 1));
        submission1.setSubmissionDate(new Date(2022, 0, 1));
        scheduleBefore.setSubmissionDates([submission1]);

        await (new DatabaseWriter(db)).writeRoot(scheduleBefore);
        
        const expected = await oh.getCourseSchedule(1, db);
        if (!expected) { throw new Error("expected not null"); }
        expect(expected).toEqual(scheduleBefore);
        expected.setEndDate(new Date(2022, 2, 1));
        expected.getSubmissionDates()[0].setSubmissionDate(new Date(2022, 2, 1));

        await (new DatabaseWriter(db)).writeRoot(expected);
        
        // still id 1
        expect(await oh.getCourseSchedule(1, db)).toEqual(expected);
    });

    it("should return sorted submission dates", async () => {
        const db = await openInMem();
        const dbfs = new DatabaseSerializableFactory(db);

        const schedule = await dbfs.create("CourseSchedule") as CourseSchedule;
        const submission1 = await dbfs.create("SubmissionDate") as SubmissionDate;
        const submission2 = await dbfs.create("SubmissionDate") as SubmissionDate;
        const submission3 = await dbfs.create("SubmissionDate") as SubmissionDate;

        schedule.setStartDate(new Date(2022, 0, 1));
        schedule.setEndDate(new Date(2022, 1, 1));
        submission1.setSubmissionDate(new Date(2022, 0, 3));
        submission2.setSubmissionDate(new Date(2022, 0, 2));
        submission3.setSubmissionDate(new Date(2022, 0, 1));
        schedule.setSubmissionDates([submission1, submission2, submission3]);

        await (new DatabaseWriter(db)).writeRoot(schedule);
        // sorted manually after insertion
        schedule.getSubmissionDates().sort((a, b) => a.getSubmissionDate().getTime() - b.getSubmissionDate().getTime());
        expect(await oh.getCourseSchedule(1, db)).toEqual(schedule);
    });
});
