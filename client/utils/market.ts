import { ethers } from "ethers"
import abi from "../app/abi/marketabi"

const contractAddress = "0x96DF61c39067B32044e733169250cFdeC0778eC3"
const nftContractAddress = "0x84D8779e6f128879F99Ea26a2829318867c87721"

export const getContract = () => {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    const signer = provider.getSigner()
    return new ethers.Contract(contractAddress, abi, signer)
  }
  return null
}

export const fetchMarketItems = async () => {
  const contract = getContract()
  if (contract) {
    try {
      const items = await contract.fetchMarketItems()
      console.log(items);
      return items.map((item: any) => ({
        id: item[0].toNumber(),
        nftContract: item[1],
        tokenId: item[2].toNumber(),
        seller: item[3],
        owner: item[4],
        price: ethers.utils.formatEther(item[5]),
        sold: item[6],
        ipfsHash: item[7],
      }))
    } catch (error) {
      console.error("Error fetching market items:", error)
      return []
    }
  }
  return []
}

export const createMarketSale = async (itemId: number, price: string) => {
  const contract = getContract()
  if (contract) {
    try {
      const transaction = await contract.createMarketSale(nftContractAddress, itemId, {
        value: ethers.utils.parseEther(price),
      })
      await transaction.wait()
      return true
    } catch (error) {
      console.error("Error creating market sale:", error)
      return false
    }
  }
  return false
}

