import {
    WebSocketGateway,
    WebSocketServer,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as admin from 'firebase-admin';

@WebSocketGateway({
    cors: {
        origin: [
            'https://quinielaapp-d8fed.firebaseapp.com',
            'https://quinielaapp-d8fed.web.app',
            'http://localhost:5173',
            'http://localhost:4173',
        ],
        credentials: true,
    },
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;
    private logger: Logger = new Logger('EventsGateway');

    afterInit(server: Server) {
        this.logger.log('WebSocket Gateway initialized');
    }

    async handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
            if (!token) {
                this.logger.warn(`Client ${client.id} rejected: no token`);
                client.disconnect(true);
                return;
            }

            const decoded = await admin.auth().verifyIdToken(token);
            (client as any).user = decoded;
            this.logger.log(`Client connected: ${client.id} (${decoded.email})`);
        } catch (error) {
            this.logger.warn(`Client ${client.id} rejected: invalid token`);
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    emitMatchUpdate(weekId: string, matchId: string, payload: any) {
        this.server.emit('match_updated', { weekId, matchId, ...payload });
    }
}

