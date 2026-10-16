import { ConflictException, HttpException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { AttributeStatus } from '../enums/attribute-status.enum';

type AttributeEntity = 'attribute' | 'value';

interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

export function attributeDuplicate(status: AttributeStatus, entity: AttributeEntity = 'attribute'): ConflictException {
  const inactive = status === AttributeStatus.INACTIVE;
  const subject = entity === 'value' ? 'attribute value with this label' : 'attribute with this name';
  const prefix = entity === 'value' ? 'ATTRIBUTE_VALUE_LABEL' : 'ATTRIBUTE_NAME';
  return new ConflictException({
    message: inactive
      ? `An inactive ${subject} already exists. A user with Update permission can reactivate it.`
      : `An ${subject} already exists.`,
    errorCode: `${prefix}_DUPLICATE_${inactive ? 'INACTIVE' : 'ACTIVE'}`,
  });
}

export function handleAttributeWriteError(error: PostgresError, entity: AttributeEntity = 'attribute'): never {
  if (error instanceof HttpException) throw error;

  let driver: PostgresError = error;
  if (error instanceof QueryFailedError && error.driverError instanceof Error) {
    driver = error.driverError;
  }
  const { code, constraint } = driver;

  if (
    code === '23505' &&
    constraint ===
      (entity === 'value' ? 'uq_product_attribute_values_attribute_label_ci' : 'uq_product_attributes_tenant_name_ci')
  ) {
    throw new ConflictException({
      message:
        entity === 'value'
          ? 'An attribute value with this label already exists.'
          : 'An attribute with this name already exists.',
      errorCode: entity === 'value' ? 'ATTRIBUTE_VALUE_LABEL_DUPLICATE' : 'ATTRIBUTE_NAME_DUPLICATE',
    });
  }

  if (code === '40P01' || code === '40001') {
    throw new ConflictException({
      message: 'The catalog changed concurrently. Please retry.',
      errorCode: 'ATTRIBUTE_WRITE_RETRYABLE',
    });
  }

  if (entity === 'value' && code === '23503' && constraint === 'fk_product_attribute_values_attribute') {
    throw new NotFoundException({
      message: 'Attribute not found.',
      errorCode: 'ATTRIBUTE_NOT_FOUND',
    });
  }

  throw error;
}
