import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { JwtAuthGuard } from '../identity/guards/jwt-auth.guard';
import { TagsService } from './tags.service';
import { Tag } from './domain/tag';
import { CreateTagDto } from './dto/create-tag.dto';
import { SearchTagsDto } from './dto/search-tags.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

export class TagResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;
}

function toTagResponse(tag: Tag): TagResponse {
  return {
    id: tag.id,
    name: tag.name,
  };
}

@Controller('tags')
@UseGuards(JwtAuthGuard)
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get('search')
  async search(@Query() query: SearchTagsDto): Promise<TagResponse[]> {
    const tags = query.q
      ? await this.tagsService.search(query.q)
      : await this.tagsService.findPopular(10);
    return tags.map(toTagResponse);
  }

  @Post()
  async create(@Body() dto: CreateTagDto): Promise<TagResponse> {
    const tag = await this.tagsService.create(dto.name);
    return toTagResponse(tag);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTagDto,
  ): Promise<TagResponse> {
    const tag = await this.tagsService.update(id, dto.name);
    return toTagResponse(tag);
  }
}
