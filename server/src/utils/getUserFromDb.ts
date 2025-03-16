import { Prisma } from "@prisma/client";
import db from "./db"

export const getUserFromDb = async (param: { userId: string } | { email: string }) => {
    const query: Prisma.UserWhereUniqueInput = {} as any;
    if ("userId" in param)
        query.id = param.userId
    else if ("email" in param)
        query.email = param.email

    const user: User = await db.user.findUnique({
        where: query,
        select: {
            email: true,
            firstName: true,
            id: true,
            lastName: true,
            password: true,
            profilePicture: true,
            role: true,
            warehouseUsers: {
                select: {
                    warehouse: {
                        select: {
                            id: true,
                            warehouseAddress: true,
                            warehouseName: true,
                        }
                    }
                }
            }
        }
    })

    if (user?.role === "CounterMan") {
        for (const warehouseUser of user.warehouseUsers) {

            warehouseUser.warehouse.readers = await db.reader.findMany({
                where: {
                    warehouseId: warehouseUser.warehouse.id,
                    role: "Writer",
                },
                select: {
                    id: true,
                    role: true,
                }
            })

        }
    } else if (user?.role === "Worker") {
        for (const warehouseUser of user.warehouseUsers) {
            warehouseUser.warehouse.readers = await db.reader.findMany({
                where: {
                    warehouseId: warehouseUser.warehouse.id,
                    role: "Reader",
                },
                select: {
                    id: true,
                    role: true,
                }
            })

        }
    } else {
        if (user?.warehouseUsers)
            for (const warehouseUser of user.warehouseUsers) {

                warehouseUser.warehouse.readers = await db.reader.findMany({
                    where: {
                        warehouseId: warehouseUser.warehouse.id,
                    },
                    select: {
                        id: true,
                        role: true,
                    }
                })



            }
    }

    return user
}