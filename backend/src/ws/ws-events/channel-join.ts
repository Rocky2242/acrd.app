import Channels from '../../data/channels';
import { WS } from '../../types/ws';
import Deps from '../../utils/deps';
import { WSGuard } from '../modules/ws-guard';
import { WSEvent } from './ws-event';
import { WebSocket } from '../websocket';
import { Socket } from 'socket.io';
import { VoiceService } from '../../voice/voice-service';
import Users from '../../data/users';
import { validateUser } from '../../rest/modules/middleware';

export default class implements WSEvent<'CHANNEL_JOIN'> {
  on = 'CHANNEL_JOIN' as const;

  constructor(
    private channels = Deps.get<Channels>(Channels),
    private voice = Deps.get<VoiceService>(VoiceService),
    private users = Deps.get<Users>(Users),
  ) {}

  public async invoke(ws: WebSocket, client: Socket, { channelId }: WS.Params.ChannelJoin) {
    const channel = await this.channels.get(channelId);
    if (channel.type !== 'VOICE')
      throw new TypeError('You cannot join a non-voice channel');
    
    // TODO: validate can join
    const userId = ws.sessions.get(client.id);
    // join voice server
    const doesExist = channel.userIds.includes(userId); 
    if (doesExist)
      throw new TypeError('User already connected to voice');

    this.voice.add(channelId, { stream: null, userId });
    
    await client.join(channelId);
    await this.channels.joinVC(channel, userId);
    const user = await this.updateVoiceState(userId, channelId);

    ws.io
      .to(channel.guildId)
      .emit('CHANNEL_UPDATE', {
        channelId: channel.id,
        partialChannel: { userIds: channel.userIds },
      } as WS.Args.ChannelUpdate);

    ws.io
      .to(channel.id)
      .emit('VOICE_STATE_UPDATE', {
        userId: user.id,
        voice: user.voice,
      } as WS.Args.VoiceStateUpdate);
  }

  private async updateVoiceState(userId: string, channelId: string) {
    const user = await this.users.getSelf(userId);
    user.voice = { channelId };
    return await user.save();
  }
}