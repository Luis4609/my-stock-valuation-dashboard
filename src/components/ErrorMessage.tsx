import React from "react";
import type { ErrorMessageProps } from "../types/types";

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => (
  <div
    className="bg-red-900 border border-red-600 text-red-200 px-4 py-3 rounded-lg relative"
    role="alert"
  >
    <strong className="font-bold">Error: </strong>
    <span className="block sm:inline">{message}</span>
  </div>
);
