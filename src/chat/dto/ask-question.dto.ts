import { IsUUID, IsString, MinLength } from 'class-validator';

export class AskQuestionDto {
  @IsUUID()
  userId: string;

  @IsString()
  @MinLength(1)
  question: string;
}
