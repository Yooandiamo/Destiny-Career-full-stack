import React, { useState } from 'react';
import { X, Copy, Zap, CheckCircle, Search, ArrowDown, Scan, FileText, ClipboardCopy, Globe } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export const ShortcutGuide: React.FC<Props> = ({ onClose }) => {
  const [copied, setCopied] = useState(false);
  
  const baseUrl = window.location.origin + window.location.pathname;
  const shortcutActionUrl = `${baseUrl}?action=clipboard`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortcutActionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white z-10">
          <div className="flex items-center gap-2">
            <div className="bg-blue-100 p-2 rounded-full">
               <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-bold text-lg text-gray-900">设置 iOS 快捷指令</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto no-scrollbar flex-1 bg-gray-50/50">
            <div className="space-y-8">
              
              {/* Step 1: Copy URL */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                   <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">1</span>
                   <h3 className="font-bold text-gray-800">复制专属链接</h3>
                </div>
                <div className="bg-white border border-blue-200 rounded-xl p-3 flex gap-2 shadow-sm">
                  <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono truncate select-all">
                    {shortcutActionUrl}
                  </div>
                  <button 
                    onClick={copyToClipboard}
                    className={`px-3 py-1 rounded-lg font-bold text-xs transition-all flex-shrink-0 flex items-center gap-1 ${copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                  >
                    {copied ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>

              {/* Step 2: Create Shortcut (Hybrid: Visual + Instructions) */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                   <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">2</span>
                   <h3 className="font-bold text-gray-800">创建并添加动作</h3>
                </div>
                <p className="text-xs text-gray-500 ml-8 mb-1 leading-relaxed">
                   打开快捷指令 App，点击右上角 <span className="font-bold text-black">+</span> 号，依次添加以下 4 个动作：
                </p>
                
                {/* Dark Mode Container */}
                <div className="bg-[#1C1C1E] rounded-2xl overflow-hidden shadow-xl border border-gray-800 ring-1 ring-black/5 font-sans">
                    
                    {/* Action 1: Screenshot */}
                    <div className="relative border-b border-gray-700/50 group">
                        {/* Visual */}
                        <div className="p-3 flex items-center gap-3">
                            <div className="bg-[#3A3A3C] p-2 rounded-lg">
                                <Scan className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-white font-medium text-sm">截屏</span>
                        </div>
                        {/* Instruction */}
                        <div className="bg-[#2C2C2E] px-3 py-2 flex items-center gap-2 text-[10px] text-gray-400 border-t border-gray-700/30">
                            <Search className="w-3 h-3" />
                            <span>搜索 <span className="text-white font-bold bg-gray-600 px-1.5 py-0.5 rounded border border-gray-500">截屏</span> 并点击添加</span>
                        </div>
                    </div>

                    {/* Action 2: Extract Text */}
                    <div className="relative border-b border-gray-700/50 group">
                        {/* Visual */}
                        <div className="p-3 flex items-center gap-3">
                            <div className="bg-[#007AFF] p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-white text-sm font-medium flex flex-wrap items-center">
                                    <span>从</span> 
                                    <span className="text-[#007AFF] bg-[#323232] px-1.5 py-0.5 rounded-[6px] mx-1 flex items-center gap-1">
                                       <Scan className="w-3 h-3 opacity-50" /> 截屏
                                    </span> 
                                    <span>中提取文本</span>
                                </div>
                            </div>
                        </div>
                        {/* Instruction */}
                        <div className="bg-[#2C2C2E] px-3 py-2 space-y-1.5 border-t border-gray-700/30">
                            <div className="flex items-center gap-2 text-[10px] text-gray-400">
                                <Search className="w-3 h-3" />
                                <span>搜索 <span className="text-white font-bold bg-gray-600 px-1.5 py-0.5 rounded border border-gray-500">提取文本</span></span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-orange-400/90">
                                <ArrowDown className="w-3 h-3" />
                                <span>点击变量，确保选择 <b>截屏</b> (而非剪贴板)</span>
                            </div>
                        </div>
                    </div>

                    {/* Action 3: Copy to Clipboard */}
                    <div className="relative border-b border-gray-700/50 group">
                        {/* Visual */}
                        <div className="p-3 flex items-center gap-3">
                            <div className="bg-[#007AFF] p-2 rounded-lg">
                                <ClipboardCopy className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="text-white text-sm font-medium flex flex-wrap items-center">
                                    <span>将</span>
                                    <span className="text-[#007AFF] bg-[#323232] px-1.5 py-0.5 rounded-[6px] mx-1 flex items-center gap-1">
                                       <FileText className="w-3 h-3 opacity-50" /> 图像中的文本
                                    </span>
                                    <span>拷贝至剪贴板</span>
                                </div>
                            </div>
                        </div>
                        {/* Instruction */}
                        <div className="bg-[#2C2C2E] px-3 py-2 flex items-center gap-2 text-[10px] text-gray-400 border-t border-gray-700/30">
                            <Search className="w-3 h-3" />
                            <span>搜索 <span className="text-white font-bold bg-gray-600 px-1.5 py-0.5 rounded border border-gray-500">拷贝至剪贴板</span></span>
                        </div>
                    </div>

                    {/* Action 4: Open URL */}
                    <div className="relative group">
                        {/* Visual */}
                        <div className="p-3 flex items-center gap-3">
                            <div className="bg-[#007AFF] p-2 rounded-lg">
                                <Globe className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <div className="text-white text-sm font-medium mb-1 flex items-center gap-2">
                                    <span>打开</span>
                                    <span className="text-[#007AFF]">URL</span>
                                </div>
                                <div className="text-[#007AFF] text-[10px] bg-[#323232] p-2 rounded-[6px] truncate border border-[#007AFF]/30 opacity-80 font-mono">
                                    {shortcutActionUrl}
                                </div>
                            </div>
                        </div>
                        {/* Instruction */}
                        <div className="bg-[#2C2C2E] px-3 py-2 flex items-center gap-2 text-[10px] text-gray-400 border-t border-gray-700/30">
                            <Search className="w-3 h-3" />
                            <span>搜索 <span className="text-white font-bold bg-gray-600 px-1.5 py-0.5 rounded border border-gray-500">打开 URL</span> 并粘贴链接</span>
                        </div>
                    </div>

                </div>
              </div>

              {/* Step 3: Back Tap */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                   <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">3</span>
                   <h3 className="font-bold text-gray-800">设置敲一敲</h3>
                </div>
                <div className="bg-white p-4 rounded-xl text-xs text-gray-600 space-y-1.5 leading-relaxed border border-gray-200 shadow-sm">
                    <p>1. 打开 iPhone <b>设置</b> &gt; <b>辅助功能</b>。</p>
                    <p>2. 点击 <b>触控</b> &gt; 滑到底部 <b>轻点背面</b>。</p>
                    <p>3. 选择 <b>轻点两下</b> &gt; 在列表中勾选刚才新建的快捷指令。</p>
                </div>
              </div>

            </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-white">
          <button onClick={onClose} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-black transition-colors shadow-lg active:scale-95">
            设置完成，去试试！
          </button>
        </div>
      </div>
    </div>
  );
};