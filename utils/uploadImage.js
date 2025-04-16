import { uploadFileToIPFS } from "./pinata.js";
import fs from 'fs';


(async () => {
  const imageCID = await uploadFileToIPFS(fs.createReadStream("./assets/livingnft.png"));
  console.log("Image IPFS:", imageCID);
})();
