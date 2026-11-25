export class SelectionCategoryDto {
  id!: string;
  name!: string;
  parentId!: string | null;
}

export class SelectionBrandDto {
  id!: string;
  name!: string;
}

export class SelectionUomDto {
  id!: string;
  name!: string;
  code!: string;
  allowsFractionalQuantity!: boolean;
}

export class SelectionAttributeValueDto {
  id!: string;
  label!: string;
}

export class SelectionCategoryAttributeDto {
  id!: string;
  name!: string;
  values!: SelectionAttributeValueDto[];
}
