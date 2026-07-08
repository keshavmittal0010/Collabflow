import { apiFetch } from '@/services/auth.service'
import { ApiResponse } from '@/types/auth.types'
import { ChannelWithDetails, Message, Reaction } from '@/types/socket.types'
import { CreateChannelSchemaType, CreateMessageSchemaType } from '@/lib/validations'

export const ChatService = {
  /**
   * Create a new chat channel in a workspace
   */
  async createChannel(
    workspaceId: string,
    input: CreateChannelSchemaType
  ): Promise<ApiResponse<ChannelWithDetails>> {
    return apiFetch<ChannelWithDetails>(`/api/workspaces/${workspaceId}/channels`, {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * List all channels for a workspace that the user has access to
   */
  async listChannels(workspaceId: string): Promise<ApiResponse<ChannelWithDetails[]>> {
    return apiFetch<ChannelWithDetails[]>(`/api/workspaces/${workspaceId}/channels`, {
      method: 'GET'
    })
  },

  /**
   * List messages in a channel
   */
  async listMessages(channelId: string): Promise<ApiResponse<Message[]>> {
    return apiFetch<Message[]>(`/api/channels/${channelId}/messages`, {
      method: 'GET'
    })
  },

  /**
   * Send a chat message in a channel
   */
  async sendMessage(
    channelId: string,
    input: CreateMessageSchemaType
  ): Promise<ApiResponse<Message>> {
    return apiFetch<Message>(`/api/channels/${channelId}/messages`, {
      method: 'POST',
      body: input as any
    })
  },

  /**
   * Toggle emoji reaction on a message
   */
  async toggleReaction(
    messageId: string,
    emoji: string
  ): Promise<ApiResponse<Reaction[]>> {
    return apiFetch<Reaction[]>(`/api/messages/${messageId}/reactions`, {
      method: 'POST',
      body: { emoji } as any
    })
  }
}

export default ChatService
