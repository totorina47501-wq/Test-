// Stripe event handler: execute only after verified signature and commercial release approval.
// The unique event_id and the row lock prevent duplicate or concurrent application.
export function subscriptionUpdate(event) {
 if(!event||typeof event.id!=="string"||!/^evt_[A-Za-z0-9_]+$/.test(event.id))throw new Error("Invalid event id");
 const obj=event.data?.object||{};
 if(event.type==="checkout.session.completed"){
  if(obj.mode!=="subscription"||obj.payment_status!=="paid")return null;
  const userId=Number(obj.metadata?.userId);
  const plan=["pro","elite"].includes(obj.metadata?.plan)?obj.metadata.plan:null;
  if(!Number.isSafeInteger(userId)||userId<=0||!plan||typeof obj.customer!=="string"||typeof obj.subscription!=="string")return null;
  return {kind:"checkout",userId,plan,customer:obj.customer,subscription:obj.subscription};
 }
 if(event.type==="customer.subscription.updated"||event.type==="customer.subscription.deleted"){
  const status=event.type==="customer.subscription.deleted"?"canceled":obj.status;
  const active=["active","trialing"].includes(status);
  const plan=["pro","elite"].includes(obj.metadata?.plan)?obj.metadata.plan:null;
  if(typeof obj.customer!=="string"||typeof obj.id!=="string")return null;
  const userId=Number(obj.metadata?.userId);
  return {kind:"subscription",userId:Number.isSafeInteger(userId)&&userId>0?userId:null,plan:active?plan||"free":"free",customer:obj.customer,subscription:status==="canceled"?null:obj.id};
 }
 return null;
}
export async function applyVerifiedStripeEvent(pool,event){
 const change=subscriptionUpdate(event);
 if(!change)return {received:true,ignored:true};
 const client=await pool.connect();
 try{
  await client.query("BEGIN");
  // Insert with a durable unique key. Lock is scoped to this DB transaction.
  const inserted=await client.query("INSERT INTO stripe_webhook_events(event_id,event_type) VALUES ($1,$2) ON CONFLICT (event_id) DO NOTHING RETURNING event_id",[event.id,event.type]);
  if(!inserted.rowCount){await client.query("COMMIT");return {received:true,duplicate:true}}
  if(change.kind==="checkout"){
   // Checkout cannot grant a subscription without an explicit paid subscription session.
   await client.query("UPDATE users SET plan=$1,pro_since=COALESCE(pro_since,CURRENT_TIMESTAMP),stripe_customer_id=$2,stripe_subscription_id=$3 WHERE id=$4 AND (stripe_customer_id IS NULL OR stripe_customer_id=$2)",[change.plan,change.customer,change.subscription,change.userId]);
  }else if(change.userId){
   await client.query("UPDATE users SET plan=$1,stripe_customer_id=COALESCE(stripe_customer_id,$2),stripe_subscription_id=$3 WHERE id=$4 AND (stripe_customer_id IS NULL OR stripe_customer_id=$2)",[change.plan,change.customer,change.subscription,change.userId]);
  }else{
   await client.query("UPDATE users SET plan=$1,stripe_subscription_id=$2 WHERE stripe_customer_id=$3",[change.plan,change.subscription,change.customer]);
  }
  await client.query("COMMIT");return {received:true,applied:true};
 }catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
}
