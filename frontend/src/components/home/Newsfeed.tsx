import Image from "next/image";

export default function Newsfeed() {
  return (
    <div className="flex flex-col">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5 mb-8">
        <div className="flex gap-4">
          <div className="h-11 w-11 rounded-full bg-rose-100 flex-shrink-0"></div>
          <div className="flex-1">
            <textarea 
              placeholder="Bạn đang nghĩ gì thế?" 
              className="w-full bg-slate-50 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-rose-100 border border-slate-100 resize-none"
              rows={2}
            ></textarea>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pl-[60px]">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition font-medium text-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Ảnh / Video
            </button>
          </div>
          <button className="bg-rose-500 hover:bg-rose-600 text-white font-semibold px-6 py-2 rounded-xl transition shadow-md shadow-rose-200">
            Đăng bài
          </button>
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="h-11 w-11 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500"></div>
              <div>
                <h3 className="font-bold text-slate-900">Anna Nguyễn</h3>
                <p className="text-xs text-slate-500">Vừa xong</p>
              </div>
            </div>
            <button className="text-slate-400 hover:bg-slate-50 p-2 rounded-full">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/></svg>
            </button>
          </div>
          
          <p className="text-slate-800 mb-4 whitespace-pre-line text-[15px]">
            Vừa hoàn thiện chức năng Websocket cho app. Phản hồi mượt mà không độ trễ! Giao diện mới chuẩn bài luôn. 🚀✨
          </p>
          
          <div className="aspect-video w-full bg-slate-100 rounded-xl mb-4 border border-slate-200 overflow-hidden">
          </div>

          <div className="flex items-center gap-6 border-t border-slate-100 pt-3 text-slate-500 font-medium text-sm">
            <button className="flex items-center gap-2 hover:text-rose-500 transition group">
              <div className="p-2 rounded-full group-hover:bg-rose-50"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg></div>
              512 Thích
            </button>
            <button className="flex items-center gap-2 hover:text-blue-500 transition group">
              <div className="p-2 rounded-full group-hover:bg-blue-50"><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg></div>
              48 Bình luận
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}