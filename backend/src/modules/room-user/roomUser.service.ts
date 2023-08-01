import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RoomUser } from './roomUser.entity';
import { RoomUserRepository } from './roomUser.repository';
import { Room } from '../room/room.entity';
import { RedisService } from '../redis/redis.service';
import { expireTimeOneDay } from 'src/common/variables/constVariable';

@Injectable()
export class RoomUserService {
  constructor(
    private roomUserRepository: RoomUserRepository,
    private redisService: RedisService,
  ) { }

  async createNewRoomUser(room_id: number, user_id: number): Promise<RoomUser> {
    const roomUser: RoomUser = await this.roomUserRepository.findOne({
      where: {
        room_id,
        user_id,
      },
    });

    if (roomUser) {
      await this.deleteRoomUser(room_id, user_id);
    }

    return await this.roomUserRepository.save({
      room_id,
      user_id,
    });
  }

  async deleteRoomUser(room_id: number, user_id: number) {
    const participant: RoomUser = await this.roomUserRepository.getParticipant(
      room_id,
      user_id,
    );

    if (!participant) {
      throw new HttpException('Not found user', HttpStatus.NOT_FOUND);
    }

    return await this.roomUserRepository.delete({
      room_id,
      user_id,
    });
  }

  async getListUserOfRoom(room: Room): Promise<Array<Participant>> {
    const users = await this.roomUserRepository.getParticipantsOfRoom(room.id);
    const result: Array<Participant> = users.map((user: any, index: number) => {
      user = { ...user, ...user.user };
      delete user.user;

      return {
        ...user,
        is_host: user.id === room.host_id,
        is_painter: index === 0,
        is_next_painter: false,
      };
    });

    return result;
  }

  async checkUserInRoom(user_id: number, room_id: number): Promise<boolean> {
    const participant = await this.roomUserRepository.findOne({
      where: {
        room_id,
        user_id,
      },
    });

    return !!participant;
  }

  async getUserInRoomRandom(roomId: number): Promise<number> {
    const participant: RoomUser = await this.roomUserRepository.findOne({
      where: {
        room_id: roomId,
      },
    });

    return participant ? participant.user_id : null;
  }

  async assignPainterAndNextPainter(room: Room): Promise<PainterRound> {
    let participants: Array<Participant> = await this.getListUserOfRoom(room);
    const paintersOfPreviousRound = await this.redisService.getObjectByKey(`${room.id}:PAINTERS`);
    const drewPainters: Array<number> = paintersOfPreviousRound ? paintersOfPreviousRound.drewPainters : [];
    const currentPainter = paintersOfPreviousRound ? paintersOfPreviousRound.nextPainter : null;
    let notDrewPainters: Array<Participant> = participants;

    // Find painter
    let painterId = currentPainter; 
    if (drewPainters.length === 0 && !painterId) {
      const painterIndex: number = Math.floor(Math.random() * notDrewPainters.length);
      painterId = notDrewPainters[painterIndex].id;
    }

    drewPainters.push(painterId); 
    let participantsNextPainter: Array<Participant> = notDrewPainters.filter(
      (participant: Participant) => !drewPainters.includes(participant.id),
    );

    if(participantsNextPainter.length === 0) {
      await this.resetCachePainterForRoom(room.id, currentPainter);
      participantsNextPainter = participants.filter((participant: Participant) => participant.id !== painterId);
    } 

    const nextPainterIndex = Math.floor(Math.random() * participantsNextPainter.length);
    const nextPainterId = participantsNextPainter[nextPainterIndex].id;
    
    return {
      painter: painterId, 
      next_painter: nextPainterId, 
    } as PainterRound;
  }

  async cachePainterForRoom(roomId: number, painter: number, nextPainter: number) {
    let paintersOfPreviousRound = await this.redisService.getObjectByKey(`${roomId}:PAINTERS`);

    let drewPainters = paintersOfPreviousRound ? paintersOfPreviousRound.drewPainters : [];
    drewPainters.push(painter);
    
    await this.redisService.setObjectByKeyValue(`${roomId}:PAINTERS`, {
      drewPainters,
      nextPainter: nextPainter,
    }, expireTimeOneDay);
  }

  async resetCachePainterForRoom(roomId: number, nextPainter: number) {
    await this.redisService.setObjectByKeyValue(`${roomId}:PAINTERS`, {
      drewPainters: [],
      nextPainter: nextPainter,
    }, expireTimeOneDay);
  }

  async deleteCachePainterAndNextPainterForRoom(roomId: number) {
    return await this.redisService.deleteObjectByKey(`${roomId}:PAINTERS`);
  }

  async updateRoomUserScore(userId: number, score: number) {
    return this.roomUserRepository.update({ user_id: userId }, { score });
  }

  async resetRoomUsersScore(room: Room) {
    const participants: Array<Participant> = await this.getListUserOfRoom(room);
    if (participants.length === 0) return;
    await Promise.all(
      participants.map((participant) =>
        this.roomUserRepository.update(
          { user_id: participant.id },
          { score: 0 },
        ),
      ),
    );
  }
}
