import { IsBooleanString, IsOptional, IsString, Length } from "class-validator";

export class InstitutionQuestionQueryDto {
  @IsOptional()
  @IsBooleanString()
  onlyPending?: string;
}

export class ReplyQuestionReqDto {
  @IsString()
  @Length(1, 2000)
  content!: string;
}

export interface QaQuestionDto {
  id: string;
  studentName: string;
  content: string;
  askedAt: string;
  replied: boolean;
  replyContent?: string;
  repliedAt?: string;
}
