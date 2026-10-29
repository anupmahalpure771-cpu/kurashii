import React, { useState } from 'react';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { querySearchGrounding, GroundingSource, SearchGroundingResult } from './searchGroundingApi';
import { useWorkspace } from '../../workspace/useWorkspace';
import { useAuth } from '../../auth/AuthProvider';
import { createNote } from '../notes/api';
import {
  Globe,
  Search,
  Sparkles,
  ExternalLink,
  BookOpen,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  BookmarkPlus,
} from 'lucide-react';

interface SearchGroundingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  context?: string;
}

const PRESET_QUERIES = [
  'Latest science on 10,000 daily steps health benefits',
  'Current USD to INR exchange rate and currency trends',
  'Deep work techniques for high-output engineering teams',
  'Proven strategies to achieve 99.9% uptime for cloud apps',
];

export const SearchGroundingModal: React.FC<SearchGroundingModalProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  context,
}) => {
  const { workspace } = useWorkspace();
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchGroundingResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Sync initial query if passed
  React.useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchPrompt?: string) => {
    const q = (searchPrompt || query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setCopied(false);
    setSavedToNotes(false);

    try {
      const data = await querySearchGrounding(q, context);
      setResult(data);
    } catch (err: any) {
      setError(
        err.message || 'Unable to connect to Google Search Grounding service.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.text) return;
    navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToNotes = async () => {
    if (!user || !result?.text) return;
    setSavingNote(true);

    try {
      let contentWithSources = result.text;
      if (result.sources && result.sources.length > 0) {
        contentWithSources += '\n\n### Web Sources (Google Search Grounding):\n';
        result.sources.forEach((s) => {
          contentWithSources += `- [${s.title}](${s.uri})\n`;
        });
      }

      await createNote(user.uid, {
        workspace,
        title: `Research: ${query.slice(0, 50)}...`,
        content: contentWithSources,
        category: workspace === 'personal' ? 'Knowledge' : 'Research',
        tags: ['google-grounding', 'research'],
      });

      setSavedToNotes(true);
    } catch (e: any) {
      setError(e.message || 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Web Intelligence & Search Grounding"
      size="lg"
    >
      <div className="space-y-4">
        {/* Intro Banner */}
        <div className="p-3 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-xl border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5">
            <Globe className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-blue-900 dark:text-blue-200 block">
              Grounded with Real-Time Google Search
            </span>
            <span className="text-blue-700 dark:text-blue-300">
              Powered by gemini-3.8-flash with Google Search grounding tool to provide real-time, accurate facts, sources, and verified links.
            </span>
          </div>
        </div>

        {/* Search Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything or research live data (e.g. market rates, fitness science, technical guides)..."
              className="w-full h-11 pl-9 pr-3 text-xs sm:text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-ink)]"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !query.trim()}
            className="h-11 px-5 rounded-xl font-semibold gap-1.5 shrink-0"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Searching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Search</span>
              </>
            )}
          </Button>
        </form>

        {/* Quick Suggestion Chips */}
        {!result && !loading && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Try asking:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_QUERIES.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setQuery(preset);
                    handleSearch(preset);
                  }}
                  className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 text-left transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full border-2 border-blue-200 dark:border-blue-900 border-t-blue-600 animate-spin" />
              <Globe className="w-4 h-4 text-blue-600 absolute inset-0 m-auto" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Grounding with Google Search...
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Retrieving live web information and verifying sources with gemini-3.8-flash
              </p>
            </div>
          </div>
        )}

        {/* Result Container */}
        {result && !loading && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Search Queries Used */}
            {result.searchQueries && result.searchQueries.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-400 uppercase tracking-wider">
                  Search queries:
                </span>
                {result.searchQueries.map((sq, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono"
                  >
                    "{sq}"
                  </span>
                ))}
              </div>
            )}

            {/* Grounded Content */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Grounded Intelligence
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveToNotes}
                    disabled={savingNote || savedToNotes}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {savedToNotes ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Saved to Notes</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="w-3.5 h-3.5" />
                        <span>{savingNote ? 'Saving...' : 'Save to Notes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {result.text}
              </div>
            </div>

            {/* Verified Web Sources / Citations */}
            {result.sources && result.sources.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                  Verified Google Search Sources ({result.sources.length})
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {result.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex items-center justify-between gap-2 group text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 line-clamp-1">
                          {src.title}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {src.uri.replace(/^https?:\/\//, '').split('/')[0]}
                        </span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};
