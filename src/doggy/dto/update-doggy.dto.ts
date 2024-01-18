import { PartialType } from '@nestjs/mapped-types';
import { CreateDoggyDto } from './create-doggy.dto';

export class UpdateDoggyDto extends PartialType(CreateDoggyDto) {}
