export default function RightSidebar() {
  return (
    <aside className="hidden lg:block fixed inset-y-0 right-0 w-80 bg-slate-50 border-l border-slate-200 px-6 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-slate-800 mb-4">Thông báo</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-600">Bạn chưa có thông báo mới.</p>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Trực tuyến (Websocket)</h2>
        <div className="flex flex-col gap-1">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition">
              <div className="relative">
                <div className="h-10 w-10 rounded-full bg-slate-200"></div>
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-slate-50"></div>
              </div>
              <p className="text-sm font-bold text-slate-700">Người dùng {item}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}