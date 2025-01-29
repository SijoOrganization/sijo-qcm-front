export interface User {
    login: string;
    token: string;
    role: Role
}


export enum Role {
    STUDENT = 'STUDENT',
    TUTOR = 'TUTOR',
    ADMIN = 'ADMIN'
}