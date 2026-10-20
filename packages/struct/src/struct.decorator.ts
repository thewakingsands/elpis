import 'reflect-metadata'
import type { FieldType } from './field-type.enum'
import type { IPCFieldCondition, IPCFieldFormat } from './format'
import { fieldLength } from './helper'
import type { Struct, StructConstructor } from './struct'

export const fieldMetadataKey = Symbol('field')
export const childrenMetadataKey = Symbol('children')
export const enumMetadataKey = Symbol('enum')
export const ifMetadataKey = Symbol('if')

export interface FieldMetadata {
  type: FieldType
  offset: number
  length?: number
  children?: FieldMetadata[]
  format?: IPCFieldFormat
  condition?: Record<string, IPCFieldCondition[]>
  /** Set by bits() and flag(): the value is these bits of the integer field */
  bits?: { shift: number; width: number; flag: boolean }
}

export interface ChildMetadata {
  type: FieldType
  byteLength: number
}

export interface EnumMetadata {
  name: string
  values: Record<string, number | string>
}

type Store<T> = Record<string, T | undefined>
type Child = StructConstructor | ChildMetadata

type ClassDecorator = (target: StructConstructor) => void
type PropertyDecorator = (target: Struct, propertyKey: string) => void

function setField(
  handler: (target: Struct, prev: FieldMetadata) => FieldMetadata,
) {
  return (target: Struct, propertyKey: string) => {
    let store: Store<FieldMetadata> = {}
    if (Reflect.hasOwnMetadata(fieldMetadataKey, target)) {
      store = Reflect.getMetadata(
        fieldMetadataKey,
        target,
      ) as Store<FieldMetadata>
    }

    store[propertyKey] = handler(
      target,
      (store[propertyKey] || {}) as FieldMetadata,
    )
    Reflect.defineMetadata(fieldMetadataKey, store, target)
  }
}

export function field(
  type: FieldType,
  offset?: number,
  length?: number,
): PropertyDecorator {
  return setField((target, prev) => {
    const structConstructor = target.constructor as StructConstructor
    if (offset === undefined || offset < 0) {
      offset = structConstructor.byteLength ?? 0
    }

    const endByte = offset + fieldLength(type, length)

    if (
      !structConstructor.byteLength ||
      endByte > structConstructor.byteLength
    ) {
      structConstructor.byteLength = endByte
    }

    return { ...prev, type, offset, length }
  })
}

export function format(format: IPCFieldFormat): PropertyDecorator {
  if (format.addend !== undefined && !Number.isFinite(format.addend)) {
    throw new RangeError('Field addend must be a finite number')
  }
  if (
    format.divisor !== undefined &&
    (!Number.isFinite(format.divisor) || format.divisor <= 0)
  ) {
    throw new RangeError('Field divisor must be a positive finite number')
  }
  return setField((_, prev) => ({ ...prev, format }))
}

export function condition(
  condition: Record<string, IPCFieldCondition[]>,
): PropertyDecorator {
  return setField((_, prev) => ({ ...prev, condition }))
}

/**
 * Reads `width` bits of an integer field from bit `shift`, as a number.
 * Throws RangeError when shift is negative, width is not positive, or shift + width is above 32.
 */
export function bits(shift: number, width: number): PropertyDecorator {
  if (
    !Number.isInteger(shift) ||
    !Number.isInteger(width) ||
    shift < 0 ||
    width <= 0 ||
    shift + width > 32
  ) {
    throw new RangeError(
      `Invalid bits(${shift}, ${width}): need shift >= 0, width > 0 and shift + width <= 32`,
    )
  }
  return setField((_, prev) => ({
    ...prev,
    bits: { shift, width, flag: false },
  }))
}

/**
 * Reads bit `bit` of an integer field, as a boolean.
 * Throws RangeError when bit is negative or above 31.
 */
export function flag(bit: number): PropertyDecorator {
  if (!Number.isInteger(bit) || bit < 0 || bit > 31) {
    throw new RangeError(`Invalid flag(${bit}): need 0 <= bit <= 31`)
  }
  return setField((_, prev) => ({
    ...prev,
    bits: { shift: bit, width: 1, flag: true },
  }))
}

function mergePrototypeMetadata<T>(
  target: object,
  key: symbol,
): Store<T> | undefined {
  const chain: object[] = []
  let current: object | null = target
  while (current && current !== Object.prototype) {
    chain.unshift(current)
    current = Object.getPrototypeOf(current)
  }

  const merged: Store<T> = {}
  let hasAny = false
  for (const item of chain) {
    const own = Reflect.getOwnMetadata(key, item) as Store<T> | undefined
    if (!own) continue
    Object.assign(merged, own)
    hasAny = true
  }

  return hasAny ? merged : undefined
}

export function getFields(target: Struct): Store<FieldMetadata> | undefined {
  return mergePrototypeMetadata<FieldMetadata>(target, fieldMetadataKey)
}

export function child(struct: Child): PropertyDecorator {
  return (target: Struct, propertyKey: string): void => {
    let store: Store<Child> = {}
    if (Reflect.hasOwnMetadata(childrenMetadataKey, target)) {
      store = Reflect.getMetadata(childrenMetadataKey, target) as Store<Child>
    }

    store[propertyKey] = struct
    Reflect.defineMetadata(childrenMetadataKey, store, target)
  }
}

export function getChildren(target: Struct): Store<Child> | undefined {
  return mergePrototypeMetadata<Child>(target, childrenMetadataKey)
}

export type Enum = Record<string, number | string>
export function ipcEnum(enums: Record<string, Enum>): ClassDecorator
export function ipcEnum(name: string, values: Enum): ClassDecorator
export function ipcEnum(
  arg0: string | Record<string, Enum>,
  arg1?: Enum,
): ClassDecorator {
  return (target: StructConstructor): void => {
    const store = getEnums(target)?.slice() ?? []
    if (typeof arg0 === 'object') {
      for (const [name, values] of Object.entries(arg0)) {
        store.push({ name, values })
      }
    } else if (arg1) {
      store.push({ name: arg0, values: arg1 })
    }

    Reflect.defineMetadata(enumMetadataKey, store, target)
  }
}

export function getEnums(
  target: StructConstructor,
): EnumMetadata[] | undefined {
  const chain: StructConstructor[] = []
  let current: StructConstructor | null = target
  while (current && current !== Function.prototype) {
    chain.unshift(current)
    current = Object.getPrototypeOf(current) as StructConstructor | null
  }

  const merged: EnumMetadata[] = []
  for (const item of chain) {
    const own = Reflect.getOwnMetadata(enumMetadataKey, item) as
      | EnumMetadata[]
      | undefined
    if (own) {
      merged.push(...own)
    }
  }

  return merged.length ? merged : undefined
}

export function ipcIf(fieldName: string) {
  return (target: StructConstructor): void => {
    Reflect.defineMetadata(ifMetadataKey, fieldName, target)
  }
}

export function getStructIf(target: StructConstructor): string | undefined {
  return Reflect.getMetadata(ifMetadataKey, target) as string | undefined
}
