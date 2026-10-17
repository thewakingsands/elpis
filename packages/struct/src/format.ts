export enum Base {
  NONE = 'NONE',

  // numbers
  DEC = 'DEC',
  HEX = 'HEX',
  OCT = 'OCT',
  DEC_HEX = 'DEC_HEX',
  HEX_DEC = 'HEX_DEC',

  // strings
  ASCII = 'ASCII',
  UNICODE = 'UNICODE',

  // bytes
  DOT = 'DOT',
  DASH = 'DASH',
  COLON = 'COLON',
  SPACE = 'SPACE',

  // Bitwise OR values, not supported
  // UNIT_STRING = 'UNIT_STRING',
  // RANGE_STRING = 'RANGE_STRING',
  // SPECIAL_VALS = 'SPECIAL_VALS',
}

export interface IPCFieldFormat {
  /** Divides numeric wire values when reading and displaying fixed-point fields. */
  divisor?: number
  /** Adds a constant after division when reading and displaying numeric fields. */
  addend?: number
  /**
   * Overrides field label
   */
  label?: string
  /**
   * Enum name. Can be a Enum name declared in `IPCSchema.enums`
   */
  enum?: string
  /**
   * DB name
   */
  db?: string
  /**
   * Displaying style in Wireshark. Must be a property of `base`.
   * Default: `DEC`
   */
  base?: Base
  /**
   * Whether to append the parsed value to tree title.
   * If a falsy value (like empty string, `false`, `null` or nothing) is passed, it would append nothing
   * which is the default behavior.
   * If an unlisted truthy value is passed, the appended value would depend on the to-string implementation
   * of Lua. It's recommended to use `"val"` for this behavior.
   */
  append?: 'enum' | 'hex' | 'val'
  /**
   * Whether to append field name before the value.
   * Default: `false`
   */
  append_name?: boolean
  /**
   * Check packet length before parsing field. Useful when the packet length varys. (Sometimes different
   * packets can use same the IPC type and cannot be recognized, like `0x0065`, used for both GroupMessage
   * and Ping)
   * Default: `false`
   */
  check_length?: boolean
  /**
   * Override the default method to convert tvbr to Lua varible, which is set to corresponding packet field.
   * Example: `string(ENC_UTF_8)` - Read a UTF-8 string (Can be used for almost all UGC in FF14)
   */
  tvb_method?: string
  /**
   * Use `add_le` instead of `add`. Most fields in FF14 packets are in Little-Endian, but just in case.
   * Default: `true`
   */
  add_le?: boolean
}

export interface IPCFieldCondition
  extends Pick<IPCFieldFormat, 'label' | 'enum' | 'db' | 'base' | 'append'> {
  /**
   * Effective when specified field equals this value
   */
  value: any
}
