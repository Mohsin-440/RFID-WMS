import { create } from "zustand";
import { Login } from "@wsm/shared/types/login"

type UserStore = {
  userInfo: Login["res"]["user"] | null;
  setUserInfo: (user: Login["res"]["user"]  | null) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  userInfo: null,
  setUserInfo: (user) =>
    set((state) => ({ ...state, userInfo: user })),
}));
