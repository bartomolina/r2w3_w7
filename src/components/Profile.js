import { useState } from "react";
import { Alchemy, Network } from 'alchemy-sdk'
import NFTTile from "./NFTTile";
import Navbar from "./Navbar";

const config = {
    apiKey: process.env.REACT_APP_ALCHEMY_KEY,
    network: Network.MATIC_MUMBAI,
};
const alchemy = new Alchemy(config);

export default function Profile () {
    const [data, updateData] = useState([]);
    const [dataFetched, updateFetched] = useState(false);
    const [address, updateAddress] = useState("0x");
    const [filterAddress, updateFilterAddress] = useState("");

    const fetchNFTs = async (filter) => {
        const ethers = require("ethers");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const addr = await signer.getAddress();
        
        console.log("Fetching nfts");
        console.log(filter);
        let nfts = filter ? await alchemy.nft.getNftsForOwner(addr, {contractAddresses: [filter]}) :
                        await alchemy.nft.getNftsForOwner(addr);
        console.log(nfts);

        if (nfts) {   
            let items = [];
            nfts.ownedNfts?.forEach((nft) => {
                let item = {
                    contract: nft.contract.address,
                    tokenId: nft.tokenId,
                    image: nft.media ? nft.media[0]?.gateway : "",
                    name: nft.title,
                    description: nft.description,
                }
                items.push(item);
            });

            updateData(items);
            updateFetched(true);
            updateAddress(addr);
        }

        else {
            alert("No items found");
        }
    };

    if(!dataFetched) {
        fetchNFTs();
        updateFetched(true);
    }

    return (
        <div className="profileClass" style={{"minHeight":"100vh"}}>
            <Navbar></Navbar>
            <div className="profileClass">
            <div className="flex text-center flex-col mt-11 md:text-2xl text-white">
                <div className="mb-5">
                    <h2 className="font-bold">Wallet Address</h2>  
                    {address}
                </div>
            </div>
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        <h2 className="font-bold">No. of NFTs</h2>
                        {data.length}
                    </div>
            </div>
            <div className="flex flex-row text-center justify-center mt-10 md:text-2xl text-white">
                    <div>
                        
                        <input
                            style={{"color":"black"}}
                            onChange={(e) => updateFilterAddress(e.target.value)}
                            value={filterAddress}
                            type={"text"}
                            placeholder="Filter by contract address">
                        </input>
                        <button onClick={() => fetchNFTs(filterAddress)}>Reload</button>
                    </div>
            </div>
            <div className="flex flex-col text-center items-center mt-11 text-white">
                <h2 className="font-bold">Your NFTs</h2>
                <div className="flex justify-center flex-wrap max-w-screen-xl">
                    {data.map((value, index) => {
                    return <NFTTile data={value} key={index}></NFTTile>;
                    })}
                </div>
                <div className="mt-10 text-xl">
                    {data.length == 0 ? "Oops, No NFT data to display (Are you logged in?)":""}
                </div>
            </div>
            </div>
        </div>
    )
};