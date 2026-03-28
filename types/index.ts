export interface MutationResult<T = unknown> {
  ok: boolean;
  errors?: string[];
  data?: T;
}

export interface PaginatedResult<T = unknown> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  isSuperuser: boolean;
  permissions: string[];
}

export interface FormFieldDefinition {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "select"
    | "checkbox"
    | "date";
  required?: boolean;
  options?: { label: string; value: string }[];
  placeholder?: string;
  defaultValue?: string;
}

export interface WorkflowStepDefinition {
  name: string;
  label: string;
  type: "manual" | "auto";
  assigneeGroupId?: string;
  nextSteps: string[];
}
