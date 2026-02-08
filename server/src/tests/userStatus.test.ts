import { describe, it, expect } from "vitest";
import { UserStatus, UserStatusEnum } from "../Utils/UserStatus";

describe("UserStatus", () => {
    it("should initialize with the default status 'unconfirmed'", () => {
        const userStatus = new UserStatus();
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.unconfirmed);
    });

    it("should allow creating a new status with a specific initial value", () => {
        const userStatus = new UserStatus(UserStatusEnum.confirmed);
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.confirmed);
    });

    it("should allow transitioning from 'unconfirmed' to 'confirmed'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.confirmed);
        expect(newStatus.getStatusEnum()).toBe(UserStatusEnum.confirmed);
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'suspended'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.suspended);
        expect(newStatus.getStatusEnum()).toBe(UserStatusEnum.suspended);
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'unconfirmed' to 'removed'", () => {
        const userStatus = new UserStatus();
        const newStatus = userStatus.transitionTo(UserStatusEnum.removed);
        expect(newStatus.getStatusEnum()).toBe(UserStatusEnum.removed);
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.unconfirmed); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'confirmed'", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        const newStatus = userStatus.transitionTo(UserStatusEnum.confirmed);
        expect(newStatus.getStatusEnum()).toBe(UserStatusEnum.confirmed);
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.suspended); // Original remains unchanged
    });

    it("should allow transitioning from 'suspended' to 'removed'", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        const newStatus = userStatus.transitionTo(UserStatusEnum.removed);
        expect(newStatus.getStatusEnum()).toBe(UserStatusEnum.removed);
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.suspended); // Original remains unchanged
    });

    it("should not allow transitioning from 'removed' to any other status", () => {
        const userStatus = new UserStatus(UserStatusEnum.removed);
        expect(() => userStatus.transitionTo(UserStatusEnum.confirmed)).toThrowError(
            "Invalid transition from removed to confirmed"
        );
        expect(() => userStatus.transitionTo(UserStatusEnum.unconfirmed)).toThrowError(
            "Invalid transition from removed to unconfirmed"
        );
        expect(() => userStatus.transitionTo(UserStatusEnum.suspended)).toThrowError(
            "Invalid transition from removed to suspended"
        );
    });

    it("should throw an error when initialized with an invalid status", () => {
        expect(() => new UserStatus("invalid" as UserStatusEnum)).toThrowError(
            "Invalid initial status: invalid"
        );
    });

    it("should return the correct status when using getStatus()", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        expect(userStatus.getStatusEnum()).toBe(UserStatusEnum.suspended);
    });

    it("should return the status string confirmed when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.confirmed);
        expect(userStatus.getStatusString()).toBe("confirmed");
    });

    it("should return the status string unconfirmed when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.unconfirmed);
        expect(userStatus.getStatusString()).toBe("unconfirmed");
    });

    it("should return the status string suspended when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.suspended);
        expect(userStatus.getStatusString()).toBe("suspended");
    });

    it("should return the status string removed when using getStatusString()", () => {
        const userStatus = new UserStatus(UserStatusEnum.removed);
        expect(userStatus.getStatusString()).toBe("removed");
    });
      
});