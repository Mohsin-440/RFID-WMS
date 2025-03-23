"use client";

import { useUserStore } from "@/store/user.store";
import Image from "next/image";
import { useParams } from "next/navigation";
import { MdOutlineEmail } from "react-icons/md";
import { RxAvatar } from "react-icons/rx";


const Navbar = () => {
  const { userInfo } = useUserStore();
  const params = useParams<{ warehouseId: string }>()
  const warehouseUser = userInfo?.warehouseUsers.find((w) => w.warehouse.id === params.warehouseId);

  return (
    <div className="flex items-center justify-between p-4 bg-white ">

      <div className="flex items-center flex-1">
        <p className="font-semibold flex items-center gap-2 bg-blue-500 px-3 py-1 text-white rounded-full">
          <MdOutlineEmail />{" "}
          <span className="font-light text-sm">{userInfo?.email}</span>
        </p>
      </div>


      <div className="flex items-center gap-4 relative">
        <div className="flex items-center gap-2">

          <div className="hidden md:flex flex-col items-end">
            <span className="font-semibold text-sm">
              {userInfo?.firstName} {userInfo?.lastName}
            </span>
            <span className="text-xs text-gray-500">{userInfo?.role}</span>
            <div className="space-x-1">
              <span className="text-xs text-gray-500 font-semibold">Branch name:</span>
              <span className="text-xs text-gray-500">{warehouseUser?.warehouse?.warehouseName}</span>
            </div>
          </div>

          <div className="relative w-9 h-9">

            {userInfo?.profilePicture ? (
              <Image
                src={"http://localhost:4000/" + userInfo.profilePicture} // Directly using the full URL
                alt="User Avatar"
                width={36} // fixed size to keep it uniform
                height={36}
                className="rounded-full object-cover" // Circular image
              />
            ) : (
              <RxAvatar className="w-9 h-9" color="grey" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
