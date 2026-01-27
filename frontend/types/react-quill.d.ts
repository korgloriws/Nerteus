declare module "react-quill" {
  import type { ComponentType } from "react";

  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    onChange?: (value: string) => void;
    theme?: string;
    modules?: Record<string, unknown>;
    formats?: string[];
    placeholder?: string;
  }

  const ReactQuill: ComponentType<ReactQuillProps>;
  export default ReactQuill;
}

