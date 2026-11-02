export function ResultCard({ label, confidence }) {
  const getStatusColor = (conf) => {
    if (conf >= 0.8) return "from-green-500 to-emerald-600";
    if (conf >= 0.6) return "from-yellow-500 to-orange-500";
    return "from-orange-500 to-red-500";
  };

  const getStatusText = (conf) => {
    if (conf >= 0.8) return "High Confidence";
    if (conf >= 0.6) return "Medium Confidence";
    return "Low Confidence";
  };

  return (
    <div className="p-6 border-2 border-gray-200 rounded-2xl shadow-xl bg-gradient-to-br from-white to-gray-50 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-12 h-12 bg-gradient-to-br ${getStatusColor(confidence)} rounded-xl flex items-center justify-center shadow-lg`}>
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">{getStatusText(confidence)}</p>
          <h2 className="text-2xl font-bold text-gray-800">{label}</h2>
        </div>
      </div>

      <div className="bg-gray-100 rounded-xl p-4 border border-gray-200">
        <p className="text-sm text-gray-600 mb-2 font-medium">Confidence Score</p>
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${getStatusColor(confidence)} transition-all duration-1000 ease-out rounded-full`}
              style={{ width: `${confidence * 100}%` }}
            ></div>
          </div>
          <span className="text-lg font-bold text-gray-800">{(confidence * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}
