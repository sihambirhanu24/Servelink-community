import {
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  RoomServiceClient,
  TokenVerifier,
} from 'livekit-server-sdk';
import axios from 'axios';

export type LiveKitRole = 'HOST' | 'VIEWER';

export interface IssuedLiveKitToken {
  token: string;
  serverUrl: string;
  roomName: string;
  role: LiveKitRole;
  expiresIn: number;
}

// LiveKit itself only tolerates a few seconds of skew on nbf/exp; anything
// beyond a minute means every token we mint will be rejected as "invalid token".
const CLOCK_SKEW_WARN_SECONDS = 60;
const MAX_TTL_SECONDS = 4 * 60 * 60;

@Injectable()
export class LiveKitService implements OnModuleInit {
  private readonly logger = new Logger(LiveKitService.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const url = this.readConfig('LIVEKIT_URL', 'livekitUrl');
    const apiKey = this.readConfig('LIVEKIT_API_KEY', 'livekitApiKey');
    const apiSecret = this.readConfig('LIVEKIT_API_SECRET', 'livekitApiSecret');

    if (!url || !apiKey || !apiSecret) {
      this.logger.warn(
        'LiveKit is not configured (LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET). Live sessions cannot be joined until they are set.',
      );
      return;
    }

    this.logger.log(
      `LiveKit configured: host=${this.hostOf(url)} apiKey=${this.keyPrefix(apiKey)} secret=set(${apiSecret.length} chars)`,
    );

    const skew = await this.measureClockSkewSeconds();
    if (skew === null) {
      this.logger.warn(
        'Could not reach the LiveKit server to check clock skew.',
      );
    } else if (Math.abs(skew) > CLOCK_SKEW_WARN_SECONDS) {
      this.logger.error(
        `This server's clock is ${this.describeSkew(skew)} relative to the LiveKit server. LiveKit will reject every token issued here as "invalid token" until the system clock is corrected.`,
      );
    } else {
      this.logger.log(`Clock skew vs LiveKit server: ${skew}s (ok)`);
    }
  }

  roomNameFor(sessionId: string) {
    return `live-session-${sessionId}`;
  }

  getServerUrl() {
    return this.requireConfig('LIVEKIT_URL', 'livekitUrl');
  }

  async createParticipantToken(params: {
    sessionId: string;
    identity: string;
    displayName: string;
    role: LiveKitRole;
    ttlSeconds: number;
  }): Promise<IssuedLiveKitToken> {
    const apiKey = this.requireConfig('LIVEKIT_API_KEY', 'livekitApiKey');
    const apiSecret = this.requireConfig(
      'LIVEKIT_API_SECRET',
      'livekitApiSecret',
    );
    const roomName = this.roomNameFor(params.sessionId);
    const isHost = params.role === 'HOST';
    const ttl = Math.max(60, Math.min(params.ttlSeconds, MAX_TTL_SECONDS));

    const at = new AccessToken(apiKey, apiSecret, {
      identity: params.identity,
      name: params.displayName,
      ttl,
      metadata: JSON.stringify({
        role: params.role,
        sessionId: params.sessionId,
      }),
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canSubscribe: true,
      canPublish: isHost,
      canPublishData: isHost,
      canUpdateOwnMetadata: isHost,
      roomAdmin: isHost,
      hidden: false,
    });

    const token = await at.toJwt();
    await this.assertTokenAccepted(token, {
      apiKey,
      apiSecret,
      roomName,
      identity: params.identity,
      role: params.role,
    });

    this.logger.log(
      `Issued ${params.role} LiveKit token: session=${params.sessionId} room=${roomName} identity=${params.identity} ttl=${ttl}s`,
    );

    return {
      token,
      serverUrl: this.getServerUrl(),
      roomName,
      role: params.role,
      expiresIn: ttl,
    };
  }

  async deleteRoom(sessionId: string) {
    const roomName = this.roomNameFor(sessionId);
    try {
      await this.roomClient().deleteRoom(roomName);
      this.logger.log(`Deleted LiveKit room ${roomName}`);
    } catch (error: unknown) {
      this.logger.warn(
        `LiveKit deleteRoom skipped for ${roomName}: ${this.errorMessage(error)}`,
      );
    }
  }

  async listParticipants(sessionId: string) {
    try {
      return await this.roomClient().listParticipants(
        this.roomNameFor(sessionId),
      );
    } catch (error: unknown) {
      this.logger.warn(
        `LiveKit listParticipants failed: ${this.errorMessage(error)}`,
      );
      return [];
    }
  }

  async removeParticipant(sessionId: string, identity: string) {
    await this.roomClient().removeParticipant(
      this.roomNameFor(sessionId),
      identity,
    );
    this.logger.log(
      `Removed participant ${identity} from session ${sessionId}`,
    );
  }

  async muteParticipant(
    sessionId: string,
    identity: string,
    trackSid: string,
    muted = true,
  ) {
    await this.roomClient().mutePublishedTrack(
      this.roomNameFor(sessionId),
      identity,
      trackSid,
      muted,
    );
  }

  /**
   * Self-test a freshly minted token before it reaches the browser.
   *
   * 1. Local verification proves the JWT is well-formed and carries the room /
   *    identity / roomJoin grant we intended.
   * 2. LiveKit's own `/rtc/validate` endpoint is the exact pre-flight the browser
   *    SDK performs before opening the signalling socket. Asking it here turns a
   *    vague client-side "invalid token" into an actionable server-side error
   *    (wrong secret, unknown key, or clock skew) without ever exposing the secret.
   */
  private async assertTokenAccepted(
    token: string,
    ctx: {
      apiKey: string;
      apiSecret: string;
      roomName: string;
      identity: string;
      role: LiveKitRole;
    },
  ) {
    const claims = await new TokenVerifier(ctx.apiKey, ctx.apiSecret)
      .verify(token)
      .catch((error: unknown) => {
        throw new InternalServerErrorException(
          `Generated LiveKit token failed local verification: ${this.errorMessage(error)}`,
        );
      });
    if (
      claims.sub !== ctx.identity ||
      claims.video?.room !== ctx.roomName ||
      claims.video?.roomJoin !== true
    ) {
      throw new InternalServerErrorException(
        'Generated LiveKit token does not carry the expected room/identity grants',
      );
    }

    const httpUrl = this.httpUrl(this.getServerUrl());
    let status: number;
    let body: string;
    let serverDate: string | undefined;
    try {
      const res = await axios.get<string>(`${httpUrl}/rtc/validate`, {
        params: { access_token: token },
        timeout: 5000,
        validateStatus: () => true,
        responseType: 'text',
        transformResponse: (data: unknown) =>
          typeof data === 'string' ? data : JSON.stringify(data),
      });
      status = res.status;
      body = (res.data || '').trim();
      serverDate =
        typeof res.headers?.date === 'string' ? res.headers.date : undefined;
    } catch (error: unknown) {
      // Network trouble reaching LiveKit is not proof the token is bad; let the
      // browser attempt the real connection and surface its own error.
      this.logger.warn(
        `Could not pre-validate LiveKit token against ${this.hostOf(httpUrl)}: ${this.errorMessage(error)}`,
      );
      return;
    }

    if (status >= 200 && status < 300) {
      return;
    }

    const hints: string[] = [];
    if (/invalid api key/i.test(body)) {
      hints.push(
        `LIVEKIT_API_KEY (${this.keyPrefix(ctx.apiKey)}) is not a key of the LiveKit project at ${this.hostOf(httpUrl)}`,
      );
    } else if (/invalid token/i.test(body)) {
      hints.push(
        'LIVEKIT_API_SECRET does not match LIVEKIT_API_KEY for this LiveKit project, or the token time window is wrong',
      );
    }
    const skew = serverDate ? this.skewFromDateHeader(serverDate) : null;
    if (skew !== null && Math.abs(skew) > CLOCK_SKEW_WARN_SECONDS) {
      hints.push(
        `this server's clock is ${this.describeSkew(skew)} relative to LiveKit, so nbf/exp are outside the valid window`,
      );
    }

    this.logger.error(
      `LiveKit rejected a freshly issued ${ctx.role} token for ${ctx.roomName} (HTTP ${status}: ${body || 'no body'}). ${hints.join('; ')}`,
    );
    throw new ServiceUnavailableException(
      `LiveKit rejected the generated token (${body || `HTTP ${status}`}). ${hints.length ? hints.join('. ') + '.' : 'Check the LiveKit configuration.'}`,
    );
  }

  private async measureClockSkewSeconds(): Promise<number | null> {
    try {
      const res = await axios.head(this.httpUrl(this.getServerUrl()), {
        timeout: 5000,
        validateStatus: () => true,
      });
      const date: unknown = res.headers?.date;
      return typeof date === 'string' ? this.skewFromDateHeader(date) : null;
    } catch {
      return null;
    }
  }

  private skewFromDateHeader(dateHeader: string): number | null {
    const serverMs = new Date(dateHeader).getTime();
    if (Number.isNaN(serverMs)) return null;
    return Math.round((Date.now() - serverMs) / 1000);
  }

  private describeSkew(skewSeconds: number) {
    const minutes = Math.round(Math.abs(skewSeconds) / 60);
    const direction = skewSeconds > 0 ? 'ahead' : 'behind';
    return minutes >= 1
      ? `${minutes} minute(s) ${direction}`
      : `${Math.abs(skewSeconds)}s ${direction}`;
  }

  private roomClient() {
    const url = this.httpUrl(this.getServerUrl());
    const apiKey = this.requireConfig('LIVEKIT_API_KEY', 'livekitApiKey');
    const apiSecret = this.requireConfig(
      'LIVEKIT_API_SECRET',
      'livekitApiSecret',
    );
    return new RoomServiceClient(url, apiKey, apiSecret);
  }

  private httpUrl(wsUrl: string) {
    return wsUrl
      .replace(/^wss:/, 'https:')
      .replace(/^ws:/, 'http:')
      .replace(/\/+$/, '');
  }

  private hostOf(url: string) {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  }

  private keyPrefix(apiKey: string) {
    return `${apiKey.slice(0, 6)}…`;
  }

  private errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  private readConfig(envName: string, configKey: string) {
    return (
      this.configService.get<string>(configKey) || process.env[envName] || ''
    );
  }

  private requireConfig(envName: string, configKey: string) {
    const value = this.readConfig(envName, configKey);
    if (!value) {
      throw new ServiceUnavailableException(
        'LiveKit is not configured. Set LIVEKIT_URL, LIVEKIT_API_KEY, and LIVEKIT_API_SECRET.',
      );
    }
    return value;
  }
}
