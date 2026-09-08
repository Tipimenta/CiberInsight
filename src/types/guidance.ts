export interface PracticalResource {
  id: string;
  type:
    | "template"
    | "checklist"
    | "example"
    | "official_reference"
    | "implementation_guide";
  title: string;
  description: string;
  sourceType: "official" | "instrument";
  sourceName?: string;
  url?: string;
  file?: string;
  applicableTransitions?: (
    | "from0To1"
    | "from1To2"
    | "from2To3"
    | "maintainLevel3"
    | "all"
  )[];
}

export interface TransitionDetail {
  objective: string;
  summary: string;
  whatIsMissing: string;
  practicalSteps: string[];
  whoToInvolve: string[];
  expectedEvidence: string[];
  completionCriteria: string[];
  commonMistakes: string[];
}

export interface ControlGuidanceItem {
  questionId: number;
  whyItMatters: string;
  transitions: {
    from0To1?: TransitionDetail;
    from1To2?: TransitionDetail;
    from2To3?: TransitionDetail;
    maintainLevel3?: TransitionDetail;
  };
  practicalResources?: PracticalResource[];
}

export type ControlGuidanceData = Record<number, ControlGuidanceItem>;