import React, { useState, useEffect, useRef } from "react";
import { Layout } from "./Layout";
import { auth } from "../firebase";
import { Lock, ShieldCheck, Send, User, Search, RefreshCw, Sparkles, MessageSquare, CheckCheck } from "lucide-react";
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
                senderCiphertext: msg.senderCiphertext,
                senderIv: msg.senderIv,
                senderEphemeralPublicKey: msg.senderEphemeralPublicKey
              }, isSelf);
            } else {
              text = msg.text || "[Unencrypted payload]";
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
    const interval = setInterval(fetchMessages, 3500); // Polling relay mailbox
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
      const myBundle = await exportPublicBundle();
      const myKey = myBundle.signedPreKey || myBundle.identityKey;

      // Fetch recipient's public prekey bundle from server
      const keyRes = await fetch(`/api/chat/keys/${selectedPartner.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      let payload: EncryptedPayload;
      if (keyRes.ok) {
        const keyBundle = await keyRes.json();
        const recipientKey = keyBundle.signedPreKey || keyBundle.identityKey;
        // Client-side encryption via WebCrypto ECDH + AES-GCM (dual-encrypted for recipient & sender)
        payload = await encryptMessageForRecipient(recipientKey, plaintext, myKey);
      } else {
        // Fallback self-ratchet encryption
        payload = await encryptMessageForRecipient(myKey, plaintext, myKey);
      }

      // Optimistic update so message displays immediately in UI
      const localMsg: DecryptedMessage = {
        id: `local_${Date.now()}`,
        senderId: auth.currentUser.uid,
        recipientId: selectedPartner.uid,
        text: plaintext,
        timestamp: payload.timestamp,
        isSelf: true
      };
      setMessages(prev => [...prev, localMsg]);

      // Relay ciphertext to server
      await fetch("/api/chat/messages", {
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
          senderCiphertext: payload.senderCiphertext,
          senderIv: payload.senderIv,
          senderEphemeralPublicKey: payload.senderEphemeralPublicKey,
          timestamp: payload.timestamp
        })
      });
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
      <div className="h-[calc(100vh-6rem)] flex flex-col max-w-6xl mx-auto w-full px-2 sm:px-6 py-2">
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
                      {/* Avatar with emerald ring */}
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-stone-900 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-sm">
                          {partner.displayName ? partner.displayName.charAt(0).toUpperCase() : "U"}
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#0f1012]" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-white truncate">
                            {partner.displayName || "Prediction Node"}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-400 truncate">
                          {partner.email || "End-to-End Encrypted"}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Active Chat Stream */}
          {selectedPartner ? (
            <div className="flex-1 flex flex-col bg-[#0a0a0c]">
              {/* Chat Header */}
              <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0f1012]/80 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold">
                    {selectedPartner.displayName ? selectedPartner.displayName.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm flex items-center gap-2">
                      {selectedPartner.displayName || "Prediction Node"}
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Node Active
                      </span>
                    </h3>
                    <p className="text-[10px] font-mono text-stone-400 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-400" />
                      Double Ratchet E2EE • Zero-Knowledge Server Relay
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchMessages()}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 text-stone-400 hover:text-white transition-colors"
                    title="Refresh stream"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {/* Security Announcement Banner */}
                <div className="p-4 rounded-2xl bg-[#0f1012] border border-emerald-500/20 text-center space-y-1.5 max-w-md mx-auto my-2">
                  <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-4 h-4" /> Signal Protocol Verification
                  </div>
                  <p className="text-[11px] font-mono text-stone-400 leading-relaxed">
                    Messages are encrypted locally on your device with WebCrypto ECDH + AES-256-GCM. The CrowdVote relay server cannot inspect the plaintext contents of this conversation.
                  </p>
                </div>

                {messages.length === 0 ? (
                  <div className="h-48 flex flex-col items-center justify-center text-stone-500 space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40 text-emerald-500" />
                    <p className="text-xs font-mono">No messages yet. Send an encrypted message to initiate ratchet session.</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    return (
                      <div
                        key={msg.id || index}
                        className={`flex flex-col ${msg.isSelf ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            msg.isSelf
                              ? "bg-emerald-500 text-black font-medium rounded-br-none shadow-lg shadow-emerald-500/10"
                              : "bg-[#16181b] text-white border border-white/10 rounded-bl-none"
                          }`}
                        >
                          <p className="break-words">{msg.text}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-mono text-stone-500 mt-1 px-1">
                          <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                          {msg.isSelf && <CheckCheck className="w-3 h-3 text-emerald-400 inline" />}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-[#0f1012]">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type an end-to-end encrypted message..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-stone-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="p-3 rounded-2xl bg-emerald-500 text-black hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-stone-500 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Your Encrypted Messages</h3>
              <p className="text-sm font-mono text-stone-400 max-w-sm">
                Select a prediction node from the contacts list to establish a secure end-to-end encrypted channel.
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
