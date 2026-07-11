import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body('name') name: string) {
    return this.usersService.create(name);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
