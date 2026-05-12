// import "dotenv/config";
// import { pool } from "../config/postgres.js";
// import { syncProductsToMeili } from "../services/meiliService.js";

// const sync = async () => {
//   try {
//     const { rows } = await pool.query(`
//       SELECT
//         id,
//         name,
//         description,
//         category,
//         sub_category,
//         price,
//         image,
//         bestseller,
//         sizes
//       FROM products
//     `);

//     await syncProductsToMeili(rows);

//     console.log("All products synced");

//     process.exit();
//   } catch (error) {
//     console.log(error.message);
//     process.exit(1);
//   }
// };

// sync();