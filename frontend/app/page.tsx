"use client";

import { useState } from "react";

export default function Home() {
  const [form, setForm] = useState({
    no_of_dependents: 0,
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          no_of_dependents: Number(form.no_of_dependents),
          income_annum: Number(form.income_annum),
          loan_amount: Number(form.loan_amount),
          loan_term: Number(form.loan_term),
          cibil_score: Number(form.cibil_score),
          residential_assets_value: Number(form.residential_assets_value),
          commercial_assets_value: Number(form.commercial_assets_value),
          luxury_assets_value: Number(form.luxury_assets_value),
          bank_asset_value: Number(form.bank_asset_value),
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
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-blue-100 px-4 py-10">
      <div className="w-full max-w-2xl bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          🏦 Loan Approval Predictor
        </h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <input name="no_of_dependents" type="number" placeholder="Dependents" onChange={handleChange} className="input" />
          <select name="education" onChange={handleChange} className="input">
            <option value="">Education</option>
            <option value="Graduate">Graduate</option>
            <option value="Not Graduate">Not Graduate</option>
          </select>

          <select name="self_employed" onChange={handleChange} className="input">
            <option value="">Self Employed?</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
          <input name="income_annum" type="number" placeholder="Annual Income" onChange={handleChange} className="input" />

          <input name="loan_amount" type="number" placeholder="Loan Amount" onChange={handleChange} className="input" />
          <input name="loan_term" type="number" placeholder="Loan Term (months)" onChange={handleChange} className="input" />

          <input name="cibil_score" type="number" placeholder="CIBIL Score" onChange={handleChange} className="input" />
          <input name="residential_assets_value" type="number" placeholder="Residential Assets Value" onChange={handleChange} className="input" />

          <input name="commercial_assets_value" type="number" placeholder="Commercial Assets Value" onChange={handleChange} className="input" />
          <input name="luxury_assets_value" type="number" placeholder="Luxury Assets Value" onChange={handleChange} className="input" />
          <input name="bank_asset_value" type="number" placeholder="Bank Asset Value" onChange={handleChange} className="input" />

          <button
            type="submit"
            disabled={loading}
            className="col-span-full mt-3 bg-blue-600 text-white font-semibold py-3 rounded-xl shadow hover:bg-blue-700 transition-all"
          >
            {loading ? "Predicting..." : "Submit"}
          </button>
        </form>

        {result && (
          <div
            className={`mt-8 text-center rounded-2xl p-5 font-semibold ${
              result.loan_approval === "Approved"
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-700"
            }`}
          >
            <h2 className="text-2xl mb-2">
              {result.loan_approval === "Approved" ? "✅ Approved" : "❌ Rejected"}
            </h2>
            {result.approval_probability && (
              <p className="text-gray-600 text-lg">
                Approval Probability: {Math.round(result.approval_probability * 100)}%
              </p>
            )}
          </div>
        )}
      </div>

      <footer className="mt-8 text-gray-500 text-sm">
        © {new Date().getFullYear()} Loan Predictor | Powered by FastAPI & Next.js
      </footer>
    </main>
  );
}
