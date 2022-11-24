import Navbar from "./Navbar";
import NFTTile from "./NFTTile";
import MarketplaceJSON from "../Marketplace.json";
import axios from "axios";
import { Alchemy, Network } from 'alchemy-sdk'
import { useState } from "react";

const config = {
    apiKey: process.env.REACT_APP_ALCHEMY_KEY,
    network: Network.MATIC_MUMBAI,
};
const alchemy = new Alchemy(config);

export default function Marketplace() {
const [data, updateData] = useState([]);
const [filterAddress, updateFilterAddress] = useState("");
const [filterTokenId, updateFilterTokenId] = useState(0);

async function fetchNFTs(contractId, tokenId) {
    const ethers = require("ethers");

    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();

    let contract = new ethers.Contract(MarketplaceJSON.address, MarketplaceJSON.abi, signer);
    let listedToken = await contract.getListing(contractId, tokenId);
    console.log(contractId, tokenId);
    console.log(listedToken);

    if(listedToken.seller != ethers.constants.AddressZero) {
        let nft = await alchemy.nft.getNftMetadata(contractId, tokenId);
        if (nft) {
            let items = [];
            let item = {
                contract: nft.contract.address,
                tokenId: nft.tokenId,
                seller: listedToken.seller,
                image: nft.media ? nft.media[0]?.gateway : "",
                name: nft.title,
                description: nft.description,
            }
            items.push(item)
            item.price = ethers.utils.formatUnits(listedToken.price, "ether");
            item.seller = listedToken.seller;
            updateData(items);
        }
    } else {
        alert("Item not listed in the marketplace");
    }
}

return (
    <div>
        <Navbar></Navbar>
        <div className="flex flex-col place-items-center mt-20">
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                <div>
                    <div>
                        <input
                            style={{"color":"black"}}
                            onChange={(e) => updateFilterAddress(e.target.value)}
                            value={filterAddress}
                            type={"text"}
                            placeholder="Contract address">
                        </input>
                    </div>
                    <div>
                        <input
                            style={{"color":"black"}}
                            onChange={(e) => updateFilterTokenId(e.target.value)}
                            value={filterTokenId}
                            type={"text"}
                            placeholder="Token Id">
                        </input>
                    </div>
                    <button onClick={() => fetchNFTs(filterAddress, filterTokenId)}>Reload</button>
                </div>
            </div>
            <div className="flex mt-5 justify-between flex-wrap max-w-screen-xl text-center">
                {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                })}
            </div>
        </div>            
    </div>
);

}