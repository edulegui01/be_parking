export class CreateNfcTagDto {
  nfc_code: string;
  enable: boolean;
  owner: string;
}

export class UpdateNfcTagDto {
  nfc_code?: string;
  enable?: boolean;
  owner?: string;
}
