//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

contract NFTMarketplace is ERC721URIStorage, ERC2981 {
    
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    struct ListedToken {
        address payable seller;
        uint256 price;
    }

    mapping(address => mapping(uint256 => ListedToken) ) private contractToListedToken;
    address royaltiesAddress;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        // Set royalties to 10% for the contract creator
        royaltiesAddress = msg.sender;
        _setDefaultRoyalty(royaltiesAddress, 1000);
    }

    function _burn(uint256 tokenId) internal virtual override {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function createToken(string memory tokenURI) public returns (uint) {
        uint256 currentTokenId = _tokenIds.current();
        
        _safeMint(msg.sender, currentTokenId);
        _setTokenURI(currentTokenId, tokenURI);

        _tokenIds.increment();

        return currentTokenId;
    }

    function createListedToken(address tokenContract, uint256 tokenId, uint256 price) public {
        require(price > 0, "Make sure the price isn't negative");
        contractToListedToken[tokenContract][tokenId] = ListedToken(
            payable(msg.sender),
            price
        );
    }

    function delistToken(address tokenContract, uint256 tokenId) public {
        delete contractToListedToken[tokenContract][tokenId];
    }

    function executeSale(address tokenContract, uint256 tokenId) public payable {
        uint price = contractToListedToken[tokenContract][tokenId].price;
        require(msg.value == price, "Please submit the asking price for the NFT in order to purchase");
        address seller = contractToListedToken[tokenContract][tokenId].seller;

        // Calculate royalties
        (address receiver, uint256 royaltyAmount) = royaltyInfo(tokenId, msg.value);
        
        payable(receiver).transfer(royaltyAmount);
        payable(seller).transfer(msg.value - royaltyAmount);
        IERC721 NFTContract = IERC721(tokenContract);
        NFTContract.safeTransferFrom(seller, msg.sender, tokenId);

        delete contractToListedToken[tokenContract][tokenId];
        _itemsSold.increment();
    }

    function getListing(address tokenContract, uint256 tokenId) public view returns (ListedToken memory) {
        return contractToListedToken[tokenContract][tokenId];
    }
}