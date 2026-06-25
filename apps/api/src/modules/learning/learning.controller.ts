import { Controller, HttpException, HttpStatus, Post } from "@nestjs/common";

@Controller("learning")
export class LearningController {
  @Post("checkin")
  checkin(): never {
    throw new HttpException(
      { code: 50100, message: "打卡功能即将上线，敬请期待" },
      HttpStatus.NOT_IMPLEMENTED,
    );
  }
}
