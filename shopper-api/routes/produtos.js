const express = require('express');
const db = require('../db').pool;
const router = express.Router();

router.get('/', (req, res, next) => {

    db.getConnection((error, conn) => {
        if(error) return res.status(500).send({ error: error });
        conn.query(
            'SELECT * FROM products;',
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

router.patch('/', (req, res, next) => {
    
    db.getConnection((error, conn) => {
        
        console.log(req.body);
        if(error) console.error(error)
        conn.query(
            `UPDATE products 
            SET sales_price = ?
            WHERE code = ?;`,
            [req.body.new_price, req.body.code],
            (error, result, field) => {
                conn.release();

                if(error) return res.status(500).send({ error: error });

                return res.status(200).send(result)
            }
        )
    })
})

module.exports = router