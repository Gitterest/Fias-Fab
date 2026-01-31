import crypto from "node:crypto";

export type ShopifyClient={
  getCustomerBalance:(customerId:string)=>Promise<number>;
  setCustomerBalance:(customerId:string,balance:number)=>Promise<number>;
  incrementCustomerBalance:(customerId:string,delta:number)=>Promise<number>;
  ensureMetafieldDefinition:()=>Promise<void>;
};

const shop=process.env.SHOPIFY_SHOP??"";
const token=process.env.SHOPIFY_ADMIN_ACCESS_TOKEN??"";
const apiVersion=process.env.SHOPIFY_API_VERSION??"2024-04";
const endpoint=`https://${shop}/admin/api/${apiVersion}/graphql.json`;

const gql=async<T>(query:string,variables:Record<string,unknown>)=>{const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json","X-Shopify-Access-Token":token},body:JSON.stringify({query,variables})});const json=(await res.json()) as {data?:T;errors?:unknown};if(!res.ok||json.errors)throw new Error(`Shopify GraphQL error: ${JSON.stringify(json.errors)}`);return json.data as T};
const customerGid=(id:string)=>id.startsWith("gid://")?id:`gid://shopify/Customer/${id}`;

export const createShopifyClient=():ShopifyClient=>({
  async getCustomerBalance(customerId){const data=await gql<{customer:{metafield:{value:string}|null}}>("query CustomerBalance($id: ID!) { customer(id: $id) { metafield(namespace: \"credits\", key: \"balance\") { value } } }",{id:customerGid(customerId)});return Number(data.customer?.metafield?.value??0)||0;},
  async setCustomerBalance(customerId,balance){const data=await gql<{metafieldsSet:{metafields:{value:string}[]}}>("mutation SetBalance($input: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $input) { metafields { value } } }",{input:[{ownerId:customerGid(customerId),namespace:"credits",key:"balance",type:"integer",value:String(balance)}]});return Number(data.metafieldsSet.metafields[0]?.value??balance);},
  async incrementCustomerBalance(customerId,delta){const current=await this.getCustomerBalance(customerId);return this.setCustomerBalance(customerId,Math.max(0,current+delta));},
  async ensureMetafieldDefinition(){const data=await gql<{metafieldDefinitions:{edges:{node:{id:string}}[]}}>("query Def { metafieldDefinitions(first: 1, ownerType: CUSTOMER, namespace: \"credits\", key: \"balance\") { edges { node { id } } } }",{});if(data.metafieldDefinitions.edges.length>0)return;await gql("mutation DefCreate($definition: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $definition) { createdDefinition { id } userErrors { field message } } }",{definition:{name:"Credits Balance",namespace:"credits",key:"balance",type:"integer",ownerType:"CUSTOMER",access:{admin:"READ_WRITE",storefront:"READ"}}});}
});

export const verifyHmac=(rawBody:Buffer,hmacHeader:string|undefined)=>{const secret=process.env.SHOPIFY_WEBHOOK_SECRET??"";const digest=crypto.createHmac("sha256",secret).update(rawBody).digest("base64");return crypto.timingSafeEqual(Buffer.from(digest),Buffer.from(hmacHeader??""))};

export const verifyProxySignature=(query:Record<string,string|string[]|undefined>)=>{if(process.env.APP_PROXY_BYPASS==="true")return true;const secret=process.env.SHOPIFY_APP_PROXY_SECRET??"";const{signature,...rest}=query as Record<string,string>;if(!signature)return false;const message=Object.keys(rest).sort().map((key)=>`${key}=${Array.isArray(rest[key])?rest[key][0]:rest[key]}`).join("");const digest=crypto.createHmac("sha256",secret).update(message).digest("hex");return crypto.timingSafeEqual(Buffer.from(digest),Buffer.from(signature))};
