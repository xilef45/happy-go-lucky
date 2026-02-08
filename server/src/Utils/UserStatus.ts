export enum UserStatusEnum {
    confirmed = "confirmed",
    unconfirmed = "unconfirmed",
    suspended = "suspended",
    removed = "removed",
}

export class UserStatus {
    private readonly status: UserStatusEnum;

    // Define valid transitions between states
    private static validTransitions: Record<UserStatusEnum, UserStatusEnum[]> = {
        [UserStatusEnum.confirmed]: [UserStatusEnum.suspended],
        [UserStatusEnum.unconfirmed]: [UserStatusEnum.confirmed, UserStatusEnum.suspended, UserStatusEnum.removed],
        [UserStatusEnum.suspended]: [UserStatusEnum.confirmed, UserStatusEnum.removed],
        [UserStatusEnum.removed]: [],
    };

    constructor(initialStatus: UserStatusEnum = UserStatusEnum.unconfirmed) {
        if (!(initialStatus in UserStatusEnum)) {
            throw new Error(`Invalid initial status: ${initialStatus}`);
        }
        this.status = initialStatus;
    }

    getStatusString(): string {
        return this.status;
    }

    getStatusEnum(): UserStatusEnum {
        return this.status;
    }

    canTransitionTo(newStatus: UserStatusEnum): boolean {
        const allowedTransitions = UserStatus.validTransitions[this.status];
        return allowedTransitions.includes(newStatus);
    }

    transitionTo(newStatus: UserStatusEnum): UserStatus {
        if(this.status === newStatus) {
            return this; // No transition needed
        }
        if (this.canTransitionTo(newStatus)) {
            return new UserStatus(newStatus); // Return a new instance since UserStatus is a value object
        } else {
            throw new Error(
                `Invalid transition from ${this.status} to ${newStatus}`
            );
        }
    }
}