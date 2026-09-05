import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md border border-slate-200 p-8 text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
          P360
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">PeoplePay360</h1>
          <p className="text-sm text-slate-500 mt-1">
            HR & Payroll Management System
          </p>
        </div>
        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
          <Link
            to="/login"
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/signup"
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Home;