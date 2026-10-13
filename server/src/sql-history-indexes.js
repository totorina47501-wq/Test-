// Indexes aligned with existing user-scoped, newest-first history queries.
export const historyIndexes = [
  "CREATE INDEX IF NOT EXISTS idx_trades_user_recent ON trades(user_id,id DESC)",
  "CREATE INDEX IF NOT EXISTS idx_bot_activity_user_recent ON bot_activity(user_id,id DESC)",
  "CREATE INDEX IF NOT EXISTS idx_simulated_deposits_user_recent ON simulated_deposits(user_id,id DESC)",
  "CREATE INDEX IF NOT EXISTS idx_x402_audit_user_recent ON x402_audit(user_id,id DESC)",
  "CREATE INDEX IF NOT EXISTS idx_bot_ai_decisions_user_created ON bot_ai_decisions(user_id,created_at DESC,id DESC)"
];
