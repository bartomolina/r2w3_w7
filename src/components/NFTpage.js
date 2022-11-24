import Navbar from "./Navbar";
import { useParams } from 'react-router-dom';
import { useState } from "react";
import { Alchemy, Network } from 'alchemy-sdk'

import MarketplaceJSON from "../Marketplace.json";

const config = {
    apiKey: process.env.REACT_APP_ALCHEMY_KEY,
    network: Network.MATIC_MUMBAI,
};
const alchemy = new Alchemy(config);

export default function NFTPage (props) {

    const [data, updateData] = useState({});
    const [dataFetched, updateDataFetched] = useState(false);
    const [message, updateMessage] = useState("");
    const [currAddress, updateCurrAddress] = useState("0x");
    const [listingAmount, updateListingAmount] = useState("0.1");

    const fetchNFT = async (contractId, tokenId) => {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();

        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

        let nft = await alchemy.nft.getNftMetadata(contractId, tokenId);
        let owners = await alchemy.nft.getOwnersForNft(contractId, tokenId);
        let owner = owners.owners[0];

        let item = {
            contract: nft.contract.address,
            tokenId: nft.tokenId,
            image: nft.media ? nft.media[0]?.gateway : "",
            name: nft.title,
            description: nft.description,
            owner: owner,
        }

        let listedToken = await contract.getListing(nft.contract.address, tokenId);

        if(listedToken.seller != ethers.constants.AddressZero) {
            item.price = ethers.utils.formatUnits(listedToken.price, "ether");
            item.seller = listedToken.seller;
        }

        updateData(item);
        updateDataFetched(true);
        updateCurrAddress(addr);
    }

    async function listNFT(tokenId) {

        try {
            const ethers = require("ethers");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            // Approve contract
            const ABI = [
                'function setApprovalForAll(address operator, bool _approved)',
                'function safeTransferFrom(address from, address to, uint256 tokenId)',
                'function isApprovedForAll(address owner, address operator) view returns (bool)'
            ];
            let NFTContract = new ethers.Contract(data.contract, ABI, signer);

            // Approve token spending to the marketplace contract
            let checkApproval = await NFTContract.isApprovedForAll(currAddress, MarketplaceJSON.address);

            if(!checkApproval) {
                console.log("Setting spending approval");
                let approval = await NFTContract.setApprovalForAll(MarketplaceJSON.address, true);
                await approval.wait();
                console.log("Spending approved");
            }

            // List in the marketplace
            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(listingAmount, 'ether');

            console.log("Creating listing");
            let transaction = await contract.createListedToken(data.contract, tokenId, salePrice);
            await transaction.wait();
            console.log("Token listed");

            alert('Your NFT has been successfully listed');
            updateMessage("");
        }
        catch(e) {
            alert("Listing Error"+e)
        }
    }

    async function delistNFT(tokenId) {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);

        console.log("Delisting token");
        let transaction = await contract.delistToken(data.contract, tokenId);
        await transaction.wait();
        console.log("Token delisted");
    }

    async function buyNFT(contractId, tokenId) {
        try {
            const ethers = require("ethers");
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const signer = provider.getSigner();

            let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
            const salePrice = ethers.utils.parseUnits(data.price.toString(), 'ether')
            updateMessage("Buying the NFT... Please Wait (Upto 5 mins)")
            
            console.log("Transferring the NFT");
            console.log(contractId);
            console.log(tokenId);
            let transaction = await contract.executeSale(contractId, tokenId, {value:salePrice});
            await transaction.wait();
            console.log("NFT has been transferred");

            alert('You successfully bought the NFT!');
            updateMessage("");
        }
        catch(e) {
            alert("Upload Error"+e)
        }
    }

    const params = useParams();
    const tokenId = params.tokenId;
    const contractId = params.contractId;
    if(!dataFetched) {
        fetchNFT(contractId, tokenId);
    }

    return(
        <div style={{"minHeight":"100vh"}}>
            <Navbar></Navbar>
            <div className="flex ml-20 mt-20">
                <img src={data.image} alt="" className="w-2/5" />
                <div className="text-xl ml-20 space-y-8 text-white shadow-2xl rounded-lg border-2 p-5">
                    <div>
                        Name: {data.name}
                    </div>
                    <div>
                        Description: {data.description}
                    </div>
                    <div>
                        Price: <span className="">{data.price + " ETH"}</span>
                    </div>
                    <div>
                        Owner: <span className="text-sm">{data.owner}</span>
                    </div>
                    <div>
                        Seller: <span className="text-sm">{data.seller}</span>
                    </div>
                    <div>
                    { currAddress.toLowerCase() == data.owner?.toLowerCase() && !data.seller &&
                        <>
                            <div className="text-emerald-700">You are the owner of this NFT</div>
                            <input style={{"color":"black"}} onChange={(e) => { updateListingAmount(e.target.value) }} value={listingAmount} type={"text"}></input>
                            <br/>
                            <br/>
                            <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => listNFT(tokenId)}>List this NFT</button>
                        </>
                    }
                    { currAddress.toLowerCase() == data.owner?.toLowerCase() && data.seller &&
                        <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => delistNFT(tokenId)}>Delist this NFT</button>
                    }
                    { currAddress.toLowerCase() != data.seller?.toLowerCase() && data.price &&
                        <button className="enableEthereumButton bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm" onClick={() => buyNFT(contractId, tokenId)}>Buy this NFT</button>
                    }
                    <div className="text-green text-center mt-3">{message}</div>
                    </div>
                </div>
            </div>
        </div>
    )
}