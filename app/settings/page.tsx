'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Key, Copy, Check, Trash2, Plus } from 'lucide-react';

interface ApiToken {
  id: string;
  name: string;
  token: string;
  createdAt: string;
  lastUsed: string | null;
}

export default function SettingsPage() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [newTokenName, setNewTokenName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 加载 tokens
  useEffect(() => {
    fetchTokens();
  }, []);

  async function fetchTokens() {
    try {
      const res = await fetch('/api/tokens');
      const data = await res.json();
      setTokens(data.tokens || []);
    } catch (e) {
      console.error('Failed to fetch tokens:', e);
    } finally {
      setLoading(false);
    }
  }

  async function createToken() {
    if (creating) return;
    setCreating(true);
    
    try {
      const res = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTokenName || 'Default' }),
      });
      
      if (res.ok) {
        setNewTokenName('');
        fetchTokens();
      }
    } catch (e) {
      console.error('Failed to create token:', e);
    } finally {
      setCreating(false);
    }
  }

  async function deleteToken(id: string) {
    if (!confirm('确定要删除这个 Token 吗？')) return;
    
    try {
      await fetch(`/api/tokens?id=${id}`, { method: 'DELETE' });
      fetchTokens();
    } catch (e) {
      console.error('Failed to delete token:', e);
    }
  }

  function copyToken(token: string, id: string) {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return <div className="p-8 text-gray-400">加载中...</div>;
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#121212] border-b border-[#282828]">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="p-2 hover:bg-[#282828] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">设置</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* API Token Section */}
        <div className="bg-[#181818] rounded-xl border border-[#282828] overflow-hidden">
          <div className="p-6 border-b border-[#282828]">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Key size={20} className="text-emerald-500" />
              </div>
              <h2 className="text-lg font-semibold">API Tokens</h2>
            </div>
            <p className="text-sm text-[#b3b3b3]">
              创建 Token 后，复制到浏览器扩展中使用。扩展会使用此 Token 将推文保存到你的账户。
            </p>
          </div>
          
          {/* 创建新 Token */}
          <div className="p-6 border-b border-[#282828] bg-[#1a1a1a]">
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="Token 名称（可选，如：我的电脑）"
                value={newTokenName}
                onChange={(e) => setNewTokenName(e.target.value)}
                className="flex-1 px-4 py-3 bg-[#282828] border border-[#383838] rounded-lg text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                onClick={createToken}
                disabled={creating}
                className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#383838] disabled:text-[#666] rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                <Plus size={18} />
                {creating ? '创建中...' : '创建 Token'}
              </button>
            </div>
          </div>
          
          {/* Token 列表 */}
          <div className="divide-y divide-[#282828]">
            {tokens.length === 0 ? (
              <div className="text-center text-[#666] py-12">
                <Key size={40} className="mx-auto mb-3 opacity-30" />
                <p>还没有 Token</p>
                <p className="text-sm mt-1">点击上方按钮创建一个</p>
              </div>
            ) : (
              tokens.map((t) => (
                <div key={t.id} className="p-6 hover:bg-[#1a1a1a] transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-medium">{t.name}</span>
                      <div className="text-xs text-[#666] mt-1">
                        创建于 {new Date(t.createdAt).toLocaleDateString('zh-CN')}
                        {t.lastUsed && ` · 最后使用 ${new Date(t.lastUsed).toLocaleDateString('zh-CN')}`}
                      </div>
                    </div>
                    <button
                      onClick={() => deleteToken(t.id)}
                      className="p-2 text-[#666] hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-[#282828] px-3 py-2 rounded-lg font-mono text-[#b3b3b3] overflow-hidden text-ellipsis whitespace-nowrap">
                      {t.token}
                    </code>
                    <button
                      onClick={() => copyToken(t.token, t.id)}
                      className="px-4 py-2 bg-[#282828] hover:bg-[#383838] rounded-lg text-sm transition-colors flex items-center gap-2"
                    >
                      {copiedId === t.id ? (
                        <>
                          <Check size={14} className="text-emerald-500" />
                          <span className="text-emerald-500">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>复制</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-6 p-6 bg-[#181818] rounded-xl border border-[#282828]">
          <h3 className="font-semibold mb-3">📖 使用说明</h3>
          <ol className="text-sm text-[#b3b3b3] space-y-2 list-decimal list-inside">
            <li>点击「创建 Token」生成一个新的 API Token</li>
            <li>点击「复制」按钮复制 Token</li>
            <li>打开浏览器扩展，在设置中粘贴 Token 并保存</li>
            <li>现在扩展抓取的推文会自动保存到你的账户</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
