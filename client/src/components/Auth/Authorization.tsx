"use client";
import { useUserStore } from "@/store/user.store";
import { Role } from "@wsm/shared/types/enums";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";


const Authorization = ({ roles, navigate, children, }: { roles: Role[]; navigate: boolean; children: ReactNode; }) => {
  const { userInfo } = useUserStore();
  const router = useRouter();
  if (userInfo && navigate && !roles.includes(userInfo?.role as Role)) {
    router.push(`/${userInfo.warehouseUsers[0].warehouse.id}/dashboard`);

    return
  }
  return roles.includes(userInfo?.role as Role) ? children : null;
};

export default Authorization;