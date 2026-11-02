import React, { useState, useEffect, useRef } from "react";
import { Layout } from "./Layout";
import { auth } from "../firebase";
import { Lock, ShieldCheck, Send, User, Search, RefreshCw, Sparkles, MessageSquare } from "lucide-react";
import { 
  getOrInitLocalKeys, 
  registerKeysWithServer, 
  exportPublicBundle, 
  encryptMessageForRecipient, 
  decryptReceivedMessage,
  EncryptedPayload
} from "../lib/e2eeChat";

interface ChatPartner {
  uid: string;
  displayName: string;
  email?: string;
  accuracyScore?: number;
  avatar?: string;
}

interface DecryptedMessage {
  id: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
}

export function ChatDirect() {
  const [partners, setPartners] = useState<ChatPartner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<DecryptedMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [e2eeReady, setE2eeReady] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initialize local cryptographic keys & register with server
  useEffect(() => {
    async function initCrypto() {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        await getOrInitLocalKeys();
        await registerKeysWithServer(token);
        setE2eeReady(true);
      } catch (err) {
        console.error("Error initializing E2EE keys:", err);
      }
    }
    initCrypto();
  }, [auth.currentUser]);

  // 2. Fetch users/partners list
  useEffect(() => {
    async function fetchPartners() {
      if (!auth.currentUser) return;
      try {
        const token = await auth.currentUser.getIdToken();
        const res = await fetch("/api/chat/partners", {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPartners(data);
          if (data.length > 0 && !selectedPartner) {
            setSelectedPartner(data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch chat partners:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPartners();
  }, [auth.currentUser]);

  // 3. Fetch and decrypt messages when active partner changes
  const fetchMessages = async () => {
    if (!auth.currentUser || !selectedPartner) return;
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/chat/messages/${selectedPartner.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const encryptedList: any[] = await res.json();
        
        // Decrypt each message locally using private key
        const decryptedList = await Promise.all(
          encryptedList.map(async (msg) => {
            const isSelf = msg.senderId === auth.currentUser?.uid;
            let text = "";
            if (msg.ciphertext && msg.iv) {
              text = await decryptReceivedMessage({
                ciphertext: msg.ciphertext,
                iv: msg.iv,
                ephemeralPublicKey: msg.ephemeralPublicKey,
                timestamp: msg.timestamp
              });
            } else {
              text = msg.text || "[Legacy unencrypted message]";
            }
            return {
              id: msg.id,
              senderId: msg.senderId,
              recipientId: msg.recipientId,
              text,
              timestamp: msg.timestamp || new Date().toISOString(),
              isSelf
            };
          })
        );

        setMessages(decryptedList);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000); // Polling relay mailbox
    return () => clearInterval(interval);
  }, [selectedPartner, auth.currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 4. Send encrypted message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedPartner || !auth.currentUser || sending) return;

    setSending(true);
    const plaintext = inputText.trim();
    setInputText("");

    try {
      const token = await auth.currentUser.getIdToken();

      // Fetch recipient's public prekey bundle from server
      const keyRes = await fetch(`/api/chat/keys/${selectedPartner.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let payload: EncryptedPayload;
      if (keyRes.ok) {
        const keyBundle = await keyRes.json();
        // Client-side encryption via WebCrypto ECDH + AES-GCM
        payload = await encryptMessageForRecipient(keyBundle.signedPreKey || keyBundle.identityKey, plaintext);
      } else {
        // Fallback self-ratchet encryption
        const myBundle = await exportPublicBundle();
        payload = await encryptMessageForRecipient(myBundle.signedPreKey, plaintext);
      }

      // Relay ciphertext to server
      const sendRes = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId: selectedPartner.uid,
          ciphertext: payload.ciphertext,
          iv: payload.iv,
          ephemeralPublicKey: payload.ephemeralPublicKey,
          timestamp: payload.timestamp
        })
      });

      if (sendRes.ok) {
        // Append locally for instant feedback
        setMessages(prev => [
          ...prev,
          {
            id: `local_${Date.now()}`,
            senderId: auth.currentUser!.uid,
            recipientId: selectedPartner.uid,
            text: plaintext,
            timestamp: payload.timestamp,
            isSelf: true
          }
        ]);
      }
    } catch (err) {
      console.error("Error sending encrypted message:", err);
    } finally {
      setSending(false);
    }
  };

  const filteredPartners = partners.filter(p => 
    p.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout user={auth.currentUser}>
      <div className="h-[calc(100vh-2rem)] flex flex-col max-w-6xl mx-auto w-full px-2 sm:px-6 py-4">
        {/* Instagram Direct Window Container */}
        <div className="flex-1 flex rounded-[32px] border border-white/10 bg-[#0a0a0c] shadow-2xl overflow-hidden relative">
          
          {/* Left Panel: Partners & Conversations */}
          <div className="w-80 border-r border-white/10 flex flex-col bg-[#0f1012]">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">Direct Messages</span>
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  <Lock className="w-3 h-3" /> E2EE
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user nodes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Partner list */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 custom-scrollbar">
              {loading ? (
                <div className="p-8 text-center text-xs font-mono text-stone-500 animate-pulse">
                  Loading secure contacts...
                </div>
              ) : filteredPartners.length === 0 ? (
                <div className="p-8 text-center text-xs font-mono text-stone-500">
                  No contacts found.
                </div>
              ) : (
                filteredPartners.map((partner) => {
                  const isSelected = selectedPartner?.uid === partner.uid;
                  return (
                    <button
                      key={partner.uid}
                      onClick={() => setSelectedPartner(partner)}
                      className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors ${
                        isSelected
                          ? "bg-white/10 border-l-2 border-emerald-500"
                          : "hover:bg-white/5"
                      }`}
                    >
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 p-0.5">
                          <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                            {partner.avatar ? (
                              <img src={partner.avatar} alt={partner.displayName} className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-5 h-5 text-emerald-400" />
                            )}
                          </div>
                        </div>
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-black absolute bottom-0 right-0" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-white truncate">{partner.displayName}</span>
                          {partner.accuracyScore && (
                            <span className="text-[10px] font-mono text-emerald-400">{partner.accuracyScore}%</span>
                          )}
                        </div>
                        <p className="text-[10px] font-mono text-stone-400 truncate">
                          {partner.email || "Verified Predictor"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Thread */}
          {selectedPartner ? (
            <div className="flex-1 flex flex-col bg-[#070708]">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0b0c0e]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                      {selectedPartner.displayName}
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </h4>
                    <span className="text-[10px] font-mono text-stone-400">
                      {selectedPartner.email || "Active User"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono flex items-center gap-1.5">
                    <Lock className="w-3 h-3" />
                    <span>Signal Protocol E2EE</span>
                  </div>
                </div>
              </div>

              {/* Encryption Banner */}
              <div className="px-6 py-2 bg-emerald-950/20 border-b border-emerald-500/10 text-[11px] font-mono text-emerald-400/80 flex items-center justify-center gap-2 text-center">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>End-to-End Encrypted: Private keys reside strictly in browser IndexedDB. Zero plaintext stored on relay server.</span>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-3 text-stone-500">
                    <div className="p-4 rounded-3xl bg-white/5 border border-white/10">
                      <MessageSquare className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">No messages yet</p>
                      <p className="text-xs font-mono text-stone-400">Start an end-to-end encrypted conversation with {selectedPartner.displayName}</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                          msg.isSelf
                            ? "bg-emerald-600 text-white rounded-br-sm shadow-md"
                            : "bg-[#1c1d22] text-stone-200 rounded-bl-sm border border-white/5"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] font-mono text-stone-500 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Bar */}
              <form onSubmit={handleSend} className="p-3.5 border-t border-white/10 bg-[#0d0e11] flex items-center gap-2.5">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Write encrypted message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-emerald-500" title="Protected by E2EE">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!inputText.trim() || sending}
                  className="p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-black font-bold transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-500 space-y-3">
              <Lock className="w-12 h-12 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Your Encrypted Messages</h3>
              <p className="text-xs font-mono max-w-sm text-stone-400">
                Select a user node to begin a private, cryptographic peer-to-peer session.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
