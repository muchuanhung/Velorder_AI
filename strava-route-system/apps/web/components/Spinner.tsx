import React from "react";
import { ClipLoader } from "react-spinners";

interface SpinnerProps {
  size?: number;
  color?: string;
  className?: string;
}

const Spinner: React.FC<SpinnerProps> = ({
  size = 40,
  color = "#767676",
  className = ""
}) => {
  return (
    <div className={`flex items-center justify-center w-full ${className}`}>
      <ClipLoader color={color} size={size} />
    </div>
  );
};

export default React.memo(Spinner);
