import { useMemo, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Box,
  Paper,
  Typography,
  Button,
  Zoom,
  OutlinedInput,
  InputAdornment,
  InputLabel,
} from "@material-ui/core";
import { Skeleton } from "@material-ui/lab";
import styled from 'styled-components';
import { sign } from 'tweetnacl';
import bs58 from 'bs58';

import useMediaQuery from "@material-ui/core/useMediaQuery";
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useWeb3Context } from "src/hooks/web3Context";
import { createKeypairFromFile } from "src/utils/contract";
import { getSolanaBalance } from "../../slices/AccountSlice";

export default function Transactions() {
  const dispatch = useDispatch();
  const { publicKey, connected, sendTransaction, signMessage } = useWallet();
  const { connection } = useConnection();
  const [walletChecked, setWalletChecked] = useState(false);
  const isSmallScreen = useMediaQuery("(max-width: 705px)");
  const [quantity, setQuantity] = useState("");
  const [msgSignable, setMsgSignable] = useState("");
  const [recipient, setRecipient] = useState("")
  const [programId, setProgramId] = useState()

  // this useEffect fires on state change from above. It will ALWAYS fire AFTER
  useEffect(() => {
    // don't load ANY details until wallet is Checked
    handleSetProgramId()
  }, [walletChecked]);

  const handleSetProgramId = async () => {
    const programKeypair = await createKeypairFromFile();
    setProgramId(programKeypair.publicKey);
  }

  const balance = useMemo(async () => {
    if (connection && publicKey) {
      const tmp = await connection.getBalance(publicKey)
      return tmp
    }
  }, [connection, publicKey])

  const setMax = () => {
    balance.then(r => {
      setQuantity((r / LAMPORTS_PER_SOL))
    })
  }

  const handleSendTransaction = async () => {
    const receiverPubKey = new PublicKey(recipient);
    if (!publicKey) {
      console.log('error', 'Wallet not connected!');
      return;
    }

    let signature = '';
    try {
      console.log(programId.toBase58())
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: receiverPubKey,
          programId: programId,
          lamports: parseFloat(quantity) * LAMPORTS_PER_SOL,
        })
      );

      signature = await sendTransaction(transaction, connection);
      console.log('info', 'Transaction sent:', signature);

      await connection.confirmTransaction(signature, 'processed');
      const balance = await connection.getBalance(publicKey)
      dispatch(getSolanaBalance(balance - parseFloat(quantity) * LAMPORTS_PER_SOL))
      console.log('success', 'Transaction successful!', signature);
    } catch (error) {
      console.log('error', `Transaction failed! ${error?.message}`, signature);
      return;
    }
  }

  const handleSignMessage = async () => {
    try {
      // `publicKey` will be null if the wallet isn't connected
      if (!publicKey) throw new Error('Wallet not connected!');
      // `signMessage` will be undefined if the wallet doesn't support it
      if (!signMessage) throw new Error('Wallet does not support message signing!');

      // Encode anything as bytes
      const message = new TextEncoder().encode(msgSignable);
      // Sign the bytes using the wallet
      const signature = await signMessage(message);
      // Verify that the bytes were signed using the private key that matches the known public key
      if (!sign.detached.verify(message, signature, publicKey.toBytes())) throw new Error('Invalid signature!');

      console.log('success', `Message signature: ${bs58.encode(signature)}`);
    } catch (error) {
      console.log('error', `Signing failed: ${error?.message}`);
    }
  }

  return (
    <Zoom in={true}>
      <Paper className={`ohm-card secondary ${isSmallScreen && "mobile"}`}>
        <div className="card-header">
          <Typography variant="h5">Transactions</Typography>
        </div>
        <div className="card-content">
          {!connected ?
            <>
              <Typography variant="h4">
                <Skeleton width='150px' />
                <Skeleton width='150px' />
                <Skeleton width='150px' />
              </Typography>
            </>
            :
            <>
              <AddressContainer>
                <InputLabel htmlFor="address-input"></InputLabel>
                <OutlinedInput
                  id="address-input"
                  type="text"
                  placeholder="Recipient address"
                  className="stake-input"
                  value={recipient}
                  onChange={e => setRecipient(e.target.value)}
                />
              </AddressContainer>
              <StyledContainer mt={1}>
                <InputLabel htmlFor="amount-input"></InputLabel>
                <OutlinedInput
                  id="amount-input"
                  type="number"
                  placeholder="Enter an amount"
                  className="stake-input"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  labelWidth={0}
                  endAdornment={
                    <InputAdornment position="end">
                      <Button variant="text" onClick={setMax} color="inherit">
                        Max
                      </Button>
                    </InputAdornment>
                  }
                />
                <Button variant='contained' color='primary' onClick={handleSendTransaction}
                  disabled={bs58.decode(recipient).length !== 32}
                >
                  Transfer
                </Button>
              </StyledContainer>
              <StyledContainer mt={1}>
                <InputLabel htmlFor="amount-input"></InputLabel>
                <OutlinedInput
                  id="amount-input"
                  type="text"
                  placeholder="Sign your message"
                  className="stake-input"
                  value={msgSignable}
                  onChange={e => setMsgSignable(e.target.value)}
                  labelWidth={0}
                />
                <Button variant='contained' color='primary' onClick={handleSignMessage}>
                  Sign
                </Button>
              </StyledContainer>
            </>
          }
        </div>
      </Paper>
    </Zoom>
  );
}

const AddressContainer = styled(Box)`
  >div:first-of-type {
    width: 100%;
  }
`

const StyledContainer = styled(Box)`
  display: flex;
  flex-direction: column;
  @media (min-width:513px) {
    flex-direction: row;
  }
  align-items: center;
  >div:first-of-type {
    flex: auto;
    margin-right: 0px;
    margin-bottom: 7px;
    @media (min-width:513px) {
      flex: 1;
      margin-right: 14px;
      margin-bottom: 0px;
    }
  }
`