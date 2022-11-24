import Navbar from "./Navbar";
import { useState } from "react";
import { uploadFileToIPFS, uploadJSONToIPFS } from "../pinata";

import Marketplace from '../Marketplace.json';

export default function MintNFT () {
    const [formParams, updateFormParams] = useState({ name: '', description: '' });
    const [fileURL, setFileURL] = useState(null);
    const [message, updateMessage] = useState('');

    const ethers = require("ethers");

    async function OnChangeFile(e) {
        var file = e.target.files[0];

        try {
            const response = await uploadFileToIPFS(file);
            if(response.success === true) {
                console.log("Uploaded image to Pinata:", response.pinataURL);
                setFileURL(response.pinataURL);
            }
        } catch(e) {
            console.log("Error during file upload", e);
        }
    }

    async function uploadMetadataToIPFS() {
        const {name, description} = formParams;

        if (!name || !description || !fileURL)
            return;

        const nftJSON = {
            name, description, image: fileURL
        };

        try {
            const response = await uploadJSONToIPFS(nftJSON);
            if(response.success === true) {
                console.log("Uploaded JSON to Pinata: ", response);
                return response.pinataURL;
            }

        } catch(e) {
            console.log("Error uploading JSON metadata", e);
        }
    }

    async function mintNFT(e) {
        e.preventDefault();

        try {
            const metadataURL = await uploadMetadataToIPFS();
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            updateMessage("Please wait... uploading (up to 5 mins)");

            let contract = new ethers.Contract(Marketplace.address, Marketplace.abi, signer);
            let transaction = await contract.createToken(metadataURL);
            await transaction.wait();

            alert("Successfully minted your NFT!");
            updateMessage("");
            updateFormParams({name:'', description:''});
        } catch(e) {
            alert("Upload error:" + e)
        }
    }

    return (
        <div className="">
        <Navbar></Navbar>
        <div className="flex flex-col place-items-center mt-10" id="nftForm">
            <form className="bg-white shadow-md rounded px-8 pt-4 pb-8 mb-4">
            <h3 className="text-center font-bold text-purple-500 mb-8">Upload your NFT to the marketplace</h3>
                <div className="mb-4">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="name">NFT Name</label>
                    <input className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" id="name" type="text" placeholder="Axie#4563" onChange={e => updateFormParams({...formParams, name: e.target.value})} value={formParams.name}></input>
                </div>
                <div className="mb-6">
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="description">NFT Description</label>
                    <textarea className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" cols="40" rows="5" id="description" type="text" placeholder="Axie Infinity Collection" value={formParams.description} onChange={e => updateFormParams({...formParams, description: e.target.value})}></textarea>
                </div>
                <div>
                    <label className="block text-purple-500 text-sm font-bold mb-2" htmlFor="image">Upload Image</label>
                    <input type={"file"} onChange={OnChangeFile}></input>
                </div>
                <br></br>
                <div className="text-green text-center">{message}</div>
                <button type="button" onClick={mintNFT} className="font-bold mt-10 w-full bg-purple-500 text-white rounded p-2 shadow-lg">
                    Mint NFT
                </button>
            </form>
        </div>
        </div>
    )
}