"use client";

import * as React from "react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import {
  Bot,
  Brain,
  Code2,
  Loader2,
  MessageSquare,
  Paperclip,
  Plus,
  Send,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ModuleHeader, EmptyState } from "@/components/module-common";
import { toast } from "@/hooks/use-toast";
import type { AiMessage, AiSession } from "@/lib/types";
import { cn } from "@/lib/utils";

const MODELS = [
  { value: "gemini-default", label: "Gemini (default)" },
  { value: "openrouter-auto", label: "OpenRouter Auto" },
];

const QUICK_PROMPTS = [
  "Explain a 401 error",
  "Debug my webhook",
  "Why is my test failing?",
  "Generate a contacts POST example",
];

interface ChatResponse {
  sessionId: string;
  message: string;
  role: "assistant";
  timestamp: string;
  tokenUsage: number;
  model: string;
}

export function AiDebuggerModule() {
  const [sessions, setSessions] = React.useState<AiSession[]>([]);
  const [loadingSessions, setLoadingSessions] = React.useState(true);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [model, setModel] = React.useState("gemini-default");
  const [input, setInput] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [contextOpen, setContextOpen] = React.useState(false);
  const [contextText, setContextText] = React.useState("");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const active = sessions.find((s) => s.id === activeId) ?? null;
  const messages = active?.messages ?? [];

  // Auto-grow textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  // Auto-scroll to bottom on new messages
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  const loadSessions = React.useCallback(async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch("/api/ai-debugger/sessions");
      const json = await res.json();
      if (json.success) {
        const list = json.data as AiSession[];
        setSessions(list);
        // Keep activeId if still in list, else pick first
        if (activeId && list.some((s) => s.id === activeId)) {
          // no change
        } else if (list.length > 0) {
          setActiveId(list[0].id);
        } else {
          setActiveId(null);
        }
      }
    } finally {
      setLoadingSessions(false);
    }
  }, [activeId]);

  React.useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  async function handleNewSession() {
    try {
      const res = await fetch("/api/ai-debugger/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Debug Session", model }),
      });
      const json = await res.json();
      if (json.success) {
        const s = json.data as AiSession;
        setSessions((prev) => [s, ...prev]);
        setActiveId(s.id);
        setInput("");
        toast({ title: "Session created", description: s.title });
      } else {
        toast({
          title: "Error",
          description: json.error,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Network error",
        variant: "destructive",
      });
    }
  }

  async function handleDeleteSession(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/ai-debugger/sessions/${id}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        setSessions((prev) => prev.filter((s) => s.id !== id));
        if (activeId === id) setActiveId(null);
        toast({ title: "Session deleted" });
      } else {
        toast({
          title: "Delete failed",
          description: json.error,
          variant: "destructive",
        });
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    // Parse optional context
    let context: unknown = undefined;
    if (contextText.trim()) {
      try {
        context = JSON.parse(contextText);
      } catch {
        toast({
          title: "Invalid context JSON",
          description: "Context will be ignored until fixed.",
          variant: "destructive",
        });
        setContextOpen(true);
        return;
      }
    }

    // Optimistic: append user message locally
    const nowIso = new Date().toISOString();
    const optimisticUser: AiMessage = { role: "user", content: text, timestamp: nowIso };
    let sessionId = activeId;
    if (!sessionId) {
      // Create a placeholder session; real ID will come from response
      const placeholderId = `tmp-${Date.now()}`;
      const placeholderSession: AiSession = {
        id: placeholderId,
        title: text.slice(0, 60),
        model,
        messages: [optimisticUser],
        tokenUsage: 0,
        context: null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setSessions((prev) => [placeholderSession, ...prev]);
      setActiveId(placeholderId);
      sessionId = placeholderId;
    } else {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId
            ? {
                ...s,
                messages: [...s.messages, optimisticUser],
                updatedAt: nowIso,
              }
            : s,
        ),
      );
    }

    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai-debugger/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId?.startsWith("tmp-") ? undefined : sessionId,
          message: text,
          context,
          model,
        }),
      });
      const json = await res.json();
      if (json.success) {
        const data = json.data as ChatResponse;
        const assistantMsg: AiMessage = {
          role: "assistant",
          content: data.message,
          timestamp: data.timestamp,
        };
        setSessions((prev) => {
          // Replace placeholder with real session if needed
          let foundPlaceholder = false;
          const updated = prev.map((s) => {
            if (s.id === sessionId && String(s.id).startsWith("tmp-")) {
              foundPlaceholder = true;
              return {
                ...s,
                id: data.sessionId,
                title: text.slice(0, 60),
                messages: [...s.messages, assistantMsg],
                tokenUsage: s.tokenUsage + data.tokenUsage,
                model: data.model,
                updatedAt: data.timestamp,
              } as AiSession;
            }
            if (s.id === sessionId) {
              return {
                ...s,
                messages: [...s.messages, assistantMsg],
                tokenUsage: s.tokenUsage + data.tokenUsage,
                model: data.model,
                updatedAt: data.timestamp,
              } as AiSession;
            }
            return s;
          });
          if (foundPlaceholder && activeId === sessionId) {
            setActiveId(data.sessionId);
          }
          return updated;
        });
        // Refresh session list to keep ordering accurate
        setTimeout(loadSessions, 200);
      } else {
        toast({
          title: "AI request failed",
          description: json.error,
          variant: "destructive",
        });
        // Roll back the optimistic user message
        setSessions((prev) =>
          prev.map((s) =>
            s.id === sessionId
              ? { ...s, messages: s.messages.slice(0, -1) }
              : s,
          ),
        );
      }
    } catch (e) {
      toast({
        title: "Network error",
        description: e instanceof Error ? e.message : "Could not reach server",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
    textareaRef.current?.focus();
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="AI Debugger"
        description="Ask an AI assistant about GHL API errors, webhook payloads, and automation failures."
        icon={<Brain className="h-5 w-5" />}
        actions={
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-[180px]" aria-label="Model">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
        {/* Sessions sidebar */}
        <Card className="flex flex-col">
          <CardContent className="flex flex-1 flex-col gap-3 p-3">
            <Button onClick={handleNewSession} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> New Session
            </Button>
            <div className="max-h-[60vh] flex-1 space-y-1 overflow-y-auto custom-scroll">
              {loadingSessions ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full" />
                  ))}
                </div>
              ) : sessions.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-muted-foreground">
                  No sessions yet. Start a conversation.
                </p>
              ) : (
                sessions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    className={cn(
                      "group flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors",
                      activeId === s.id
                        ? "border-primary/40 bg-primary/5"
                        : "border-transparent hover:bg-muted/60",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {s.title || "Untitled session"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(s.id);
                        }}
                        disabled={deletingId === s.id}
                        className="text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                        aria-label="Delete session"
                      >
                        {deletingId === s.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Badge variant="outline" className="text-[9px]">
                        {s.messages.length} msgs
                      </Badge>
                      <span className="truncate">
                        {formatDistanceToNow(new Date(s.updatedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="flex flex-col">
          {!active ? (
            <CardContent className="flex flex-1 items-center justify-center p-6">
              <EmptyState
                icon={<Sparkles className="h-6 w-6" />}
                title="Welcome to the AI Debugger"
                description="This assistant helps you understand GHL API errors, debug webhook payloads, and craft corrected requests. Create a new session or click a quick prompt to start."
                action={
                  <Button onClick={handleNewSession} className="gap-2">
                    <Plus className="h-4 w-4" /> Start a Session
                  </Button>
                }
              />
            </CardContent>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{active.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Model: <span className="font-mono">{active.model}</span> ·{" "}
                    Tokens: {active.tokenUsage}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {active.messages.length} messages
                </Badge>
              </div>

              {/* Messages */}
              <div className="max-h-[52vh] flex-1 space-y-4 overflow-y-auto custom-scroll p-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Ready to debug</p>
                      <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                        Describe the issue you're seeing, paste an error
                        response, or pick a quick prompt below.
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      {QUICK_PROMPTS.map((p) => (
                        <Button
                          key={p}
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleQuickPrompt(p)}
                        >
                          {p}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => (
                  <MessageBubble key={i} message={m} />
                ))}
                {sending && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick prompts */}
              <div className="flex flex-wrap gap-1.5 border-t px-3 pt-2.5">
                {QUICK_PROMPTS.map((p) => (
                  <Button
                    key={p}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => handleQuickPrompt(p)}
                  >
                    {p}
                  </Button>
                ))}
              </div>

              {/* Context panel */}
              <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
                <div className="flex items-center gap-2 px-3 pt-2">
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-2 text-[11px] text-muted-foreground"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      {contextOpen ? "Hide context" : "Attach context"}
                    </Button>
                  </CollapsibleTrigger>
                  {contextText.trim() && (
                    <Badge variant="secondary" className="text-[10px]">
                      Context attached
                    </Badge>
                  )}
                </div>
                <CollapsibleContent className="px-3 pb-2 pt-1">
                  <Textarea
                    value={contextText}
                    onChange={(e) => setContextText(e.target.value)}
                    placeholder='Attach JSON context — e.g. an error response, webhook payload, or assertion failure: {"statusCode": 401, ...}'
                    className="min-h-[80px] font-mono text-xs"
                    aria-label="Optional context JSON"
                  />
                </CollapsibleContent>
              </Collapsible>

              {/* Input */}
              <div className="flex items-end gap-2 border-t p-3">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about a GHL error, webhook, or test failure... (Enter to send, Shift+Enter for newline)"
                  className="min-h-[44px] resize-none text-sm"
                  aria-label="Message input"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="gap-2"
                  aria-label="Send message"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Send
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================================
// Sub-components
// ============================================================

function MessageBubble({ message }: { message: AiMessage }) {
  const isUser = message.role === "user";
  return (
    <div
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[85%] space-y-1 rounded-lg px-3 py-2 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground",
        )}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none dark:prose-invert [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[11px] [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2 [&_pre]:text-[11px]">
            <ReactMarkdown
              components={{
                a: ({ children, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    {children}
                  </a>
                ),
                code: ({ className, children, ...props }) => {
                  const isBlock = /language-/.test(className ?? "");
                  if (isBlock) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <div
          className={cn(
            "flex items-center gap-1 text-[10px]",
            isUser ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {isUser ? (
            <User className="h-2.5 w-2.5" />
          ) : (
            <Code2 className="h-2.5 w-2.5" />
          )}
          {formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })}
        </div>
      </div>
      {isUser && (
        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bot className="h-4 w-4" />
      </div>
      <div className="flex items-center gap-1 rounded-lg bg-muted px-3 py-2.5">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
        <span className="ml-1 text-[10px] text-muted-foreground">Thinking...</span>
      </div>
    </div>
  );
}
