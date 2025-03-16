import { $Enums, Prisma } from "@prisma/client";
import { DefaultEventsMap, Socket as T_Socket } from "socket.io";

export { };

declare global {

  interface Socket extends T_Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any> {
    user?: User;
    sessionSocketId?: string[];
    readerServerSocketId?: string[];
  }

  type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
  };
  type LooseObject = {
    [key: string]: any;
  };
  type LooseStringObject = {
    [key: string]: string;
  };

  namespace Express {
    interface Request {
      user?: User;
      filesPaths?: {
        [key: string]: string[];
      };
    }
  }

  type User = {
    id: string;
    role: Role;
    warehouseUsers: {
      warehouse: {
        id: string;
        warehouseName: string;
        warehouseAddress: string;
        readers?: {
          id: string;
          role: string;
        }[]

      };
    }[];
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profilePicture: string | null;
  } | null
}
