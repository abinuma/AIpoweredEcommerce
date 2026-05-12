// import client from "../config/meilisearch.js";

// const index = client.index("products");

// export const syncProductsToMeili = async (products) => {
//   await index.addDocuments(products);
//   console.log("Products synced to Meilisearch");
// };

// export const searchProductsMeili = async (query) => {
//   const result = await index.search(query, {
//     limit: 20,
//   });

//   return result.hits;
// };