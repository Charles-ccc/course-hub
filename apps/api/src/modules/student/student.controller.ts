import { Body, Controller, Get, Header, Post, Res, UseGuards } from "@nestjs/common";
import { SimpleAuthGuard } from "../../common/auth/simple-auth.guard";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { RequireRole } from "../../common/auth/roles.decorator";
import type { AuthenticatedUser } from "../../common/auth/auth.types";
import { RealnameService } from "./realname.service";
import {
  RealnameConfirmReqDto,
  RealnameInitReqDto,
  type RealnameInitRespDto,
  type RealnameConfirmRespDto,
} from "./dto/realname.dto";

@Controller("users")
@UseGuards(SimpleAuthGuard)
@RequireRole("STUDENT")
export class StudentController {
  constructor(private readonly realnameService: RealnameService) {}

  @Post("realname/initialize")
  initialize(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RealnameInitReqDto,
  ): Promise<RealnameInitRespDto> {
    return this.realnameService.initialize(user.subject, body.name, body.idCardNo);
  }

  @Post("realname/confirm")
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: RealnameConfirmReqDto,
  ): Promise<RealnameConfirmRespDto> {
    return this.realnameService.confirm(user.subject, body.certifyId);
  }
}

// Alipay 人脸认证完成后的回跳页面 — 给 web-view 内的支付宝页用，不要鉴权
@Controller("users/realname")
export class RealnamePublicController {
  @Get("callback")
  @Header("Content-Type", "text/html; charset=utf-8")
  callback(@Res() res: { send: (body: string) => void }): void {
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>认证完成</title>
<style>
body{margin:0;padding:60px 24px;font-family:-apple-system,sans-serif;background:#f5f5f5;color:#333;text-align:center}
.icon{width:80px;height:80px;border-radius:50%;background:#52c41a;color:#fff;font-size:48px;line-height:80px;margin:0 auto 24px}
h1{font-size:20px;margin:0 0 12px}
p{color:#888;font-size:14px;margin:0 0 32px}
button{display:block;width:100%;max-width:300px;margin:0 auto;height:48px;border:none;border-radius:24px;background:#ff6b00;color:#fff;font-size:16px;cursor:pointer}
</style>
</head>
<body>
<div class="icon">✓</div>
<h1>认证已完成</h1>
<p>请返回小程序查看认证结果</p>
<button onclick="back()">返回小程序</button>
<script>
function back(){
  // 在 alipay mp web-view 内，my.postMessage 让 page.js 知道认证完成
  if (window.my && window.my.postMessage) {
    window.my.postMessage({ type: 'realname_callback_done' });
  }
  if (window.my && window.my.navigateBack) {
    window.my.navigateBack();
  } else {
    history.back();
  }
}
// 进入 callback 时自动通知
back();
</script>
</body>
</html>`;
    res.send(html);
  }
}
