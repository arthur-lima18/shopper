import React, { useEffect, useState } from "react"
import Papa from 'papaparse';
import { toast } from 'react-toastify';
import '../styles/CSVImport.css'
import api from "../services/api";
import ProductsTable from './ProductsTable'

export default function CSVImport(props) {
    const [produtos, setProdutos] = useState([]);
    const [pacotes, setPacotes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [csvFile, setCSVFile] = useState();
    const [csvArray, setCSVArray] = useState([]);
    const [erros, setErros] = useState([]);
    const [isValidated, setIsValidated] = useState(false);
    const [title, setTitle] = useState('Importe um arquivo CSV para começar');

    useEffect(() => {
        api.get('/products/')
            .then((res) => {
                setProdutos(res.data.response);
                setIsLoading(false);
            })
            .catch((error) => {
                console.error('Erro ao carregar os produtos! ' + error);
                setIsLoading(false);
            });
        api.get('/packs/')
            .then((res) => {
                setPacotes(res.data.response);
            })
            .catch((error) => {
                console.error('Erro ao carregar os pacotes! ' + error);
            })
    }, []);

    const verificaPacote = (produto) => {
        return pacotes.filter((pacote) => pacote.pack_id === produto.code)
    }

    const calculaValorPacote = (pacote, csv) => {

        const produtosCalculo = pacote.map((produtoPacote) => {
            const produtoEncontrado = csv.find((produtoCSV) => parseInt(produtoCSV.product_code) === produtoPacote.product_id)
            return { ...produtoEncontrado, qty: produtoPacote.qty }
        })

        if(produtosCalculo) {

            const updatePacote = csv.find((prod) => parseInt(prod.product_code) === pacote[0].pack_id);

            var somaProdutos = 0;
            produtosCalculo.forEach((prod) => {
                somaProdutos += parseFloat(prod.new_price) * prod.qty;
            })
            if(somaProdutos === parseFloat(updatePacote.new_price)) return 1;
            return -1;
        }

        return -1;
    }

    const handleChange = (event) => {
        setCSVFile(event.target.files[0]);
    }

    const handleResetValidation = () => {
        setCSVFile(null);
        setErros([]);
        setIsValidated(false);
        setCSVArray([]);
    }

    const handleValidate = (event) => {
        event.preventDefault();

        if (csvFile) {
            Papa.parse(csvFile, {
                header: true,
                complete: (result) => {
                    const errosAux = [];
                    const csvArrayAux = result.data;
                    csvArrayAux.forEach((lin, index) => {
                        if (!lin.product_code || !lin.new_price) errosAux.push(`Linha ${index + 2}: Produto não possui todas as informações preenchidas.`);
                        else {
                            const produtoSearch = produtos.find((prod) => prod.code === parseInt(lin.product_code))

                            if (!produtoSearch) errosAux.push(`Linha ${index + 2}: Código de produto (${lin.product_code}) não encontrado.`);
                            else {
                                const pacote = verificaPacote(produtoSearch);

                                if(pacote.length > 0 && calculaValorPacote(pacote, csvArrayAux) === -1) {
                                    errosAux.push(`Linha ${index + 2}: Valor do Pacote não é o mesmo que a soma dos Produtos inclusos nele.`);
                                }
                                const { cost_price, sales_price } = produtoSearch;
                                const newPrice = parseFloat(lin.new_price);

                                if (newPrice < cost_price) errosAux.push(`Linha ${index + 2}: O novo preço deve ser maior que o custo do produto.`);

                                const diffPrice = Math.abs(sales_price - newPrice);
                                const minCostPrice = (sales_price * 0.9).toFixed(2);
                                const maxCostPrice = (sales_price * 1.1).toFixed(2);

                                if (diffPrice > (sales_price * 0.1)) errosAux.push(`Linha ${index + 2}: O novo preço deve estar entre ${minCostPrice > cost_price ? minCostPrice : cost_price} e ${maxCostPrice}.`);
                            }
                        }
                    })
                        
                    setCSVArray(csvArrayAux);
                    setIsValidated(errosAux.length === 0);
                    setErros(errosAux); 
                }
            })
        }

    }

    const handleUpdate = (event) => {
        
        event.preventDefault();
        
        const toastUpdate = toast.loading("Aguarde enquanto os dados são atualizados...", { autoClose: false })
        try {
            csvArray.forEach((produto) => {
                api.patch('/products/', {code: parseInt(produto.product_code), new_price: produto.new_price})
            }) 
            toast.update(toastUpdate, { render: "Dados atualizados com sucesso! :)", type: "success", isLoading: false });
        } catch(error) {
            console.error(error);
            toast.update(toastUpdate, { render: "Ocorreu um erro ao atualizar os dados... :(", type: "error", isLoading: false });
        }

        handleResetValidation();
        setTitle('Dados atualizados com sucesso! :)');
    }

    return (
        <>
            {isLoading ?

                (<p>Carregando dados...</p>)
                :
                (
                    <div className="flex flex-col justify-center mb-10">
                        <form className="flex flex-row mb-10 justify-center">
                            <label htmlFor="csvFileSelector">{csvFile ? csvFile.name : 'Selecionar arquivo CSV'}</label>
                            <input id="csvFileSelector" type="file" accept=".csv" onChange={handleChange} onClick={() => handleResetValidation()} />
                            <button className={csvFile ? 'validate-button' : 'disabled-validate-button'} onClick={(e) => handleValidate(e)} disabled={!csvFile}>VALIDAR</button>
                            <button className={(isValidated ? 'update-button' : 'disabled-update-button') + ' ml-3'} onClick={(e) => handleUpdate(e)} disabled={!isValidated}>ATUALIZAR</button>
                        </form>
                        <div>
                            {
                                erros.length > 0 ? (
                                    <div className="flex justify-start p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                                        <svg className="flex-shrink-0 inline w-4 h-4 mr-3 mt-[2px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                        </svg>
                                        <span className="sr-only">Erro</span>
                                        <div>
                                            <span className="font-medium">Corrija os seguintes erros antes de atualizar os dados</span>
                                            <ul className="mt-1.5 ml-4 list-disc list-inside">
                                                {
                                                    erros.map((erro, index) => (
                                                        <li key={index}>{erro}</li>
                                                    ))
                                                }
                                            </ul>
                                        </div>
                                    </div>

                                ) : (
                                    isValidated && (
                                        <div className="flex p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
                                            <svg className="flex-shrink-0 inline w-4 h-4 mr-3 mt-[2px]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5ZM9.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM12 15H8a1 1 0 0 1 0-2h1v-3H8a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1v4h1a1 1 0 0 1 0 2Z" />
                                            </svg>
                                            <span className="sr-only">Sucesso</span>
                                            <div>
                                                <span className="font-medium">Arquivo validado! Clique em ATUALIZAR para finalizar o processo</span>
                                            </div>
                                        </div>
                                    )
                                )
                            }
                        </div>
                        {
                            csvArray.length > 0 ?
                            (
                                <div>
                                    <ProductsTable produtos={produtos} csvArray={csvArray}/>
                                </div>
                            ) : 
                            (
                                <div className="flex justify-center align-center">
                                    <p>{title}</p>
                                </div>
                            )

                        }
                    </div>
                )
            }
        </>

    )
}