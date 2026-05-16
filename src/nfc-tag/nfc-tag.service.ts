import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateNfcTagDto, UpdateNfcTagDto } from './dto/nfc-tag.dto';

@Injectable()
export class NfcTagService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNfcTagDto) {
    return this.prisma.nfc_tag.create({ data });
  }

  async update(id: number, data: UpdateNfcTagDto) {
    await this.findOneOrFail(id);
    return this.prisma.nfc_tag.update({ where: { id }, data });
  }

  async remove(id: number) {
    await this.findOneOrFail(id);
    return this.prisma.nfc_tag.delete({ where: { id } });
  }

  async existsByCode(nfc_code: string) {
    const tag = await this.prisma.nfc_tag.findFirst({ where: { nfc_code } });
    return { exists: !!tag };
  }

  private async findOneOrFail(id: number) {
    const tag = await this.prisma.nfc_tag.findUnique({ where: { id } });
    if (!tag) throw new NotFoundException(`nfc_tag con id ${id} no encontrado`);
    return tag;
  }
}
