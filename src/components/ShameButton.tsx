import React, { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import Confetti from "react-confetti";
import { Sword } from "lucide-react";

interface ShameButtonProps {
  onClick?: () => void;
}

const ShameButton: React.FC<ShameButtonProps> = ({ onClick }) => {
  const [isExploding, setIsExploding] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const updateSize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    if (!isExploding) return;

    const timeout = setTimeout(() => {
      setIsExploding(false);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [isExploding]);

  const handleClick = useCallback(() => {
    setIsExploding(true);
    onClick?.();
  }, [onClick]);

  return (
    <>
      {isExploding && dimensions.width > 0 && dimensions.height > 0 && (
        <Confetti
          width={dimensions.width}
          height={dimensions.height}
          numberOfPieces={600}
          gravity={0.3}
          colors={["#8C1D40", "#000000", "#FFC627"]}
          recycle={false}
          run={true}
        />
      )}

      <motion.button
        type="button"
        aria-label="Trigger shame"
        onClick={handleClick}
        whileHover={{
          scale: 1.08,
          rotate: -1.5,
          boxShadow: "0 0 60px rgba(127, 29, 29, 0.95)",
        }}
        whileTap={{ scale: 0.92, rotate: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="relative inline-flex items-center justify-center rounded-3xl border border-red-900/80 bg-linear-to-b from-red-950 via-red-800 to-red-950 px-8 py-5 sm:px-12 sm:py-7 md:px-16 md:py-9 shadow-[0_25px_60px_rgba(0,0,0,0.85)] text-red-50 select-none overflow-hidden"
      >
        <span className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
          <span className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-red-200/20 via-transparent to-transparent" />
          <span className="absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-red-300/15 via-transparent to-transparent" />
          <span className="absolute inset-x-0 bottom-0 h-[30%] bg-linear-to-t from-black/60 via-red-950/60 to-transparent" />
        </span>

        <span className="relative flex items-center gap-4 sm:gap-6">
          <span className="font-serif font-extrabold uppercase tracking-[0.45em] text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none">
            SHAME
          </span>
          <Sword
            aria-hidden="true"
            className="w-[1.2em] h-[1.2em] rotate-45 drop-shadow-[0_0_18px_rgba(0,0,0,0.75)]"
            strokeWidth={1.5}
          />
        </span>

        <span className="pointer-events-none absolute inset-0 ring-2 ring-red-900/70 ring-offset-4 ring-offset-black/60" />
      </motion.button>
    </>
  );
};

const ShameBell: React.FC = () => (
  <div onClick={() => alert('SHAME! ')}>Ring for Macrohard's sins</div>
);

export { ShameBell };
export default ShameButton;