export default function BrowserFrame({ url = "myapp.local", children, isLoading = false }) {
  return (
    <div className="max-w-[1400px] w-full mx-auto">
      <div className="border border-gray-200 rounded-2xl overflow-hidden flex flex-col w-full h-[800px] shadow-2xl bg-white transform transition-all duration-700">
        {/* Browser Top Bar */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b border-gray-200">
          {/* Traffic Light Buttons */}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors cursor-pointer shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-600 transition-colors cursor-pointer shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors cursor-pointer shadow-sm"></div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center gap-1 ml-4">
            <button className="p-1.5 rounded hover:bg-gray-200 transition-colors" disabled>
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-200 transition-colors" disabled>
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button className="p-1.5 rounded hover:bg-gray-200 transition-colors ml-1" disabled>
              <svg
                className="w-4 h-4 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>

          {/* URL Bar */}
          <div className="flex-1 mx-4">
            <div className="flex items-center bg-white border border-gray-300 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition-shadow">
              <div
                className={`w-2 h-2 rounded-full mr-2 transition-colors ${
                  isLoading ? "bg-yellow-500 animate-pulse" : "bg-green-500"
                }`}></div>
              <svg
                className="w-4 h-4 text-gray-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <input
                className="flex-1 text-sm text-gray-700 bg-transparent focus:outline-none"
                value={`${url}`}
                readOnly
              />
              {isLoading && (
                <div className="ml-2">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                </div>
              )}
            </div>
          </div>

          {/* Menu Button */}
          <button className="p-1.5 rounded hover:bg-gray-200 transition-colors" disabled>
            <svg
              className="w-4 h-4 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
              />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-50 overflow-auto relative">
          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 transition-opacity duration-300">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600 mx-auto mb-3"></div>
                <p className="text-gray-600 text-sm">Loading content...</p>
              </div>
            </div>
          )}

          {/* Content with subtle entrance animation */}
          <div
            className={`h-full bg-white transition-opacity duration-700 ${
              isLoading ? "opacity-50" : "opacity-100"
            }`}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
