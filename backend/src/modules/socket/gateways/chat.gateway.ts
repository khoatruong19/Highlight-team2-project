import { SubscribeMessage, MessageBody, ConnectedSocket, WsException } from '@nestjs/websockets';
import { SocketGateway } from './socket.gateway';
import { expireTimeOneDay } from '../../../common/variables/constVariable';
import { checkTypeAnswer, extractIdRoom } from '../../../common/utils/helper';
import { ANSWER_APPROXIMATELY, ANSWER_CORRETLY, BLOCK_MESSAGE, CHAT_ROOM_CHANNEL, CHAT_ROOM_TYPE, JOIN_ROOM_CHANNEL, JOIN_ROOM_CONTENT, JOIN_ROOM_TYPE, LEAVE_ROOM_CHANNEL, LEAVE_ROOM_CONTENT, LEAVE_ROOM_TYPE, QUALIFY_TO_START_CHANNEL, SERVER_BLOCKED_MESSAGE_CONTENT } from '../constant';
import { SocketClient } from '../socket.class';
import { Chat } from '../types/chat';
import { MessageBodyType } from '../types/messageBody';
import { Room } from 'src/modules/room/room.entity';
import { errorsSocket } from 'src/common/errors/errorCode';
import { RoomRound } from 'src/modules/room-round/roomRound.entity';
import e from 'express';

export class ChatGateway extends SocketGateway {

  @SubscribeMessage(JOIN_ROOM_CHANNEL)
  async handleJoinRoom(
    @MessageBody() codeRoom: string,
    @ConnectedSocket() client: SocketClient,
  ) {
    try {
      let room: Room = await this.roomService.getRoomByCodeRoom(codeRoom);

      if (!room) {
        this.socketService.sendError(client, errorsSocket.ROOM_NOT_FOUND);
        throw new WsException(errorsSocket.ROOM_NOT_FOUND);
      }

      const isAvailableRoom: boolean = await this.roomService.checkRoomAvailability(room.code_room);

      if (!isAvailableRoom) {
        this.socketService.sendError(client, errorsSocket.ROOM_FULL);
        throw new WsException(errorsSocket.ROOM_FULL);
      }

      const participant = await this.roomService.joinRoom(room.id, client.user.id);

      if (!participant) {
        this.socketService.sendError(client, errorsSocket.CAN_NOT_JOIN);
        throw new WsException(errorsSocket.CAN_NOT_JOIN);
      }

      client.join(room.code_room);

      const messageContent: Chat = {
        user: client.user.nickname,
        type: JOIN_ROOM_TYPE,
        message: JOIN_ROOM_CONTENT,
      };
      this.server.in(codeRoom).emit(codeRoom, messageContent);

      room = await this.roomService.changeHost(room.code_room);

      await this.redisService.setObjectByKeyValue(`USER:${client.user.id}:ROOM`, room.code_room, expireTimeOneDay);
      await this.socketService.sendListParticipantsInRoom(this.server, room);

      const isPlayingRoom = await this.roomService.checkStartGame(room.id);
      if (!isPlayingRoom) {
        await this.socketService.checkAndEmitToHostRoom(this.server, room);
      }
    } catch (error) {
      this.logger.error(error);
    }
  }

  @SubscribeMessage(CHAT_ROOM_CHANNEL)
  async handleMessageChatBox(
    @MessageBody() msgBody: MessageBodyType,
    @ConnectedSocket() client: SocketClient,
  ) {
    try {
      const roomId = extractIdRoom(msgBody.codeRoom);
      const round: RoomRound = await this.roomRoundService.getRoundOfRoom(
        roomId,
      );
      const answerRound: string = round.word;
      const typeAnswer = checkTypeAnswer(answerRound.toLocaleUpperCase(), msgBody.message.toLocaleUpperCase());

      const messageContent: Chat = {
        user: client.user.nickname,
        type: CHAT_ROOM_TYPE,
        message: msgBody.message,
      };

      const ROOM_CHAT: string = `${msgBody.codeRoom}-chat`;

      if (typeAnswer === ANSWER_CORRETLY || typeAnswer === ANSWER_APPROXIMATELY) {
        messageContent.message = SERVER_BLOCKED_MESSAGE_CONTENT;
        messageContent.type = BLOCK_MESSAGE;
        messageContent.user = '';
        this.server.to(client.id).emit(ROOM_CHAT, messageContent)
        return;
      }

      this.server.in(msgBody.codeRoom).emit(ROOM_CHAT, messageContent)
    } catch (error) {
      this.logger.error(error);
    }
  }

  @SubscribeMessage(LEAVE_ROOM_CHANNEL)
  async handleLeaveRoom(
    @MessageBody() codeRoom: string,
    @ConnectedSocket() client: SocketClient,
  ) {
    try {
      let room: Room = await this.roomService.getRoomByCodeRoom(codeRoom);

      if (!room) {
        this.socketService.sendError(client, errorsSocket.ROOM_NOT_FOUND);
        throw new WsException(errorsSocket.ROOM_NOT_FOUND);
      }

      await Promise.all([
        this.redisService.deleteObjectByKey(`USER:${client.user.id}:ROOM`),
        this.roomUserService.deleteRoomUser(room.id, client.user.id),
      ]);

      const meesageContent: Chat = {
        user: client.user.nickname,
        type: LEAVE_ROOM_TYPE,
        message: LEAVE_ROOM_CONTENT,
      };

      client.leave(codeRoom);
      client.to(codeRoom).emit(`${codeRoom}-leave`, meesageContent);

      if (client.user.id === room.host_id) {
        room = await this.roomService.changeHost(codeRoom);
      }

      const isPlayingRoom = await this.roomService.checkStartGame(room.id);
      if (!isPlayingRoom) {
        await this.socketService.checkAndEmitToHostRoom(this.server, room);
      }

      await this.socketService.sendListParticipantsInRoom(this.server, room);
    } catch (error) {
      this.logger.error(error);
    }
  }
}
