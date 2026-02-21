export enum UserRoleEnum {
    USER = "USER",
    ADMIN = "ADMIN",
}

export class UserRole {
    private readonly role: UserRoleEnum;

    // Define valid transitions between states
    private static validTransitions: Record<UserRoleEnum, UserRoleEnum[]> = {
        [UserRoleEnum.USER]: [UserRoleEnum.ADMIN],
        [UserRoleEnum.ADMIN]: [UserRoleEnum.USER],
    };

    constructor(initialRole: UserRoleEnum = UserRoleEnum.USER) {
        if (initialRole in UserRoleEnaum) {
            throw new Error(`Invalid initial role: ${initialRole}`);
        }
        this.role = initialRole;
    }

    getRoleObject(): UserRole {
        return this;
    }

    getRoleString(): string {
        return this.role;
    }

    canTransitionTo(newRole: UserRoleEnum): boolean {
        const allowedTransitions = UserRole.validTransitions[this.role];
        return allowedTransitions.includes(newRole); 
    }

    transitionTo(newRole: UserRoleEnum): UserRole {
        if (this.role === newRole) {
            return this; // No transition needed
        }
        if (this.canTransitionTo(newRole)) {
            return new UserRole(newRole); // Return a new instance since UserRole is a value object
        } else {
            throw new Error(
                `Invalid transition from ${this.role} to ${newRole}`
            );
        }
    }
}
