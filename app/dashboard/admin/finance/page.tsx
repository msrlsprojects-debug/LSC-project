'use client';

export default function ComingSoon() {
  return (
    <div className="h-full flex items-center justify-center">

      <div className="bg-white rounded-xl shadow-sm border-t-4 border-blue-600 p-8 text-center w-full max-w-md">

        <p className="text-xs uppercase tracking-wider text-gray-500">
          Module Status
        </p>

        <h1 className="text-2xl font-semibold text-blue-800 mt-2">
          Coming Soon
        </h1>

        <p className="text-sm text-gray-600 mt-3">
          This module is currently under development.
          <br />
          Please check back later.
        </p>

      </div>
    </div>
  );
}
