import React, { useState } from "react";
import { Delete } from "lucide-react";

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState("0");
  const [equation, setEquation] = useState("");
  const [resetOnNext, setResetOnNext] = useState(false);

  const handleDigit = (digit: string) => {
    if (display === "0" || resetOnNext) {
      setDisplay(digit);
      setResetOnNext(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    if (resetOnNext) {
      setDisplay("0.");
      setResetOnNext(false);
    } else if (!display.includes(".")) {
      setDisplay(display + ".");
    }
  };

  const handleOperator = (op: string) => {
    setEquation(`${display} ${op}`);
    setResetOnNext(true);
  };

  const handleEquals = () => {
    if (!equation) return;
    try {
      const parts = equation.split(" ");
      const num1 = parseFloat(parts[0]);
      const op = parts[1];
      const num2 = parseFloat(display);
      let result = 0;

      switch (op) {
        case "+":
          result = num1 + num2;
          break;
        case "−":
        case "-":
          result = num1 - num2;
          break;
        case "×":
        case "*":
          result = num1 * num2;
          break;
        case "÷":
        case "/":
          result = num2 !== 0 ? num1 / num2 : 0;
          break;
        default:
          return;
      }

      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(4).replace(/\.?0+$/, "");
      setDisplay(formatted);
      setEquation(`${num1} ${op} ${num2} =`);
      setResetOnNext(true);
    } catch {
      setDisplay("Error");
      setResetOnNext(true);
    }
  };

  const handleClear = () => {
    setDisplay("0");
    setEquation("");
    setResetOnNext(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay("0");
    }
  };

  const handleSqrt = () => {
    const val = parseFloat(display);
    if (val >= 0) {
      setDisplay(Math.sqrt(val).toString());
      setEquation(`√(${val})`);
      setResetOnNext(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 p-3 select-none text-slate-100 justify-between">
      {/* Display */}
      <div className="flex flex-col items-end justify-end px-3 py-2 bg-slate-900/60 rounded-xl border border-white/5 mb-3 min-h-[70px]">
        <span className="text-[11px] text-slate-400 font-mono tracking-wider h-4">
          {equation}
        </span>
        <span className="text-2xl font-bold font-mono tracking-tight text-white truncate max-w-full">
          {display}
        </span>
      </div>

      {/* Keypad Grid */}
      <div className="grid grid-cols-4 gap-1.5 flex-1">
        <button
          onClick={handleClear}
          id="calc-btn-c"
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-amber-400 font-medium text-xs transition"
        >
          C
        </button>
        <button
          onClick={handleSqrt}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-sky-400 font-medium text-xs transition"
        >
          √x
        </button>
        <button
          onClick={handleBackspace}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
        >
          <Delete className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleOperator("÷")}
          id="calc-btn-divide"
          className="p-2 rounded-lg bg-sky-950/60 hover:bg-sky-800/60 text-sky-400 font-semibold text-sm transition"
        >
          ÷
        </button>

        {["7", "8", "9"].map((d) => (
          <button
            key={d}
            id={`calc-btn-${d}`}
            onClick={() => handleDigit(d)}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs transition border border-white/5"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator("×")}
          id="calc-btn-mult"
          className="p-2 rounded-lg bg-sky-950/60 hover:bg-sky-800/60 text-sky-400 font-semibold text-sm transition"
        >
          ×
        </button>

        {["4", "5", "6"].map((d) => (
          <button
            key={d}
            id={`calc-btn-${d}`}
            onClick={() => handleDigit(d)}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs transition border border-white/5"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator("−")}
          id="calc-btn-minus"
          className="p-2 rounded-lg bg-sky-950/60 hover:bg-sky-800/60 text-sky-400 font-semibold text-sm transition"
        >
          −
        </button>

        {["1", "2", "3"].map((d) => (
          <button
            key={d}
            id={`calc-btn-${d}`}
            onClick={() => handleDigit(d)}
            className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs transition border border-white/5"
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator("+")}
          id="calc-btn-plus"
          className="p-2 rounded-lg bg-sky-950/60 hover:bg-sky-800/60 text-sky-400 font-semibold text-sm transition"
        >
          +
        </button>

        <button
          onClick={() => {
            const val = parseFloat(display);
            setDisplay((-val).toString());
          }}
          className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs transition border border-white/5"
        >
          ±
        </button>
        <button
          onClick={() => handleDigit("0")}
          id="calc-btn-0"
          className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs transition border border-white/5"
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className="p-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 font-medium text-xs transition border border-white/5"
        >
          .
        </button>
        <button
          onClick={handleEquals}
          id="calc-btn-equals"
          className="p-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm transition shadow-md shadow-sky-900/40"
        >
          =
        </button>
      </div>
    </div>
  );
};
