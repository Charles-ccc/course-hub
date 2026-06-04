import { IsString } from 'class-validator';

export class FaceVerifyDto {
  @IsString()
  faceToken: string;
}
