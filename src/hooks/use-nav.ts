"use client";

import { create } from "zustand";
import type { ModuleId } from "@/lib/types";

interface NavState {
  active: ModuleId;
  set: (id: ModuleId) => void;
}

export const useNavStore = create<NavState>((set) => ({
  active: "overview",
  set: (id) => set({ active: id }),
}));
