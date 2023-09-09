import React, { useState } from "react"

export default function ProductsTable({ produtos, csvArray }) {

    const formatedProd = csvArray.map((produto) => {
        const item = produtos.find((prod) => prod.code === parseInt(produto.product_code));
        return {...item, new_price: produto.new_price }
    });

    return (
        <div className="bg-neutral-800 pt-6 shadow rounded-md">
            <table className="table-auto w-full divide-y divide-gray-200 p-6">
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Nome</th>
                        <th>Preço Atual</th>
                        <th>Preço Novo</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        formatedProd.map((produto, index) => 
                        (
                            <tr key={index}>
                                <td>{ produto.code }</td>
                                <td>{ produto.name }</td>
                                <td>{ produto.sales_price }</td>
                                <td>{ produto.new_price || "-" }</td>
                            </tr>
                        )
                        )
                    }
                </tbody>
            </table>
        </div>
    )
}