export { FieldType } from './field-type.enum'
export { Base, type IPCFieldCondition, type IPCFieldFormat } from './format'
export { fieldLength } from './helper'
export { Struct, type StructConstructor } from './struct'
export {
  bits,
  type ChildMetadata,
  child,
  childrenMetadataKey,
  condition,
  type Enum,
  type EnumMetadata,
  enumMetadataKey,
  type FieldMetadata,
  field,
  fieldMetadataKey,
  flag,
  format,
  getChildren,
  getEnums,
  getFields,
  getStructIf,
  ifMetadataKey,
  ipcEnum,
  ipcIf,
} from './struct.decorator'
