import { Role } from "./enums";

type User = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profilePicture: string | null;
    role: Role;
    warehouseUsers: {
        warehouse: {
            id: string;
            warehouseName: string;
            warehouseAddress: string;
            readers?: {
                id:string;
                role: "Writer" | "Reader";
            }[]
        };
    }[];
}

export type Login = {
    res: {
        success: boolean;
        message: string;
        user: User
    },
    body: {
        email: string;
        password: string;
    }
}