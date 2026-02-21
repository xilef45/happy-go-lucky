import { describe, it, expect } from "vitest";
import { UserRole, UserRoleEnum } from "../Utils/UserRole";

describe("UserRole", () => {
    it("should initialize with the default role 'user'", () => {
        const userRole = new UserRole();
        expect(userRole.getRoleEnum()).toBe(UserRoleEnum.USER);
    });

    it("should allow creating a new role with a specific initial value", () => {
        const userRole = new UserRole(UserRoleEnum.ADMIN);
        expect(userRole.getRoleEnum()).toBe(UserRoleEnum.ADMIN);
    });

    it("can transition from 'user' to 'admin' true", () => {
        const userRole = new UserRole(UserRoleEnum.USER);
        const isPossible = userRole.canTransitionTo(UserRoleEnum.ADMIN);
        expect(isPossible).toBe(true);
    });

    it("can transition from 'admin' to 'user'", () => {
        const userRole = new UserRole(UserRoleEnum.ADMIN);
        const isPossible = userRole.canTransitionTo(UserRoleEnum.USER);
        expect(isPossible).toBe(true);
    });

    it("should allow transitioning role from 'user' to 'admin'", () => {
        const userRole = new UserRole(UserRoleEnum.USER);
        const newRole = userRole.transitionTo(UserRoleEnum.ADMIN);
        expect(newRole.getRoleEnum()).toBe(UserRoleEnum.ADMIN);
        expect(userRole.getRoleEnum()).toBe(UserRoleEnum.USER); // Original remains unchanged
    });

    it("should allow transitioning role from 'admin' to 'user'", () => {
        const userRole = new UserRole(UserRoleEnum.ADMIN);
        const newRole = userRole.transitionTo(UserRoleEnum.USER);
        expect(newRole.getRoleEnum()).toBe(UserRoleEnum.USER);
        expect(userRole.getRoleEnum()).toBe(UserRoleEnum.ADMIN); // Original remains unchanged
    });

    it("should return the same object when transitioning to the same role user", () => {
        const userRole = new UserRole(UserRoleEnum.USER);
        const newRole = userRole.transitionTo(UserRoleEnum.USER);
        expect(newRole).toBe(userRole); // Should return the same instance
    });

    it("should return the same object when transitioning to the same role admin", () => {
        const userRole = new UserRole(UserRoleEnum.ADMIN);
        const newRole = userRole.transitionTo(UserRoleEnum.ADMIN);
        expect(newRole).toBe(userRole); // Should return the same instance
    });

    it("should throw an error when initialized with an invalid role", () => {
        expect(() => new UserRole("invalid" as UserRoleEnum)).toThrowError(
            "Invalid initial role: invalid"
        );
    });

    it("should return the correct role (admin) when using getRoleEnum()", () => {
        const userRole = new UserRole(UserRoleEnum.ADMIN);
        expect(userRole.getRoleEnum()).toBe(UserRoleEnum.ADMIN);
    });

    it("should return the correct role (user) when using getRoleEnum()", () => {
        const userRole = new UserRole(UserRoleEnum.USER);
        expect(userRole.getRoleEnum()).toBe(UserRoleEnum.USER);
    });

    it("should return the correct string representation of the role admin", () => {
        const userRole = new UserRole(UserRoleEnum.ADMIN);
        expect(userRole.isRole(UserRoleEnum.ADMIN)).toBe(true);
    });

    it("should return the correct string representation of the role user", () => {
        const userRole = new UserRole(UserRoleEnum.USER);
        expect(userRole.isRole(UserRoleEnum.USER)).toBe(true);
    });
});
