import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(@InjectRepository(User) private readonly userRepo: Repository<User>) {}

  @Post()
  create(@Body() dto: CreateUserDto) {
    const user = this.userRepo.create(dto);
    return this.userRepo.save(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userRepo.findOne({ where: { id } });
  }
}
