import {
  FieldType,
  field,
  format,
  ipcEnum,
  Struct,
  type StructConstructor,
} from '@ffcafe/elpis-struct'
import { EventEnums, eventField } from './common/event'

@ipcEnum(EventEnums)
export class SystemLogMessageHeader extends Struct {
  static byteLength = 12

  @field(FieldType.uint, 0, 4)
  @format({ enum: 'EventId', append: 'enum' })
  eventId!: number

  @field(FieldType.uint, 4, 4)
  @format({ db: 'LogMessage', append: 'enum' })
  logMessageId!: number

  @field(FieldType.byte, 8)
  paramCount!: number

  @field(FieldType.bytes, 9, 3)
  padding!: Buffer
}

export interface SystemLogMessageBody extends SystemLogMessageHeader {
  readonly header: Pick<
    SystemLogMessageHeader,
    'eventId' | 'logMessageId' | 'paramCount' | 'padding'
  >
  readonly entities: number[]
}

function createSystemLogMessage(
  paramCapacity: number,
  byteLength: number,
): StructConstructor<SystemLogMessageBody> {
  class Message extends SystemLogMessageHeader {
    static byteLength = byteLength

    get header() {
      return {
        eventId: this.eventId,
        logMessageId: this.logMessageId,
        paramCount: this.paramCount,
        padding: this.padding,
      }
    }

    get entities(): number[] {
      const params = this as unknown as Record<string, number>
      return Array.from(
        { length: paramCapacity },
        (_, i) => params[`param${i + 1}`],
      )
    }
  }

  const parameterFormats = [
    eventField('systemLogParam1'),
    eventField('systemLogParam2'),
    eventField('systemLogParam3'),
  ]
  for (let i = 0; i < paramCapacity; i++) {
    const name = `param${i + 1}`
    field(FieldType.uint, 12 + i * 4, 4)(Message.prototype, name)
    parameterFormats[i]?.(Message.prototype, name)
  }
  return Message
}

export const SystemLogMessage = createSystemLogMessage(2, 24)
export const SystemLogMessage32 = createSystemLogMessage(4, 32)
export const SystemLogMessage48 = createSystemLogMessage(8, 48)
export const SystemLogMessage80 = createSystemLogMessage(16, 80)
export const SystemLogMessage144 = createSystemLogMessage(32, 144)
