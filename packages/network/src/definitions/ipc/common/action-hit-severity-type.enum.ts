/** Bits of EffectEntity.severity for Miss, Damage, BlockedDamage and ParriedDamage */
export enum ActionHitSeverityType {
  NormalDamage = 0,
  CritDamage = 0x20,
  DirectHitDamage = 0x40,
  CritDirectHitDamage = 0x60,
}

/** Bits of EffectEntity.param for Heal */
export enum ActionHealSeverityType {
  NormalHeal = 0,
  CritHeal = 0x20,
}
