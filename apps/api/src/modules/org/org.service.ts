import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class OrgService {
  constructor(private prisma: PrismaService) {}

  async getProfile(orgId: string) {
    const org = await this.prisma.org.findUnique({ where: { id: orgId } });
    if (!org) throw new NotFoundException('机构不存在');
    return org;
  }

  async getOrders(orgId: string, page: number, size: number) {
    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { sellerOrgId: orgId },
        include: {
          student: { select: { id: true, phone: true, realname: true } },
          course: { select: { title: true } },
          installmentItems: true,
        },
        skip: (page - 1) * size,
        take: size,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { sellerOrgId: orgId } }),
    ]);
    return { items, total, page, size };
  }

  async handleOverdueAction(orgId: string, itemId: string, dto: { action: string; remark?: string }) {
    const item = await this.prisma.installmentItem.findUnique({
      where: { id: itemId },
      include: { order: true },
    });
    if (!item || item.order.sellerOrgId !== orgId) throw new ForbiddenException();

    if (dto.action === 'write_off') {
      await this.prisma.installmentItem.update({
        where: { id: itemId },
        data: { status: 'WRITTEN_OFF' },
      });
      await this.prisma.serviceRecord.create({
        data: {
          orderId: item.orderId,
          type: 'TEACHER_OUTREACH',
          payloadRef: dto.remark,
          actorId: orgId,
        },
      });
    }
    return { success: true };
  }

  async getSettlement(orgId: string) {
    return this.prisma.settlement.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getDepositLedger(orgId: string) {
    const org = await this.prisma.org.findUnique({ where: { id: orgId }, select: { depositBalance: true } });
    const ledger = await this.prisma.depositLedger.findMany({
      where: { orgId },
      orderBy: { ts: 'desc' },
      take: 50,
    });
    return { balance: org?.depositBalance, ledger };
  }

  async getQaList(orgId: string, query: any) {
    const page = +(query.page || 1);
    const size = +(query.size || 20);
    const [items, total] = await Promise.all([
      this.prisma.serviceRecord.findMany({
        where: { type: 'QA', order: { sellerOrgId: orgId } },
        include: { order: { select: { id: true, student: { select: { realname: true, phone: true } } } } },
        orderBy: { ts: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.serviceRecord.count({
        where: { type: 'QA', order: { sellerOrgId: orgId } },
      }),
    ]);
    const parsed = items.map((r) => {
      let payload: any = {};
      try { payload = JSON.parse(r.payloadRef || '{}'); } catch { /* noop */ }
      return { ...r, question: payload.question || r.payloadRef, reply: payload.reply || null };
    });
    return { items: parsed, total, page, size };
  }

  async replyQa(orgId: string, recordId: string, reply: string) {
    const record = await this.prisma.serviceRecord.findUnique({
      where: { id: recordId },
      include: { order: true },
    });
    if (!record || record.order.sellerOrgId !== orgId) throw new ForbiddenException();
    let payload: any = {};
    try { payload = JSON.parse(record.payloadRef || '{}'); } catch { /* noop */ }
    payload.reply = reply;
    return this.prisma.serviceRecord.update({
      where: { id: recordId },
      data: { payloadRef: JSON.stringify(payload) },
    });
  }

  async issueInvoice(orgId: string, dto: any) {
    // 对接电子发票服务（桩实现）
    return { invoiceNo: `INV-${Date.now()}`, url: '', issuedAt: new Date() };
  }

  async adminList(status?: string, page = 1, size = 20) {
    const where = status ? { status: status as any } : {};
    const [items, total] = await Promise.all([
      this.prisma.org.findMany({ where, skip: (page - 1) * size, take: size, orderBy: { createdAt: 'desc' } }),
      this.prisma.org.count({ where }),
    ]);
    return { items, total, page, size };
  }

  async approve(id: string, feeRate: number) {
    return this.prisma.org.update({
      where: { id },
      data: { status: 'ACTIVE', settlementFeeRate: feeRate },
    });
  }

  async suspend(id: string, reason: string) {
    return this.prisma.org.update({ where: { id }, data: { status: 'SUSPENDED' } });
  }
}
