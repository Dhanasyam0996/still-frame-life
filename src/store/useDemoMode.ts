import { create } from "zustand";

import { useCadastre } from "@/store/useCadastre";

export interface DemoStep {
  title: string;
  caption: string;
  apply: () => void;
}

/** Each step sets the FULL target state, so steps are idempotent. */
export const DEMO_STEPS: DemoStep[] = [
  {
    title: "Parcel P-102",
    caption: "A single 2,500 m² land parcel — the unit of a traditional 2D record.",
    apply: () => {
      const s = useCadastre.getState();
      s.setUnderground(false);
      s.setExplode(false);
      s.setRecordView("cadastre3d");
      s.setConflictView(null);
      s.select({ parcelId: "P-102" });
    },
  },
  {
    title: "Building B-001",
    caption: "One building on the parcel: ground floor plus six residential floors.",
    apply: () => {
      const s = useCadastre.getState();
      s.setUnderground(false);
      s.setExplode(false);
      s.setConflictView(null);
      s.select({ buildingId: "B-001" });
    },
  },
  {
    title: "Floor 4",
    caption: "Floors slice apart: each floor is 3.2 m high with six apartments.",
    apply: () => {
      const s = useCadastre.getState();
      s.setUnderground(false);
      s.setExplode(true);
      s.setConflictView(null);
      s.select({ floorId: "B-001-F4" });
    },
  },
  {
    title: "Apartment A-402",
    caption: "Drilling to a single apartment — its own 3D ownership volume.",
    apply: () => {
      const s = useCadastre.getState();
      s.setUnderground(false);
      s.setExplode(false);
      s.setConflictView(null);
      s.select({ propertyId: "A-402" });
    },
  },
  {
    title: "Ownership volume",
    caption: "Not a polygon: 10 m × 12.5 m × 3.2 m = 400 m³ of owned space.",
    apply: () => {
      const s = useCadastre.getState();
      s.setUnderground(false);
      s.setConflictView(null);
      s.setVolume("showVolume", true);
      s.setVolume("showMeasure", true);
      s.setVolume("showElevation", true);
      s.select({ propertyId: "A-402" });
    },
  },
  {
    title: "Prototype ULPIN",
    caption: "A spatial identifier generated live: AP-ELR-P102-B01-F04-A402-X7K9.",
    apply: () => {
      const s = useCadastre.getState();
      s.select({ propertyId: "A-402" });
      try {
        s.issueUlpin("A-402");
      } catch {
        /* already issued */
      }
    },
  },
  {
    title: "Underground mode",
    caption: "Terrain fades away to reveal the buried utility network.",
    apply: () => {
      const s = useCadastre.getState();
      s.setConflictView(null);
      s.setUnderground(true);
      s.select({ propertyId: "A-402" });
    },
  },
  {
    title: "Water line UT-W-001",
    caption: "The main rises through the common corridor and branches indoors.",
    apply: () => {
      const s = useCadastre.getState();
      s.setUnderground(true);
      s.setConflictView(null);
      s.select({ utilityId: "UT-W-001", propertyId: "A-402" });
    },
  },
  {
    title: "Conflict detected",
    caption: "Geometry check: the branch passes through A-402's ownership volume.",
    apply: () => {
      const s = useCadastre.getState();
      s.setUnderground(true);
      s.select({ propertyId: "A-402", utilityId: "UT-W-001" });
      const conflict = s.conflicts.find(
        (c) => c.entityIds.includes("A-402") && c.entityIds.includes("UT-W-001"),
      );
      if (conflict) s.setConflictView(conflict.id);
    },
  },
  {
    title: "Validated record",
    caption: "The property record is exportable, with ULPIN and conflict status.",
    apply: () => {
      const s = useCadastre.getState();
      s.setConflictView(null);
      s.setUnderground(false);
      s.select({ propertyId: "A-402" });
    },
  },
];

interface DemoState {
  active: boolean;
  step: number;
  playing: boolean;
  start: () => void;
  exit: () => void;
  goTo: (i: number) => void;
  next: () => void;
  prev: () => void;
  restart: () => void;
  setPlaying: (v: boolean) => void;
}

export const useDemoMode = create<DemoState>((set, get) => ({
  active: false,
  step: 0,
  playing: false,
  start: () => {
    useCadastre.getState().resetDemoData();
    DEMO_STEPS[0]!.apply();
    set({ active: true, step: 0, playing: true });
  },
  exit: () => {
    const s = useCadastre.getState();
    s.setConflictView(null);
    s.setExplode(false);
    set({ active: false, playing: false, step: 0 });
  },
  goTo: (i) => {
    const step = Math.max(0, Math.min(DEMO_STEPS.length - 1, i));
    DEMO_STEPS[step]!.apply();
    set({ step });
  },
  next: () => {
    const { step } = get();
    if (step >= DEMO_STEPS.length - 1) {
      set({ playing: false });
      return;
    }
    get().goTo(step + 1);
  },
  prev: () => get().goTo(get().step - 1),
  restart: () => {
    useCadastre.getState().resetDemoData();
    get().goTo(0);
    set({ playing: true });
  },
  setPlaying: (v) => set({ playing: v }),
}));
