import { FieldType, Struct, type StructConstructor, child, field } from '@ffcafe/elpis-struct'

export function listStructFactory(
  headerType: StructConstructor,
  headerLength: number,
  entityType: StructConstructor | FieldType,
  entityLength: number,
  entityCount: number,
): StructConstructor {
  const struct = class extends Struct {
    header!: Struct
    entities!: Struct[]
  }

  field(FieldType.object, 0, headerLength)(struct.prototype, 'header')
  child(headerType)(struct.prototype, 'header')

  field(
    FieldType.array,
    headerLength,
    entityCount * entityLength,
  )(struct.prototype, 'entities')
  child(
    typeof entityType === 'function'
      ? entityType
      : {
          type: entityType,
          byteLength: entityLength,
        },
  )(struct.prototype, 'entities')

  return struct
}

export function createListStructFactory(
  headerType: StructConstructor,
  headerLength: number,
  entityType: StructConstructor | FieldType,
  entityLength: number,
) {
  return (count: number) =>
    listStructFactory(headerType, headerLength, entityType, entityLength, count)
}
