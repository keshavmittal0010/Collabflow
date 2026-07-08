import { create } from 'zustand'
import { ChannelWithDetails, Message } from '@/types/socket.types'

interface ChatState {
  channels: ChannelWithDetails[]
  activeChannel: ChannelWithDetails | null
  messages: Message[]
  activeThreadParent: Message | null
  threadMessages: Message[]
  typingUsers: Record<string, Array<{ userId: string; name: string }>>
  isLoading: boolean
  error: string | null

  // Actions
  setChannels: (channels: ChannelWithDetails[]) => void
  setActiveChannel: (channel: ChannelWithDetails | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessageReactions: (messageId: string, reactions: any[]) => void
  setTyping: (channelId: string, userId: string, name: string, isTyping: boolean) => void
  setActiveThreadParent: (message: Message | null) => void
  setThreadMessages: (messages: Message[]) => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  channels: [],
  activeChannel: null,
  messages: [],
  activeThreadParent: null,
  threadMessages: [],
  typingUsers: {},
  isLoading: false,
  error: null,

  setChannels: (channels) => set({ channels }),

  setActiveChannel: (channel) =>
    set({
      activeChannel: channel,
      messages: [],
      activeThreadParent: null,
      threadMessages: []
    }),

  setMessages: (messages) => set({ messages }),

  addMessage: (message) => {
    const { activeChannel, activeThreadParent } = get()
    if (message.channelId !== activeChannel?.id) return

    // If it's a thread reply
    if (message.parentId) {
      // Update thread messages if the open thread matches the parentId
      if (activeThreadParent?.id === message.parentId) {
        set((state) => ({
          threadMessages: [...state.threadMessages, message]
        }))
      }

      // Also update the parent message reply count in the main feed
      set((state) => ({
        messages: state.messages.map((m) => {
          if (m.id === message.parentId) {
            return {
              ...m,
              replies: m.replies ? [...m.replies, message] : [message],
              replyCount: (m.replyCount || 0) + 1
            }
          }
          return m
        })
      }))
    } else {
      // Top-level message, append to feed
      set((state) => ({
        messages: [...state.messages, message]
      }))
    }
  },

  updateMessageReactions: (messageId, reactions) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      ),
      activeThreadParent:
        state.activeThreadParent?.id === messageId
          ? { ...state.activeThreadParent, reactions }
          : state.activeThreadParent,
      threadMessages: state.threadMessages.map((m) =>
        m.id === messageId ? { ...m, reactions } : m
      )
    }))
  },

  setTyping: (channelId, userId, name, isTyping) => {
    set((state) => {
      const current = state.typingUsers[channelId] || []
      const next = isTyping
        ? current.some((u) => u.userId === userId)
          ? current
          : [...current, { userId, name }]
        : current.filter((u) => u.userId !== userId)

      return {
        typingUsers: {
          ...state.typingUsers,
          [channelId]: next
        }
      }
    })
  },

  setActiveThreadParent: (message) =>
    set({
      activeThreadParent: message,
      threadMessages: message?.replies || []
    }),

  setThreadMessages: (threadMessages) => set({ threadMessages }),

  clearChat: () =>
    set({
      channels: [],
      activeChannel: null,
      messages: [],
      activeThreadParent: null,
      threadMessages: [],
      typingUsers: {},
      error: null
    })
}))

export default useChatStore
