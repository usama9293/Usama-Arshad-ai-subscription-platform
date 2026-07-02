import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatMessageRepository } from './repositories/chat-message.repository';
import { AskQuestionDto } from './dto/ask-question.dto';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMessageRepo: ChatMessageRepository,
  ) {}

  @Post('ask')
  ask(@Body() dto: AskQuestionDto) {
    return this.chatService.askQuestion(dto);
  }

  @Get('history/:userId')
  getHistory(@Param('userId') userId: string) {
    return this.chatMessageRepo.findByUser(userId);
  }
}
