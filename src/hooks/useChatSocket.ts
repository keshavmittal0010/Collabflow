'use client'

import { useEffect } from 'react'
import { getSocket } from '@/lib/socket'
import { useChatStore } from '@/store/chat.store'
import type { Message } from '@/types/socket.types'

interface UseChatSocketOptions {
  channelId: string | undefined
  enabled?: boolean
}

/**
 * useChatSocket — subscribes to real-time chat message feeds,
 * emoji reactions, and typing indicators for a specific chat channel.
 */
export function useChatSocket({ channelId, enabled = true }: UseChatSocketOptions) {
  const { addMessage, updateMessageReactions, setTyping } = useChatStore()

  useEffect(() => {
    if (!enabled || !channelId) return

    let s: any
    try {
      s = getSocket()
    } catch {
      return
    }

    const joinChannel = () => {
      s.emit('channel:join', { channelId })
    }

    // Join room now if socket is connected, or when it connects
    if (s.connected) {
      joinChannel()
    }
    s.on('connect', joinChannel)

    // ── Chat Event Handlers ──────────────────────────────────────────────────

    const onMessageNew = (message: Message) => {
      addMessage(message)
    }

    const onMessageReaction = (payload: { messageId: string; reactions: any[] }) => {
      updateMessageReactions(payload.messageId, payload.reactions)
    }

    const onMessageTyping = (payload: { channelId: string; userId: string; name: string; isTyping: boolean }) => {
      setTyping(payload.channelId, payload.userId, payload.name, payload.isTyping)
    }

    s.on('message:new', onMessageNew)
    s.on('message:reaction', onMessageReaction)
    s.on('message:typing', onMessageTyping)

    return () => {
      // Leave room
      if (s.connected) {
        s.emit('channel:leave', { channelId })
      }

      // Remove listeners
      s.off('connect', joinChannel)
      s.off('message:new', onMessageNew)
      s.off('message:reaction', onMessageReaction)
      s.off('message:typing', onMessageTyping)
    }
  }, [channelId, enabled, addMessage, updateMessageReactions, setTyping])
}

export default useChatSocket
