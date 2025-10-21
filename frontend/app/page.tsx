"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

// =================================================================
// CUSTOM SELECT COMPONENT (REQUIRED FOR DROPDOWN UI)
// =================================================================

type Option = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  name: string;
  value: string;
  placeholder: string;
  options: Option[];
  onChange: (e: { target: { name: string; value: string } }) => void;
  id: string; // Added ID for label association
};

const CustomSelect = ({ name, value, placeholder, options, onChange, id }: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const displayLabel = options.find(opt => opt.value === value)?.label || placeholder;

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

  const handleSelect = (optionValue: string) => {
    onChange({ target: { name, value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={id} // Associate button with the label
        id={id}
        className={`input flex justify-between items-center cursor-pointer ${value === "" ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-white"
          } hover:shadow-md`}
      >
        <span>{displayLabel}</span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-gray-500 dark:text-gray-400 ml-2 text-sm"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            role="listbox"
            className="absolute z-10 w-full mt-1 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
            style={{
              backgroundColor: 'var(--input-bg, #ffffff)',
              color: 'var(--input-text, #1f2937)'
            }}
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => handleSelect(option.value)}
                role="option"
                aria-selected={option.value === value}
                className={`px-4 py-2 cursor-pointer transition-colors duration-100 last:rounded-b-xl first:rounded-t-xl ${option.value === value
                  ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 font-semibold'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {option.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
};

// =================================================================
// HOME COMPONENT (MAIN)
// =================================================================

export default function Home() {
  // ... (State and Handler definitions are unchanged)
  const [form, setForm] = useState({
    no_of_dependents: "",
    education: "",
    self_employed: "",
    income_annum: "",
    loan_amount: "",
    loan_term: "",
    cibil_score: "",
    residential_assets_value: "",
    commercial_assets_value: "",
    luxury_assets_value: "",
    bank_asset_value: "",
  });

  const [result, setResult] = useState<{ loan_approval?: string; approval_probability?: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Options data for the custom dropdowns
  const educationOptions: Option[] = [
    { value: "Graduate", label: "Graduate" },
    { value: "Not Graduate", label: "Not Graduate" },
  ];

  const selfEmployedOptions: Option[] = [
    { value: "Yes", label: "Yes" },
    { value: "No", label: "No" },
  ];


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | { target: { name: string; value: string | number } }) => {
    const { name, value, type } = e.target;

    // Explicitly handle select elements passed from CustomSelect
    if (name === "education" || name === "self_employed") {
      setForm({ ...form, [name]: value });
      return;
    }

    // Handle number inputs (original logic)
    if (type === "number") {
      const val = Number(value);
      if (val < 0) return;
      setForm({ ...form, [name]: val });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Basic validation to prevent submission if required fields are missing
    const requiredFields = [
      "no_of_dependents", "education", "self_employed", "income_annum",
      "loan_amount", "loan_term", "cibil_score", "residential_assets_value",
      "commercial_assets_value", "luxury_assets_value", "bank_asset_value"
    ];

    // Convert all form values to string for easy checking, then filter out empty strings
    const isFormValid = requiredFields.every(field => String(form[field as keyof typeof form]) !== "");

    if (!isFormValid) {
      alert("Please fill out all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Ensure all values are converted to numbers for the API
          no_of_dependents: Number(form.no_of_dependents),
          income_annum: Number(form.income_annum),
          loan_amount: Number(form.loan_amount),
          loan_term: Number(form.loan_term),
          cibil_score: Number(form.cibil_score),
          residential_assets_value: Number(form.residential_assets_value),
          commercial_assets_value: Number(form.commercial_assets_value),
          luxury_assets_value: Number(form.luxury_assets_value),
          bank_asset_value: Number(form.bank_asset_value),
          // Categorical fields remain strings
          education: form.education,
          self_employed: form.self_employed,
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Error connecting to API");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 px-5 py-10 transition-colors">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-2xl rounded-3xl p-8 border border-gray-100 dark:border-gray-700 transition-colors"
      >
        <h1 className="text-4xl font-extrabold text-center mb-2 text-blue-800 dark:text-blue-400 tracking-tight">
          FinTech-Approve
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-300 mb-8">
          Fill in your financial details to check your loan approval chances.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Applicant Info */}
          <h2 className="col-span-full text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 mb-2 text-center">
            👤 Applicant Information
          </h2>

          {/* Dependents Field */}
          <div className="flex flex-col">
            <label htmlFor="dependents" className="label">Number of Dependents</label>
            <input
              id="dependents"
              name="no_of_dependents"
              type="number"
              placeholder="e.g., 2"
              value={form.no_of_dependents}
              onChange={handleChange}
              min={0}
              className="input"
            />
          </div>

          {/* Education dropdown */}
          <div className="flex flex-col">
            <label htmlFor="education" className="label">Education Level</label>
            <CustomSelect
              id="education"
              name="education"
              value={form.education}
              placeholder="Select Education"
              options={educationOptions}
              onChange={handleChange}
            />
          </div>

          {/* Self Employed dropdown */}
          <div className="flex flex-col">
            <label htmlFor="self_employed" className="label">Self Employed Status</label>
            <CustomSelect
              id="self_employed"
              name="self_employed"
              value={form.self_employed}
              placeholder="Are you self-employed?"
              options={selfEmployedOptions}
              onChange={handleChange}
            />
          </div>

          {/* CIBIL Score Field */}
          <div className="flex flex-col">
            <label htmlFor="cibil_score" className="label">CIBIL Score</label>
            <input
              id="cibil_score"
              name="cibil_score"
              type="number"
              placeholder="e.g., 750 (300-900)"
              value={form.cibil_score}
              onChange={handleChange}
              min={0}
              max={900} // Added max for score guidance
              className="input"
            />
          </div>


          {/* Financial Info */}
          <h2 className="col-span-full text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 mt-4 mb-2 text-center">
            💰 Financial Details
          </h2>

          {/* Annual Income Field */}
          <div className="flex flex-col">
            <label htmlFor="income_annum" className="label">Annual Income (₹)</label>
            <input id="income_annum" name="income_annum" type="number" placeholder="e.g., 4000000" value={form.income_annum} onChange={handleChange} min={0} className="input" />
          </div>

          {/* Loan Amount Field */}
          <div className="flex flex-col">
            <label htmlFor="loan_amount" className="label">Requested Loan Amount (₹)</label>
            <input id="loan_amount" name="loan_amount" type="number" placeholder="e.g., 15000000" value={form.loan_amount} onChange={handleChange} min={0} className="input" />
          </div>

          {/* Loan Term Field */}
          <div className="flex flex-col">
            <label htmlFor="loan_term" className="label">Loan Term (Years)</label>
            <input id="loan_term" name="loan_term" type="number" placeholder="e.g., 15" value={form.loan_term} onChange={handleChange} min={0} className="input" />
          </div>

          <span className="col-span-full"></span> {/* Empty span to balance the grid if needed */}


          {/* Assets */}
          <h2 className="col-span-full text-lg font-semibold text-gray-700 dark:text-gray-200 border-b pb-1 mt-4 mb-2 text-center">
            🏠 Assets Information
          </h2>

          {/* Residential Assets Field */}
          <div className="flex flex-col">
            <label htmlFor="residential_assets_value" className="label">Residential Assets Value (₹)</label>
            <input id="residential_assets_value" name="residential_assets_value" type="number" placeholder="e.g., 5000000" value={form.residential_assets_value} onChange={handleChange} min={0} className="input" />
          </div>

          {/* Commercial Assets Field */}
          <div className="flex flex-col">
            <label htmlFor="commercial_assets_value" className="label">Commercial Assets Value (₹)</label>
            <input id="commercial_assets_value" name="commercial_assets_value" type="number" placeholder="e.g., 1000000" value={form.commercial_assets_value} onChange={handleChange} min={0} className="input" />
          </div>

          {/* Luxury Assets Field */}
          <div className="flex flex-col">
            <label htmlFor="luxury_assets_value" className="label">Luxury Assets Value (₹)</label>
            <input id="luxury_assets_value" name="luxury_assets_value" type="number" placeholder="e.g., 2000000" value={form.luxury_assets_value} onChange={handleChange} min={0} className="input" />
          </div>

          {/* Bank Assets Field */}
          <div className="flex flex-col">
            <label htmlFor="bank_asset_value" className="label">Bank Balance (₹)</label>
            <input id="bank_asset_value" name="bank_asset_value" type="number" placeholder="e.g., 500000" value={form.bank_asset_value} onChange={handleChange} min={0} className="input" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="col-span-full mt-6 bg-blue-600 dark:bg-blue-500 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 dark:hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing..." : "Predict Loan Approval"}
          </button>
        </form>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-8 text-center rounded-2xl p-6 font-semibold ${result.loan_approval === "Approved"
                ? "bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                : "bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300"
                }`}
            >
              <h2 className="text-2xl mb-2">
                {result.loan_approval === "Approved" ? "✅ Loan Approved" : "❌ Loan Rejected"}
              </h2>
              {result.approval_probability !== undefined && (
                <p className="text-gray-600 dark:text-gray-300 text-lg">
                  Approval Probability:{" "}
                  <span className="font-bold text-gray-800 dark:text-gray-100">
                    {Math.round(result.approval_probability * 100)}%
                  </span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <footer className="mt-10 text-gray-500 dark:text-gray-400 text-sm">
        © {new Date().getFullYear()} Automated Loan Approval System | Built with FastAPI + Next.js
      </footer>
    </main>
  );
}