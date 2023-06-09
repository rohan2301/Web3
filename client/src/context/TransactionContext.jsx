import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractABI, contractAddress } from '../utils/constant';

export const TransactionContext = React.createContext();

const { ethereum } = window;

// window.ethereum
const getEthereumContract = () => {
    const provider = new ethers.providers.Web3Provider(ethereum);
    const signer = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress, contractABI, signer);
    return transactionContract;
    // console.log({
    //     provider,
    //     signer,
    //     transactionContract
    // })

}

export const TransactionProvider = ({ children }) => {
    const [currentAccount, setCurrentAccount] = useState('');
    const [formData, setFormData] = useState({ addressTo: '', amount: '', keyword: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [transactionCount, setTransactioncount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);

    const handleChange = (e, name) => {
        setFormData((prevState) => ({ ...prevState, [name]: e.target.value }));
    }

    const getAllTransactions = async () => {
        try {
            if (!ethereum) return alert("please install metamask"); {
                const transactionContract = getEthereumContract();
                // const transactionsContract = 

                const availableTransactions = await transactionContract.getAllTransactions();

                const structuredTransactions = availableTransactions.map((transaction) => ({
                    addressTo: transaction.receiver,
                    addressFrom: transaction.sender,
                    timestamp: new Date(transaction.timestamp.toNumber() * 1000).toLocaleString(),
                    message: transaction.message,
                    keyword: transaction.keyword,
                    amount: parseInt(transaction.amount._hex) / (10 ** 18)
                }));
                // console.log(availableTransactions);

                console.log(structuredTransactions);

                setTransactions(structuredTransactions);
            }
        } catch (error) {
            console.log(error);
        }
    };
    const checkIfWalletIsConnected = async () => {
        try {
            if (!ethereum) return alert("please install metamask");
            const accounts = await ethereum.request({ method: 'eth_accounts' });
            if (accounts.length) {
                setCurrentAccount(accounts[0]);

                getAllTransactions();
            } else {
                console.log("No accounts Found")
            }

            // console.log(accounts);

        } catch (error) {
            console.log(error);
            throw new Error("No ethereum Object");

        }





    }

    const checkIfTransactionsExists = async () => {
        try {
            if (ethereum) {
                const transactionContract = getEthereumContract();
                const transactionCount = await transactionContract.getTransactionCount();
                // const currentTransactionCount = await transactionsContract.getTransactionCount();

                window.localStorage.setItem("transactionCount", transactionCount);
            }
        } catch (error) {
            console.log(error);

            throw new Error("No ethereum object");
        }
    };

    const connectWallet = async () => {
        try {
            if (!ethereum) return alert("please install metamask");
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            setCurrentAccount(accounts[0]);
        } catch (error) {
            console.log(error);
            throw new Error("No ethereum Object");
        }
    }

    const sendTransaction = async () => {
        try {
            if (!ethereum) return alert("please install metamask");
            //get the data from the form
            const { addressTo, amount, keyword, message } = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);

            await ethereum.request({
                method: 'eth_sendTransaction',
                params: [{
                    from: currentAccount,
                    to: addressTo,
                    gas: '0x5208', //21000 gwei //0.000021 ether
                    value: parsedAmount._hex,
                }]
            });
            const transactionHash = await transactionContract.addToBlockchain(addressTo, parsedAmount, message, keyword);
            setIsLoading(true);
            console.log(`loading - ${transactionHash.hash}`);
            await transactionHash.wait();
            setIsLoading(false);
            console.log(`Success - ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionCount();
            setTransactioncount(transactionCount.toNumber());


        } catch (error) {
            console.log(error);
            throw new Error("No ethereum Object");
        }
    }
    useEffect(() => {
        checkIfWalletIsConnected();
        checkIfTransactionsExists();

    }, []);


    return (
        <TransactionContext.Provider value={{ connectWallet, currentAccount, formData, setFormData, handleChange, sendTransaction, transactions,isLoading}}>
            {children}
        </TransactionContext.Provider>
    )
}