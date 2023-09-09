const express = require('express');
const db = require('../db').pool;
const router = express.Router();

router.get('/', (req, res, next) => {

    db.getConnection((error, conn) => {
        conn.query(
            `SELECT P.*,
                PP.sales_price,
                PP.cost_price,
                PP.name,
                PP2.sales_price AS product_sales_price,
                PP2.cost_price AS product_cost_price
            FROM packs P
            INNER JOIN products PP ON P.pack_id = PP.code
            INNER JOIN products PP2 ON P.product_id = PP2.code;`,
            (error, result, field) => {
                conn.release();

                if(error) return res.status(500).send({ error: error });

                res.status(200).send({
                    response: result
                })
            }
        )
    })
});

module.exports = router